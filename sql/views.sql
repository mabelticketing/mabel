/**
 * Copyright (C) 2015  Mabel Ticketing
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

/*
 To be optimised/refined:
 finds the remaining allowance for a user with ID 2 in group 2 for all ticket types
*/
-- SELECT user_id, MIN( allowance - IFNULL( bought, 0 ) ) allowance, ticket_type_id
-- 	-- check which ticket groups we have access to
-- 	FROM group_access_right
-- 	-- and which tickets those groups actually contain
-- 	JOIN ticket_group_pairs
-- 		ON ticket_group_pairs.ticket_group_id = group_access_right.ticket_group_id
-- 	-- and how many tickets have been bought within those groups
-- 	-- Left join means we have 'null' where no tickets have been bought
-- 	LEFT JOIN user_bought_by_group
-- 		ON group_access_right.group_id = user_bought_by_group.group_id
-- 	-- only consider access rights which are currently open
-- 	WHERE open_time < UNIX_TIMESTAMP()
-- 		AND close_time > UNIX_TIMESTAMP()
-- 		AND group_id = 2
-- 		GROUP BY ticket_type_id;
--
/*
 | user_group_id | ticket_type_id | allowance |
*/

-- CREATE OR REPLACE VIEW current_ticket_allowance AS
-- SELECT group_id, ticket_group_membership.ticket_group_id, ticket_type_id, MIN(allowance) allowance
-- FROM group_access_right
-- JOIN ticket_group_membership
-- 	ON ticket_group_membership.ticket_group_id=group_access_right.ticket_group_id
-- GROUP BY group_id, ticket_type_id;

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
Get the number of tickets bought by a particular user in each ticket group
(includes user group membership for easy joining with access rights)
*/
CREATE OR REPLACE VIEW user_bought_by_group AS
	SELECT ticket_group_id, user_bought_by_type.user_id, SUM( bought ) bought
	FROM ticket_group_membership
	JOIN user_bought_by_type
		ON ticket_group_membership.ticket_type_id = user_bought_by_type.ticket_type_id
	GROUP BY ticket_group_id, user_bought_by_type.user_id;

CREATE OR REPLACE VIEW current_group_allowance AS
SELECT
	user_group_membership.user_id,
	MAX(IFNULL(allowance,9999)) allowance,
	MAX(IFNULL(allowance, 9999)) - SUM(IFNULL(bought,0)) remaining,
	group_access_right.ticket_group_id,
	ticket_group.description,
	ticket_group.name
FROM group_access_right
JOIN user_group_membership
	ON group_access_right.group_id=user_group_membership.group_id
LEFT JOIN user_bought_by_group
	ON user_bought_by_group.user_id=user_group_membership.user_id
		AND user_bought_by_group.ticket_group_id=group_access_right.ticket_group_id
JOIN ticket_group
	ON group_access_right.ticket_group_id=ticket_group.id
WHERE open_time<UNIX_TIMESTAMP()
	AND UNIX_TIMESTAMP()<close_time
GROUP BY user_id, ticket_group_id;

/*
Get the number of tickets of each type bought by a particular user
 */
CREATE OR REPLACE VIEW user_bought_by_type AS
SELECT user_id,
		ticket_type_id,
		COUNT(*) bought
	FROM ticket
	WHERE (status='CONFIRMED'OR status='PENDING'OR status='ADMITTED'OR status='PENDING_WL')
	GROUP BY user_id, ticket_type_id;


CREATE OR REPLACE VIEW user_max_allowance AS
	SELECT ticket_group_id, user_group_membership.group_id, user_group_membership.user_id, MAX(IFNULL(allowance,9999)) allowance
	FROM group_access_right
	JOIN user_group_membership
		ON user_group_membership.group_id=group_access_right.group_id
	WHERE open_time<unix_timestamp()
		AND unix_timestamp()<close_time
	GROUP BY user_id, ticket_group_id, user_group_membership.group_id;

/* gets the number of tickets of each type available for purchase by each user */
CREATE OR REPLACE VIEW current_remaining_ticket_allowance AS
SELECT
	user_max_allowance.user_id,
	user_max_allowance.ticket_group_id,
	ticket_type_id,
	-- NB I'm making the simplifying assumption here that users only exist in one group
	-- otherwise we couldn't simply do MIN (since users should get their highest group's allowance)
	MIN(allowance) allowance,
	MIN(allowance-IFNULL(bought,0)) remaining
FROM  user_max_allowance
LEFT JOIN user_bought_by_group
	ON user_max_allowance.user_id=user_bought_by_group.user_id
	AND user_max_allowance.ticket_group_id=user_bought_by_group.ticket_group_id
JOIN ticket_group_membership
	ON ticket_group_membership.ticket_group_id=user_max_allowance.ticket_group_id
GROUP BY user_id, ticket_type_id, ticket_group_id;

/*
Get the number of tickets bought by a particular user, grouped by payment method
 */
CREATE OR REPLACE VIEW user_bought_by_payment_method AS
SELECT user_id,
		payment_method_id,
		COUNT(*) bought
	FROM ticket
	WHERE (status='CONFIRMED'OR status='PENDING'OR status='ADMITTED'OR status='PENDING_WL')
	GROUP BY user_id, payment_method_id;

/*
Get the number of tickets bought by a particular user overall
*/
-- CREATE OR REPLACE VIEW user_bought AS
-- SELECT user_id, SUM(bought) bought
--    FROM user_bought_by_type
--    GROUP BY user_id;

/*
Get the overall allowance for a user, given all the groups he is a member of
 */
-- CREATE OR REPLACE VIEW user_group_allowance AS
-- SELECT user_id, MAX(overall_allowance) overall_allowance
--    FROM user_group
--    JOIN user_group_membership ON user_group.id=user_group_membership.group_id
--    GROUP BY user_id;

/*
Combine tickets with all possible groups they could have come from
*/
-- CREATE OR REPLACE VIEW ticket_group_pairs AS
-- SELECT ticket_type_id, ticket_group_id, overall_limit
-- 	FROM ticket_type
-- 	JOIN ticket_group_membership ON ticket_group_membership.ticket_type_id=ticket_type.id
-- 	JOIN ticket_group  ON ticket_group.id=ticket_group_membership.ticket_group_id;

-- CREATE OR REPLACE VIEW user_group_pairs AS
-- SELECT user_id, group_id
-- 	FROM user_group_membership
-- 	JOIN user_group  ON user_group.id=user_group_membership.group_id;

/*
Get the user's remaining overall allowance -- i.e. the number of tickets that this user is allowed to buy overall,
given the groups he is a member of and the tickets he has already bought.
Example output:
+---------+---------------------+
| user_id | remaining_allowance |
+---------+---------------------+
|     298 |                   5 |
|     301 |                   7 |
*/
-- CREATE OR REPLACE VIEW user_group_remaining_allowance AS
-- SELECT user_group_allowance.user_id,
-- 	   overall_allowance,
-- 	   overall_allowance - IFNULL(bought, 0) AS remaining_allowance
-- FROM user_group_allowance
-- LEFT JOIN user_bought
-- ON user_group_allowance.user_id=user_bought.user_id;

/* UNDOCUMENTED VIEWS SOZ */

CREATE OR REPLACE VIEW tickets_sold AS
	SELECT ticket_type_id,
		PENDING + CONFIRMED + ADMITTED sold,
		PENDING_WL waiting_list
	FROM ticket_status_count;

CREATE OR REPLACE VIEW tickets_sold_by_group AS
SELECT ticket_group_id, SUM(sold) sold, SUM(waiting_list) waiting_list
FROM ticket_group_membership
JOIN tickets_sold
	ON ticket_group_membership.ticket_type_id=tickets_sold.ticket_type_id
	GROUP BY ticket_group_id;

CREATE OR REPLACE VIEW ticket_limits AS
SELECT ticket_type_id, ticket_group.id ticket_group_id, MIN(overall_limit-IFNULL(sold,0)) remaining, MIN(overall_limit) overall_limit
FROM ticket_group
LEFT JOIN tickets_sold_by_group
	ON ticket_group.id=tickets_sold_by_group.ticket_group_id
JOIN ticket_group_membership
ON ticket_group_membership.ticket_group_id=ticket_group.id
GROUP BY ticket_type_id, ticket_group_id;


CREATE OR REPLACE VIEW accessible_types AS
SELECT
	ticket_type.id ticket_type_id,
	user_id,
	name,
	price,
	IF(IFNULL(PENDING_WL,0)>0,
		0, ticket_limits.remaining) available,
	overall_limit,
	current_remaining_ticket_allowance.remaining allowance,
	current_remaining_ticket_allowance.allowance original_allowance
FROM ticket_limits
LEFT JOIN ticket_status_count
	ON ticket_status_count.ticket_type_id=ticket_limits.ticket_type_id
JOIN ticket_type
	ON ticket_limits.ticket_type_id=ticket_type.id
JOIN current_remaining_ticket_allowance
	ON current_remaining_ticket_allowance.ticket_type_id=ticket_type.id;

CREATE OR REPLACE VIEW insert_ticket_status AS
	SELECT
		user_id,
		ticket_type_id,
		price transaction_value,
		UNIX_TIMESTAMP() book_time,
		-- if there are no tickets available, we should instead insert to the waiting list
		IF( available>0, "PENDING", "PENDING_WL" ) status
	FROM accessible_types
	WHERE allowance > 0;

-- CREATE OR REPLACE VIEW user_group_type_update AS
-- SELECT group_id
-- 	,group_access_right.ticket_type_id
-- 	,total_limit
-- 	,allowance
-- 	,IFNULL(sold, 0) sold
-- 	,IF(C.waiting_list>0, 0, total_limit - IFNULL(sold, 0)) available
-- FROM group_access_right
-- LEFT JOIN tickets_sold C ON group_access_right.ticket_type_id = C.ticket_type_id
-- INNER JOIN ticket_type ON ticket_type.id = group_access_right.ticket_type_id
-- WHERE open_time < UNIX_TIMESTAMP()
-- 	AND close_time > UNIX_TIMESTAMP();
--
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

/* Get the ticket types available for the given user id to book. The ticket
limit takes into account the amount of tickets sold and the waiting list rule
(if there are others in the waiting list, you can't book any). It also returns
per-type allowance, both with and without considering how many tickets have
been bought already.
*/
DROP PROCEDURE IF EXISTS get_accessible_types//
CREATE PROCEDURE get_accessible_types (IN inputid int)

BEGIN
	SELECT id,
		name,
		price,
		IF(C.wl>0, 0, -- if the waiting list is not empty, say the limit is 0
			total_limit - IFNULL(C.sold,0) -- otherwise the limit is reduced by however many we've sold
			) available,
		LEAST(
			IFNULL(allowance, total_limit) - IFNULL(user_bought_by_type.bought, 0),
			user_group_remaining_allowance.remaining_allowance) remaining_allowance,
		allowance type_allowance
	FROM ticket_type
	-- get access rights and allowance information
	JOIN
	(SELECT ticket_type_id,
	-- tricky because we want to preserve 'null'. If the allowance is null for one window, then we are allowed unlimited tickets
	CASE WHEN MAX(CASE WHEN allowance is NULL THEN 1 ELSE 0 END)=0 THEN MAX(allowance) END allowance
	FROM
	-- find the groups we have access to
	(SELECT *
	FROM user_group_membership
	WHERE user_id=inputid) A
	-- find what ticket types that gives us access to
	JOIN group_access_right
	ON A.group_id=group_access_right.group_id
	-- only count access rights which are currently open
	WHERE open_time<UNIX_TIMESTAMP()
	AND close_time>UNIX_TIMESTAMP()
	GROUP BY ticket_type_id) B
	ON B.ticket_type_id=ticket_type.id
	-- get availability information
	LEFT JOIN -- left join so that tickets we've got no sales for still show up
		-- get the number sold/in the waiting list for each ticket type
		(SELECT ticket_type_id,
			PENDING_WL wl,
			PENDING + CONFIRMED + ADMITTED sold
		FROM ticket_status_count) C
	ON C.ticket_type_id=id
	-- get the number of tickets bought so far of this type
	LEFT JOIN user_bought_by_type
	ON user_bought_by_type.user_id=inputid AND user_bought_by_type.ticket_type_id=ticket_type.id
	-- get overall group limits too
	LEFT JOIN user_group_remaining_allowance ON user_group_remaining_allowance.user_id=inputid;
END//


/* Get the ticket types which will be available in future for the given user id to book.
The ticket limit takes into account the amount of tickets sold and the waiting
list rule (if there are others in the waiting list, you can't book any). It
doesn't take into account allowances.
It also returns allowance, considering how many tickets have been bought already.
*/
DROP PROCEDURE IF EXISTS get_future_accessible_types//
CREATE PROCEDURE get_future_accessible_types (IN inputid int)

BEGIN
	SELECT id,
		name,
		price,
		allowance type_allowance
	FROM ticket_type
	-- get access rights and allowance information
	JOIN
	(SELECT ticket_type_id,
	-- tricky because we want to preserve 'null'. If the allowance is null for one window, then we are allowed unlimited tickets
	CASE WHEN MAX(CASE WHEN allowance is NULL THEN 1 ELSE 0 END)=0 THEN MAX(allowance) END allowance
	FROM
	-- find the groups we have access to
	(SELECT *
	FROM user_group_membership
	WHERE user_id=inputid) A
	-- find what ticket types that gives us access to
	JOIN group_access_right
	ON A.group_id=group_access_right.group_id
	-- only count access rights which will open in the future
	WHERE open_time>UNIX_TIMESTAMP()
	AND close_time>UNIX_TIMESTAMP()
	GROUP BY ticket_type_id) B
	ON B.ticket_type_id=ticket_type.id;
END//

/* insert tickets one at a time to make sure we don't go over.
It works by selecting our set of values once for each row in the inner SELECT'd table.
NB - it does not take into account user allowances
*/
-- DROP PROCEDURE IF EXISTS safe_add_ticket//
-- CREATE PROCEDURE safe_add_ticket (IN _user_id int, IN _ticket_type_id int, IN _guest_name varchar(128), IN _donation boolean, IN _payment_method_id int, IN _transaction_value DECIMAL(6,2))
--
-- BEGIN
-- 	INSERT INTO ticket \
-- 		(user_id, ticket_type_id, guest_name, donation, transaction_value, payment_method_id, status, book_time) \
--
-- 	-- prepare the row of data we'd like to insert. "SELECT" will pull out a
-- 	-- row of values once for each row in a given table. Here we're hacking this
-- 	-- slightly by providiner a row of constant values to use, and it will
-- 	-- repeat it once for each row in the inner table. We make the inner table
-- 	-- have either 1 or 0 rows.
-- 	SELECT _user_id, _ticket_type_id, _guest_name, _donation, _transaction_value, _payment_method_id, 'PENDING', UNIX_TIMESTAMP() \
-- 	FROM \
-- 		-- this table will have 1 row, containing 1 value - the number of tickets sold
-- 		(SELECT COUNT(*) sold
-- 			FROM ticket
-- 			WHERE ticket_type_id=_ticket_type_id AND (status='PENDING' OR status='CONFIRMED' OR status='ADMITTED')) A \
-- 		JOIN \
-- 		-- this table will have 1 row, containing 1 value - the limit for this ticket type
-- 		(SELECT total_limit cap FROM ticket_type WHERE id=_ticket_type_id) B \
-- 		JOIN \
-- 		-- this table will have 1 row, containing 1 value - the number of people in the waiting list
-- 		(SELECT COUNT(*) AS wl FROM ticket WHERE ticket_type_id=_ticket_type_id AND status='PENDING_WL') C \
-- 		-- if we've sold up to the limit or there are people waiting, then this
-- 		-- condition is false, and we select 0 rows instead of 1 as planned.
-- 		-- Nothing gets inserted.
-- 		WHERE B.cap>A.sold AND C.wl<1;
-- 	SELECT LAST_INSERT_ID() AS insertId, ROW_COUNT() AS rowsAffected;
-- END//
--

DROP PROCEDURE IF EXISTS user_payment_types//
CREATE PROCEDURE user_payment_types (IN _user_id int)
	BEGIN
		SELECT payment_method.id,
			   name,
			   description
			FROM payment_method
				JOIN
					-- See which payment methods our groups give us access to
					(SELECT DISTINCT(payment_method_id) FROM
						(SELECT * FROM user_group_membership WHERE user_id=_user_id) A
							JOIN group_payment_method_access
							ON A.group_id=group_payment_method_access.group_id) B
				ON B.payment_method_id=payment_method.id
				LEFT JOIN
					(SELECT payment_method_id AS id, bought FROM user_bought_by_payment_method
						WHERE user_bought_by_payment_method.user_id=_user_id) C
				ON C.id=payment_method.id;
	END//

DROP PROCEDURE IF EXISTS safe_add_ticket//
CREATE PROCEDURE safe_add_ticket (IN _user_id int, IN _ticket_type_id int, IN _guest_name varchar(128), IN _donation boolean, IN _payment_method_id int )

	BEGIN
		INSERT INTO ticket \
			(user_id, ticket_type_id, guest_name, donation, transaction_value, payment_method_id, status, book_time) \
			(SELECT
				user_id,
				ticket_type_id,
				_guest_name guest_name,
				_donation donation,
				price transaction_value,
				_payment_method_id payment_method_id,
				IF(available>0, "PENDING", "PENDING_WL") status,
				UNIX_TIMESTAMP() book_time
			FROM accessible_types
			WHERE allowance > 0 AND
			      user_id = _user_id AND
			      ticket_type_id = _ticket_type_id);
	SELECT *, LAST_INSERT_ID() AS insertId, ROW_COUNT() AS rowsAffected FROM ticket WHERE id=LAST_INSERT_ID();

	END//
DELIMITER ;
