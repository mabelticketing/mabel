# 
# Schema for initialising the MySQL database
# 
# NB I have introduced foreign key dependencies, which means we have to create and delete in the right order
drop table if exists transaction;
drop table if exists payment_method;
drop table if exists group_access_right;
drop table if exists user_group_membership;
drop table if exists user_group;
drop table if exists ticket;
drop table if exists user;
drop table if exists ticket_status;
drop table if exists ticket_type;
drop table if exists event;

### EVENTS ###

create table event (
	id int auto_increment not null,
	name varchar(100) not null,
	launch_time int not null,
	close_time int not null,
	primary key (id)
);

### TICKET TYPES ###

create table ticket_type (
	id int auto_increment not null,
	name varchar(100) not null,
	price DECIMAL(5,2) not null,
	ticket_limit int not null,
	event_id int not null,
	primary key (id),
	FOREIGN KEY (event_id) REFERENCES event(id)
);

### TICKET STATUSES ###

create table ticket_status (
	id int auto_increment not null,
	name varchar(32) not null,
	primary key (id)
);

### USERS ###

create table user (
	id int auto_increment not null,
	name varchar(100) not null,
	email varchar(100) not null,
	crsid varchar(8),
	registration_time int not null,
	primary key (id)
);

### TICKET ###

create table ticket (
	id int auto_increment not null,
	booking_user_id int not null,
	ticket_type_id int not null,
	status_id int not null,
	book_time int,
	primary key (id),
	FOREIGN KEY (booking_user_id) REFERENCES user(id),
	FOREIGN KEY (ticket_type_id) REFERENCES ticket_type(id),
	FOREIGN KEY (status_id) REFERENCES ticket_status(id)
);

### GROUPS ###

create table user_group (
	id int auto_increment not null,
	name varchar(100) not null,
	description varchar(1000),
	primary key (id)
);

### GROUP MEMBERSHIPS ###

create table user_group_membership (
	id int auto_increment not null,
	user_id int not null,
	group_id int not null,
	primary key (id),
	FOREIGN KEY (group_id) REFERENCES user_group(id),
	FOREIGN KEY (user_id) REFERENCES user(id)
);

### GROUP ACCESS RIGHTS ###

create table group_access_right (
	id int auto_increment not null,
	group_id int not null,
	ticket_type_id int not null,
	primary key (id),
	FOREIGN KEY (group_id) REFERENCES user_group(id)
);

### PAYMENT METHODS ###

create table payment_method (
	id int auto_increment not null,
	name varchar(100) not null,
	description varchar(128),
	event_id int not null,
	# perhaps an issue here - do we want e.g. performers to be given the option of paying for their ticket with college bill? so perhaps link with groups table
	primary key (id),
	FOREIGN KEY (event_id) REFERENCES event(id)
);

### TRANSACTIONS ###

create table transaction (
	id int auto_increment not null,
	user_id int not null,
	value DECIMAL(6,2) not null,
	payment_method_id int not null,
	transaction_time int not null,
	primary key (id),
	FOREIGN KEY (user_id) REFERENCES user(id),
	FOREIGN KEY (payment_method_id) REFERENCES payment_method(id)
);