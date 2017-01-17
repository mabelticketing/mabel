/**
 * Copyright (C) 2015  Mabel Ticketing
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

insert into ticket_type (id, name, price) VALUES (
	1,
	'Standard',
	155.00
), (
	2,
	'Queue Jump',
	165.00
), (
	3,
	'Dining',
	190.00
	-- 100
), (
	4,
	'Standard (discounted)',
	145.00
	-- 100
), (
	5,
	'Queue Jump (discounted)',
	155.00
	-- 100
), (
	6,
	'Dining (discounted)',
	180.00
	-- 100
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

insert into user_group (id, name, description) VALUES (
	1,
	'admins',
	'an administrator'
), (
	2,
	'emma_students',
	'a student of Emmanuel College'
), (
	3,
	'emma_alum',
	'an alumnus of Emmanuel College'
), (
	4,
	'mcr_with_affiliate',
	'an Emmanuel College MCR member with an affiliated member'
);

insert into ticket_group (id, name, description, overall_limit) VALUES (
	1,
	'self',
	'All the tickets you can only buy for yourself',
	null
), (
	2,
	'standard',
	'The standard tickets',
	null
), (
	3,
	'queue_jump',
	'The queue jump tickets',
	100
), (
	4,
	'dining',
	'The dining jump tickets',
	100
), (
	5,
	'all',
	'All the tickets',
	1500
), (
	6,
	'normal',
	'All non-self tickets',
	null
);

insert into ticket_group_membership (ticket_type_id, ticket_group_id) VALUES
	(4, 1), (5, 1), (6, 1), -- self group
	(1, 2), (4, 2), -- standard
	(2, 3), (5, 3), -- queue jump
	(3, 4), (6, 4), -- dining
	(1, 5), (2, 5), (3, 5), (4, 5), (5, 5), (6, 5), -- all tickets
	(1, 6), (2, 6), (3, 6); -- all non-self tickets

insert into user_group_membership (user_id, group_id) VALUES
	(1, 1), (1, 2),
			(2, 2),
					(3, 3);

insert into group_access_right (group_id, ticket_group_id, allowance, open_time, close_time) VALUES
-- Admins can have anything any time (< 10 years from now)
	(1,5,null,0,UNIX_TIMESTAMP() + 10 * 365 * 24 * 60 * 60),
-- Students can only buy 1 of [selfplain, selfdining and selfQJ] from now onwards
	(2,1,1,UNIX_TIMESTAMP(), UNIX_TIMESTAMP() + 10*24*60*60),
-- Students can only buy 8 of [selfplain, selfdining, selfQJ, plain, QJ and dining]
	(2, 5, 8, UNIX_TIMESTAMP(), UNIX_TIMESTAMP() + 10*24*60*60),
-- Alumni can buy 2 of [plain, QJ and dining]
	(3, 6, 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP() + 10*24*60*60);

insert into payment_method (id, name, description) VALUES
(
	1,
	'College Bill',
	'Payment will be added to the end of term college bill'
), (
	2,
	'Cheque',
	'Cheque made payable to "Emmanuel College May Ball"'
), (
	3,
	'Bank Transfer',
	'Pay by Bank Transfer'
);

insert into group_payment_method_access (group_id, payment_method_id) VALUES
-- admins have access to every method
 (1,1), (1,2), (1,3),
-- emma students have access to every method
 (2,1), (2,2), (2,3),
-- alumni only to cheque and bank transfer
 		(3,2), (3,3);
