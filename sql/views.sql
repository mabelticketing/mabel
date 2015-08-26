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


/* PROCEDURES

	Note that procedures are annoying because we can't include them as part of
	a bigger result. What they do allow us to do is cut down the search space
	deep inside the query so that the tables being  manupulated are not too
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
			) ticket_limit
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
			PENDING + CONFIRMED + CANCELLED + ADMITTED sold 
		FROM ticket_status_count) C 
	ON C.ticket_type_id=id;
END//

DELIMITER ;