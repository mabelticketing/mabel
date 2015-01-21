insert into mabel.event (id, name, launch_time, close_time) VALUES (
	1,
	'Emmanuel May Ball 2015', 
	UNIX_TIMESTAMP('2014-12-13 00:00:00'),
	UNIX_TIMESTAMP('2014-12-25 00:00:00')
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

insert into mabel.user (id, name, email, crsid, registration_time) VALUES (
	1,
	'Christopher Little',
	'cl554@cam.ac.uk',
	'cl554',
	UNIX_TIMESTAMP()
);
insert into mabel.user (id, name, email, crsid, registration_time) VALUES (
	2,
	'Thomas Le Feuvre',
	'tl368@cam.ac.uk',
	'tl368',
	UNIX_TIMESTAMP()
);
insert into mabel.user (id, name, email, registration_time) VALUES (
	3,
	'Andrew Hardwurk',
	'worker@clittle.com',
	UNIX_TIMESTAMP()
);

insert into mabel.user_group (id, name, description, ticket_allowance) VALUES (
	1,
	'admins',
	'For administrators',
	2000
);
insert into mabel.user_group (id, name, description, ticket_allowance) VALUES (
	2,
	'emma_students',
	'Current Students of Emmanuel College',
	8
);
insert into mabel.user_group (id, name, description, ticket_allowance) VALUES (
	3,
	'cam_students',
	'Current Students of the University of Cambridge',
	0
);
insert into mabel.user_group (id, name, description, ticket_allowance) VALUES (
	4,
	'emma_alum',
	'Alumni of Emmanuel College',
	2
);
insert into mabel.user_group (id, name, description, ticket_allowance) VALUES (
	5,
	'cam_alum',
	'Alumni of the University of Cambridge',
	0
);
insert into mabel.user_group (id, name, description, ticket_allowance) VALUES (
	6,
	'event_performers',
	'Performers at the ball',
	1
);

insert into mabel.user_group_membership (user_id, group_id) VALUES (1, 1);
insert into mabel.user_group_membership (user_id, group_id) VALUES (2, 1);
insert into mabel.user_group_membership (user_id, group_id) VALUES (1, 2);
insert into mabel.user_group_membership (user_id, group_id) VALUES (2, 2);
insert into mabel.user_group_membership (user_id, group_id) VALUES (1, 3);
insert into mabel.user_group_membership (user_id, group_id) VALUES (2, 3);
insert into mabel.user_group_membership (user_id, group_id) VALUES (3, 6);

insert into mabel.group_access_right (id, group_id, ticket_type_id) VALUES (1,1,1);
insert into mabel.group_access_right (id, group_id, ticket_type_id) VALUES (2,2,2);
insert into mabel.group_access_right (id, group_id, ticket_type_id) VALUES (3,4,1);
insert into mabel.group_access_right (id, group_id, ticket_type_id) VALUES (4,6,3);

insert into mabel.payment_method (id, name, description, event_id, ticket_limit) VALUES (
	1,
	'College Bill',
	'Payment will be added to the end of term college bill',
	1,
	1
);
insert into mabel.payment_method (id, name, description, event_id, ticket_limit) VALUES (
	2,
	'Cheque',
	'Cheque made payable to "Emmanuel Colege May Ball"',
	1,
	2000
);
insert into mabel.payment_method (id, name, description, event_id, ticket_limit) VALUES (
	3,
	'Bank Transfer',
	'Pay by Bank Transfer',
	1,
	2000
);
insert into mabel.payment_method (id, name, description, event_id, ticket_limit) VALUES (
	4,
	'PayPal',
	'Pay online immediately with PayPal',
	1,
	2000
);

# admins have access to every method
insert into mabel.group_payment_method_access (group_id, payment_method_id) VALUES (1,1);
insert into mabel.group_payment_method_access (group_id, payment_method_id) VALUES (1,2);
insert into mabel.group_payment_method_access (group_id, payment_method_id) VALUES (1,3);
insert into mabel.group_payment_method_access (group_id, payment_method_id) VALUES (1,4);

# emma students have access to every method except paypal
insert into mabel.group_payment_method_access (group_id, payment_method_id) VALUES (2,1);
insert into mabel.group_payment_method_access (group_id, payment_method_id) VALUES (2,2);
insert into mabel.group_payment_method_access (group_id, payment_method_id) VALUES (2,3);

# emma alumni have access to cheque or bank transfer only
insert into mabel.group_payment_method_access (group_id, payment_method_id) VALUES (4,2);
insert into mabel.group_payment_method_access (group_id, payment_method_id) VALUES (4,3);

# performers have access to cheque or bank transfer only
insert into mabel.group_payment_method_access (group_id, payment_method_id) VALUES (6,2);
insert into mabel.group_payment_method_access (group_id, payment_method_id) VALUES (6,3);

# members of the university have access to cheque or bank transfer only
insert into mabel.group_payment_method_access (group_id, payment_method_id) VALUES (3,2);
insert into mabel.group_payment_method_access (group_id, payment_method_id) VALUES (3,3);
