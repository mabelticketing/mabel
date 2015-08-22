/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

### Useful Views ###
CREATE  OR REPLACE VIEW ticket_summary AS 
	SELECT 
		ticket_type.id id, 
		ticket_type.name name, 
		COUNT(ticket.id) sold, 
		ticket_type.ticket_limit ticket_limit, 
		ticket_type.ticket_limit-COUNT(ticket.id) available 
	FROM 
		ticket 
		RIGHT JOIN 
			ticket_type 
		ON 
			ticket.ticket_type_id=ticket_type.id 
	GROUP BY ticket_type.id;

CREATE OR REPLACE VIEW waiting_list_summary AS 
	SELECT 
		ticket_type.id id, 
		ticket_type.name name, 
		COUNT(waiting_list.id) sold
	FROM 
		waiting_list 
		RIGHT JOIN 
			ticket_type 
		ON 
			waiting_list.ticket_type_id=ticket_type.id 
	GROUP BY ticket_type.id;

CREATE OR REPLACE VIEW tickets_grouped_by_user AS 
	SELECT MIN(ticket.id) id, user_id, user.name name, GROUP_CONCAT(ticket.id ORDER BY ticket.id ASC SEPARATOR ', ') tickets
		FROM ticket
	JOIN user 
		ON user.id=user_id
		GROUP BY user_id; 

CREATE OR REPLACE VIEW transaction_with_tickets AS
	SELECT transaction.id id, value, payment_method.name payment_method, notes, tickets, transaction_time
	FROM transaction
	JOIN payment_method
		ON payment_method.id = payment_method_id
	JOIN 
		tickets_grouped_by_user
		ON tickets_grouped_by_user.user_id = transaction.user_id;
