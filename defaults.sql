insert into mabel.event (id, name, launch_time, modification_stop_time) VALUES (
	1,
	'Emmanuel May Ball 2015', 
	1418428800, # 13th Dec 2014 00:00:00
	1419465600 # 25th Dec 2014 00:00:00
);

insert into mabel.ticket_type (id, name, price, ticket_limit, event_id) VALUES (
	1,
	'Standard',
	78.00,
	1000,
	1
);

insert into mabel.ticket_type (id, name, price, ticket_limit, event_id) VALUES (
	2,
	'Queue Jump',
	88.00,
	100,
	1
);
insert into mabel.ticket_type (id, name, price, ticket_limit, event_id) VALUES (
	3,
	'Performer Discounted Ticket',
	68.00,
	100,
	1
);

insert into mabel.ticket_status (name) VALUES ('Pending');
insert into mabel.ticket_status (name) VALUES ('Confirmed');
insert into mabel.ticket_status (name) VALUES ('Cancelled');
insert into mabel.ticket_status (name) VALUES ('Admitted');

insert into mabel.user_group (id, name, description) VALUES (
	1,
	'admins',
	'For administrators'
);
insert into mabel.user_group (id, name, description) VALUES (
	2,
	'emma_students',
	'Current Students of Emmanuel College'
);
insert into mabel.user_group (id, name, description) VALUES (
	3,
	'cam_students',
	'Current Students of the University of Cambridge'
);
insert into mabel.user_group (id, name, description) VALUES (
	4,
	'emma_alum',
	'Alumni of Emmanuel College'
);
insert into mabel.user_group (id, name, description) VALUES (
	5,
	'cam_alum',
	'Alumni of the University of Cambridge'
);
insert into mabel.user_group (id, name, description) VALUES (
	6,
	'event_workers',
	'Performers at the ball'
);

insert into mabel.group_access_right (id, group_id, ticket_type_id) VALUES (1,2,1);
insert into mabel.group_access_right (id, group_id, ticket_type_id) VALUES (2,2,2);
insert into mabel.group_access_right (id, group_id, ticket_type_id) VALUES (3,4,1);
insert into mabel.group_access_right (id, group_id, ticket_type_id) VALUES (4,6,3);

insert into mabel.payment_method (id, name, description, event_id) VALUES (
	1,
	'College Bill',
	'Payment will be added to the end of term college bill',
	1
);
insert into mabel.payment_method (id, name, description, event_id) VALUES (
	2,
	'Cheque',
	'Cheque made payable to "Emmanuel Colege May Ball"',
	1
);
insert into mabel.payment_method (id, name, description, event_id) VALUES (
	3,
	'PayPal',
	'Pay online immediately with PayPal',
	1
);