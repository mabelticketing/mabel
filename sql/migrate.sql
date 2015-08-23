insert into ticket_type select id, name, price, ticket_limit from mabel.ticket_type;
insert into user select * from mabel.user;
insert into user_group select * from mabel.user_group;
insert into user_group_membership select * from mabel.user_group_membership;
insert into group_access_right select * from mabel.group_access_right;
insert into payment_method select id, name, description, ticket_limit from mabel.payment_method;
insert into group_payment_method_access select * from mabel.group_payment_method_access;

insert into ticket (select id, user_id, ticket_type_id, guest_name, payment_method_id, book_time, 'PENDING' as status from mabel.ticket WHERE status_id=1);
insert into ticket (select id, user_id, ticket_type_id, guest_name, payment_method_id, book_time, 'CONFIRMED' as status from mabel.ticket WHERE status_id=2);
insert into ticket (select id, user_id, ticket_type_id, guest_name, payment_method_id, book_time, 'CANCELLED' as status from mabel.ticket WHERE status_id=3);
insert into ticket (select id, user_id, ticket_type_id, guest_name, payment_method_id, book_time, 'ADMITTED' as status from mabel.ticket WHERE status_id=4);

insert into wl_ticket select * from mabel.waiting_list;
insert into transaction select * from mabel.transaction;
insert into email select * from mabel.email;
insert into email_destination select * from mabel.email_destination;
