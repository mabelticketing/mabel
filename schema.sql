# 
# Schema for initialising the MySQL database
# 

### EVENTS ###

drop table if exists event;
create table event (
	id int auto_increment not null,
	name varchar(100) not null,
	launch_time timestamp not null,
	modification_stop_time timestamp not null,
	primary key (id)
);

### TICKET TYPES ###

drop table if exists ticket_type;
create table ticket_type (
	id int auto_increment not null,
	name varchar(100) not null,
	price DECIMAL(5,2) not null,
	ticket_limit int not null,
	event_id int not null,
	primary key (id)
);

### TICKET ###

drop table if exists ticket;
create table ticket (
	id int auto_increment not null,
	booking_user_id int not null,
	ticket_type_id not null,
	status_id not null,
	book_time timestamp,
	primary key (id)
);

### TICKET STATUSES ###

drop table if exists ticket_status;
create table ticket_status (
	id int auto_increment not null,
	name varchar(32) not null,
	primary key (id)
);

### USERS ###

drop table if exists user;
create table user (
	id int auto_increment not null,
	name varchar(100) not null,
	email varchar(100) not null,
	crsid varchar(8),
	registration_time timestamp not null,
	primary key (id)
);

### GROUPS ###

drop table if exists group;
create table group (
	id int auto_increment not null,
	name varchar(100) not null,
	description varchar(1000),
	primary key (id)
);

### GROUP ACCESS RIGHTS ###

drop table if exists group_access_right;
create table group_access_right (
	id int auto_increment not null,
	group_id int not null,
	ticket_type_id int not null,
	primary key (id)
);

### USER MEMBERSHIP ###

drop table if exists user_group_membership;
create table user_group_membership (
	id int auto_increment not null,
	user_id int not null,
	value DECIMAL(6,2) not null,
	payment_method_id int not null,
	book_time timestamp not null,
	primary key (id)
);

### PAYMENT METHODS ###

drop table if exists payment_method;
create table payment_method (
	id int auto_increment not null,
	name varchar(100) not null,
	description varchar(128),
	event_id int not null,
	primary key (id) # perhaps an issue here - do we want e.g. performers to be given the option of paying for their ticket with college bill? so perhaps link with groups table
);