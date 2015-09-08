/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

/* Get total amounts in each status for each ticket type.
Example output:
+----------------+---------+-----------+-----------+----------+------------+--------------+
| ticket_type_id | PENDING | CONFIRMED | CANCELLED | ADMITTED | PENDING_WL | CANCELLED_WL |
+----------------+---------+-----------+-----------+----------+------------+--------------+
|              1 |       5 |        70 |         0 |     1024 |         99 |            0 |
|              2 |       0 |        10 |         0 |       94 |         98 |            0 |

*/
CREATE OR REPLACE VIEW ticket_status_count AS
SELECT ticket_type_id,
       SUM(IF(status='PENDING', 1, 0)) PENDING,
       SUM(IF(status='CONFIRMED', 1, 0)) CONFIRMED,
       SUM(IF(status='CANCELLED', 1, 0)) CANCELLED,
       SUM(IF(status='ADMITTED', 1, 0)) ADMITTED,
       SUM(IF(status='PENDING_WL', 1, 0)) PENDING_WL,
       SUM(IF(status='CANCELLED_WL', 1, 0)) CANCELLED_WL
FROM ticket
GROUP BY ticket_type_id;

/*
Get the number of tickets of each type bought by a particular user
 */
CREATE OR REPLACE VIEW user_bought_by_type AS
SELECT user_id,
		ticket_type_id,
		COUNT(*) bought
	FROM ticket
	WHERE (status='CONFIRMED'OR status='PENDING'OR status='ATTENDING'OR status='PENDING_WL')
	GROUP BY user_id, ticket_type_id;

/* 
Get the number of tickets bought by a particular user overall 
*/
CREATE OR REPLACE VIEW user_bought AS 
SELECT user_id, SUM(bought) bought
   FROM user_bought_by_type
   GROUP BY user_id;

/* 
Get the user's remaining allowance -- i.e. the number of tickets that this user is allowed to buy overall,
given the groups he is a member of and the tickets he has already bought.
Example output:
+---------+-----------+
| user_id | allowance |
+---------+-----------+
|     298 |         5 |
|     301 |         7 |
*/
CREATE OR REPLACE VIEW user_group_allowance AS
SELECT user_group_limit.user_id,
	   l - IFNULL(bought, 0) AS allowance
FROM user_group_limit
LEFT JOIN user_bought
ON user_group_limit.user_id=user_bought.user_id;

/*
Get the largest limit for a user, given all the groups he is a member of
 */
CREATE OR REPLACE VIEW user_group_limit AS 
SELECT user_id, MAX(ticket_limit) l
   FROM user_group
   JOIN user_group_membership ON user_group.id=user_group_membership.group_id
   GROUP BY user_id;

/* PROCEDURES

	Note that procedures are annoying because we can't include them as part of
	a bigger result. What they do allow us to do is cut down the search space
	deep inside the query so that the tables being manipulated are not too
	large. I think it will siginificantly help performance but I haven't
	tested.

	For example, in get_accessible_types the alternative to using a procedure
	would be to create a view accessible_types which would calculate
	accessible types for every single user, and then we'd have to select *
	from it where user_id=?.

 */

DELIMITER //

/* Get the ticket types available for the given user id to book. 
The ticket limit takes into account the amount of tickets sold and the waiting
list rule (if there are others in the waiting list, you can't book any). It 
doesn't take into account overall group ticket limits, nor payment method limits.
It also returns per-user and group ticket limits, considering how many tickets have been bought already.

Example output:

+----+------------+--------+--------------+
| id | name       | price  | ticket_limit |
+----+------------+--------+--------------+
|  2 | Queue Jump | 145.00 |            0 |
|  3 | Dining     | 165.00 |            2 |
|  1 | Standard   | 135.00 |            0 |
+----+------------+--------+--------------+
*/
DROP PROCEDURE IF EXISTS get_accessible_types//
CREATE PROCEDURE get_accessible_types (IN inputid int)

BEGIN
	SELECT id,
		name,
		price,
		IF(C.wl>0, 0, # if the waiting list is not empty, say the limit is 0
			ticket_limit - IFNULL(C.sold,0) # otherwise the limit is reduced by however many we've sold
			) available,
		GREATEST(
			per_user_limit - IFNULL(user_bought_by_type.bought, 0),
			user_group_allowance.allowance) allowance
	FROM ticket_type
	# get access rights information
	JOIN 
		(SELECT DISTINCT(ticket_type_id)
		FROM
			# find the groups we have access to
			(SELECT *
				FROM user_group_membership
				WHERE user_id=inputid) A
		# find what ticket types that gives us access to
		JOIN group_access_right 
		ON A.group_id=group_access_right.group_id
		# only count access rights which are currently open
		WHERE open_time<UNIX_TIMESTAMP()
		AND close_time>UNIX_TIMESTAMP()) B 
	ON B.ticket_type_id=ticket_type.id
	# get availability information
	LEFT JOIN # left join so that tickets we've got no entries for still show up
		# get the number sold/in the waiting list for each ticket type
		(SELECT ticket_type_id,
			PENDING_WL wl,
			PENDING + CONFIRMED + ADMITTED sold 
		FROM ticket_status_count) C 
	ON C.ticket_type_id=id
	# get the number of tickets bought so far of this type
	LEFT JOIN user_bought_by_type
	ON user_bought_by_type.user_id=inputid AND user_bought_by_type.ticket_type_id=ticket_type.id
	# get group limits too
	LEFT JOIN user_group_allowance ON user_group_allowance.user_id=inputid;
END//

/* insert tickets one at a time to make sure we don't go over. 
It works by selecting our set of values once for each row in the inner SELECT'd table. */
DROP PROCEDURE IF EXISTS safe_add_ticket//
CREATE PROCEDURE safe_add_ticket (IN _user_id int, IN _ticket_type_id int, IN _guest_name varchar(128), IN _donation boolean, IN _payment_method_id int, IN _transaction_value DECIMAL(6,2))

BEGIN
	INSERT INTO ticket \
		(user_id, ticket_type_id, guest_name, donation, transaction_value, payment_method_id, status, book_time) \
	
	# prepare the row of data we'd like to insert. "SELECT" will pull out a
	# row of values once for each row in a given table. Here we're hacking this
	# slightly by providine a row of constant values to use, and it will
	# repeat it once for each row in the inner table. We make the inner table
	# have either 1 or 0 rows.
	SELECT _user_id, _ticket_type_id, _guest_name, _donation, _transaction_value, _payment_method_id, 'PENDING', UNIX_TIMESTAMP() \
	FROM \
		# this table will have 1 row, containing 1 value - the number of tickets sold
		(SELECT COUNT(*) sold 
			FROM ticket 
			WHERE ticket_type_id=_ticket_type_id AND (status='PENDING' OR status='CONFIRMED' OR status='ADMITTED')) A \
		JOIN \
		# this table will have 1 row, containing 1 value - the limit for this ticket type
		(SELECT ticket_limit cap FROM ticket_type WHERE id=_ticket_type_id) B \
		JOIN \
		# this table will have 1 row, containing 1 value - the number of people in the waiting list
		(SELECT COUNT(*) AS wl FROM ticket WHERE ticket_type_id=_ticket_type_id AND status='PENDING_WL') C \
		# if we've sold up to the limit or there are people waiting, then this
		# condition is false, and we select 0 rows instead of 1 as planned.	
		# Nothing gets inserted.
		WHERE B.cap>A.sold AND C.wl<1;
END//




DELIMITER ;