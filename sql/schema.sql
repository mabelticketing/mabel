# Copyright (C) 2015  Mabel Ticketing 
# GNU General Public License v2.0
# https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt

# Schema for initialising the MySQL database

# We use foreign key dependencies, so make sure you
# create and delete in the right order.

drop table if exists email_destination;
drop table if exists email;
drop table if exists transaction;
drop table if exists ticket;
drop table if exists group_payment_method_access;
drop table if exists payment_method;
drop table if exists group_access_right;
drop table if exists user_group_membership;
drop table if exists user_group;
drop table if exists user;
drop table if exists ticket_type;


### TICKET TYPES ###

create table if not exists ticket_type (
	id int auto_increment not null,
	name varchar(100) not null,
	price DECIMAL(5,2) not null,
	ticket_limit int not null,
	primary key (id)
);

### USERS ###

create table if not exists user (
	id int auto_increment not null,
	name varchar(100) not null,
	email varchar(100) not null,
	crsid varchar(8),
	registration_time int not null,
	password_md5 varchar(100), # will be null for raven logins
	verification_code varchar(100), # emailed to new users if registered via mabel
	is_verified boolean not null DEFAULT 0,
	primary key (id),
	unique(email),
	unique(crsid)
);

### GROUPS ###

create table if not exists user_group (
	id int auto_increment not null,
	name varchar(128) not null,
	description varchar(256),
	ticket_allowance int not null,
	primary key (id)
);

### GROUP MEMBERSHIPS ###

create table if not exists user_group_membership (
	id int auto_increment not null,
	user_id int not null,
	group_id int not null,
	primary key (id),
	FOREIGN KEY (group_id) REFERENCES user_group(id),
	FOREIGN KEY (user_id) REFERENCES user(id),
	unique(user_id, group_id)
);

### GROUP ACCESS RIGHTS ###

create table if not exists group_access_right (
	id int auto_increment not null,
	group_id int not null,
	ticket_type_id int not null,
	open_time int,
	close_time int,
	primary key (id),
	FOREIGN KEY (group_id) REFERENCES user_group(id),
	FOREIGN KEY (ticket_type_id) REFERENCES ticket_type(id)
);

### PAYMENT METHODS ###

create table if not exists payment_method (
	id int auto_increment not null,
	name varchar(128) not null,
	description varchar(256),
	ticket_limit int not null,
	primary key (id)
);

### PAYMENT METHODS ACCESS ###

create table if not exists group_payment_method_access (
	id int auto_increment not null,
	group_id int not null,
	payment_method_id int not null,
	primary key (id),
	FOREIGN KEY (group_id) REFERENCES user_group(id),
	FOREIGN KEY (payment_method_id) REFERENCES payment_method(id),
	unique(group_id, payment_method_id)
);

### TICKET ###

create table if not exists ticket (
	id int auto_increment not null,
	user_id int not null,
	ticket_type_id int not null,
	guest_name varchar(128),
	payment_method_id int not null,
	book_time int,
	donation boolean not null DEFAULT 0,
	transaction_value DECIMAL(6,2) not null,
	notes text,
	# PENDING       means that the ticket has been requested but not paid for/approved by thte committee
	# CONFIRMED     means that the ticket is valid, and the guest may come to the ball
	# CANCELLED     means the ticket is not available to be reclaimed via the waiting list
	# REALLOCATED   means that the ticket is available for someone else to take
	# ADMITTED      means that the guest has entered the ball - so shouldn't be allowed in again
	# PENDING_WL    means that the ticket is on the waiting list, and is ready to be transferred
	# CANCELLED_WL  means that the ticket was on the waiting list, but has since been cancelled
	status ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'REALLOCATED', 'ADMITTED', 'PENDING_WL', 'CANCELLED_WL') not null,
	primary key (id),
	FOREIGN KEY (user_id) REFERENCES user(id),
	FOREIGN KEY (ticket_type_id) REFERENCES ticket_type(id),
	FOREIGN KEY (payment_method_id) REFERENCES payment_method(id)
);

### TRANSACTIONS ###

create table if not exists transaction (
	id int auto_increment not null,
	user_id int not null,
	transaction_time int not null,
	primary key (id),
	FOREIGN KEY (user_id) REFERENCES user(id),
	FOREIGN KEY (payment_method_id) REFERENCES payment_method(id)
);


### MAIL LOGS ###

create table if not exists email (
	id int auto_increment not null,
	from_email varchar(100) not null,
	send_time int not null,
	message_content text not null,
	primary key (id)
);

create table if not exists email_destination (
	id int auto_increment not null,
	address varchar(100) not null,
	user int,
	email_id int not null,
	primary key (id),
	foreign key (email_id) references email(id)
);
