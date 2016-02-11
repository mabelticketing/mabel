/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

insert into ticket_type (id, name, price, total_limit) VALUES (
	1,
	'Standard',
	85.00,
	900
), (
	2,
	'Queue Jump',
	95.00,
	100
);

insert into user (id, name, email, password_md5, registration_time, is_verified) VALUES (
	1,
	'Mabel Admin',
	'mabel@clittle.com',
	md5('password'),
	UNIX_TIMESTAMP(),
	1
), (
	2,
	'Andrew Hardwurk',
	'worker@clittle.com',
	md5('password'),
	UNIX_TIMESTAMP(),
	1
), (
	3,
	'Emma Alumna',
	'alumnus@clittle.com',
	md5('password'),
	UNIX_TIMESTAMP(),
	1
);

insert into user_group (id, name, description, overall_allowance) VALUES (
	1,
	'admins',
	'an administrator',
	2000 # TODO: this should probably be nullable rather than setting arbitrary upper bounds
), (
	2,
	'emma_students',
	'a student of Emmanuel College',
	8
), (
	3,
	'emma_alum',
	'an alumnus of Emmanuel College',
	2
), (
	4,
	'mcr_with_affiliate',
	'an Emmanuel College MCR member with an affiliated member',
	2
);

insert into user_group_membership (user_id, group_id) VALUES 
	(1, 1), (1, 2),
			(2, 2),
					(3, 3);

insert into group_access_right (group_id, ticket_type_id, allowance, open_time, close_time) VALUES
# Admins can have anything any time (< 10 years from now)
	(1,1,null,0,UNIX_TIMESTAMP() + 10 * 365 * 24 * 60 * 60),
	(1,2,null,0,UNIX_TIMESTAMP() + 10 * 365 * 24 * 60 * 60),
	(1,3,null,0,UNIX_TIMESTAMP() + 10 * 365 * 24 * 60 * 60),
# Current students can have any "normal" ticket since yesterday
	(2,1,null,UNIX_TIMESTAMP()- 1 * 24 * 60 * 60, UNIX_TIMESTAMP() + 365 * 24 * 60 * 60 ),
	(2,2,2,UNIX_TIMESTAMP()- 1 * 24 * 60 * 60, UNIX_TIMESTAMP() + 365 * 24 * 60 * 60 ),
	(2,3,2,UNIX_TIMESTAMP()- 1 * 24 * 60 * 60, UNIX_TIMESTAMP() + 365 * 24 * 60 * 60 ),
# Early bird tickets were open to current students until yesterday
	(2,1,1,UNIX_TIMESTAMP()- 7 * 24 * 60 * 60, UNIX_TIMESTAMP() - 1 * 24 * 60 * 60),
# MCR members are allowed to book two "early bird" tickets
	(4,1,2,UNIX_TIMESTAMP()- 7 * 24 * 60 * 60, UNIX_TIMESTAMP() - 1 * 24 * 60 * 60),
# Alumni can have any "normal" ticket since yesterday
	(3,1,null,UNIX_TIMESTAMP()- 1 * 24 * 60 * 60, UNIX_TIMESTAMP() + 365 * 24 * 60 * 60 ),
	(3,2,2,UNIX_TIMESTAMP()- 1 * 24 * 60 * 60, UNIX_TIMESTAMP() + 365 * 24 * 60 * 60 ),
	(3,3,2,UNIX_TIMESTAMP()- 1 * 24 * 60 * 60, UNIX_TIMESTAMP() + 365 * 24 * 60 * 60 );

insert into payment_method (id, name, description) VALUES 
(
	1,
	'College Bill',
	'Payment will be added to the end of term college bill'
), (
	2,
	'Cheque',
	'Cheque made payable to "Emmanuel Colege May Ball"'
), (
	3,
	'Bank Transfer',
	'Pay by Bank Transfer'
);

insert into group_payment_method_access (group_id, payment_method_id) VALUES 
# admins have access to every method
 (1,1), (1,2), (1,3),
# emma students have access to every method
 (2,1), (2,2), (2,3),
# alumni only to cheque and bank transfer
 		(3,2), (3,3);
