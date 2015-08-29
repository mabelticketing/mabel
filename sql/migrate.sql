insert into ticket_type select id, name, price, ticket_limit from mabel.ticket_type;
insert into user select * from mabel.user;
insert into user_group select * from mabel.user_group;
insert into user_group_membership select * from mabel.user_group_membership;
insert into group_access_right (select group_access_right.id, group_id, ticket_type_id, launch_time as open_time, 1464735600 as close_time from mabel.group_access_right, mabel.event);
insert into payment_method select id, name, description, ticket_limit from mabel.payment_method;
insert into group_payment_method_access select * from mabel.group_payment_method_access;

insert into ticket (select ticket.id, user_id, ticket_type_id, guest_name, payment_method_id, book_time, 0 AS donation, price AS transaction_value, '' AS notes, 'PENDING' as status from mabel.ticket JOIN mabel.ticket_type ON ticket.ticket_type_id = ticket_type.id WHERE status_id=1 AND ticket_type_id<>5);
insert into ticket (select ticket.id, user_id, ticket_type_id, guest_name, payment_method_id, book_time, 0 AS donation, price AS transaction_value, '' AS notes, 'CONFIRMED' as status from mabel.ticket JOIN mabel.ticket_type ON ticket.ticket_type_id = ticket_type.id WHERE status_id=2 AND ticket_type_id<>5);
insert into ticket (select ticket.id, user_id, ticket_type_id, guest_name, payment_method_id, book_time, 0 AS donation, price AS transaction_value, '' AS notes, 'CANCELLED' as status from mabel.ticket JOIN mabel.ticket_type ON ticket.ticket_type_id = ticket_type.id WHERE status_id=3 AND ticket_type_id<>5);
insert into ticket (select ticket.id, user_id, ticket_type_id, guest_name, payment_method_id, book_time, 0 AS donation, price AS transaction_value, '' AS notes, 'ADMITTED' as status from mabel.ticket JOIN mabel.ticket_type ON ticket.ticket_type_id = ticket_type.id WHERE status_id=4 AND ticket_type_id<>5);
insert into ticket (select NULL as id, user_id, ticket_type_id, "" AS guest_name, payment_method_id, book_time, 0 AS donation, price AS transaction_value, '' AS notes, 'PENDING_WL' as status from mabel.waiting_list JOIN mabel.ticket_type ON waiting_list.ticket_type_id = ticket_type.id AND ticket_type_id<>5);

insert into email select * from mabel.email;
insert into email_destination select * from mabel.email_destination;
