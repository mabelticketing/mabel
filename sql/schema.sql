
drop table if exists email_destination;
drop table if exists email;
drop table if exists ticket;
drop table if exists group_payment_method_access;
drop table if exists payment_method;
drop table if exists group_access_right;
drop table if exists ticket_group_membership;
drop table if exists user_group_membership;
drop table if exists ticket_group;
drop table if exists user_group;
drop table if exists user;
drop table if exists ticket_type;



create table if not exists ticket_type (
	id int auto_increment not null,
	name varchar(128) not null,
	price DECIMAL(6,2) not null,
	primary key (id)
);


create table if not exists user (
	id int auto_increment not null,
	name varchar(128) not null,
	email varchar(128) not null,
	crsid varchar(16),
	registration_time int not null,
	password_md5 varchar(128), 
	verification_code varchar(128),
	is_verified boolean not null DEFAULT 0,
	primary key (id),
	unique(email),
	unique(crsid)
);



create table if not exists ticket_group (
	id int auto_increment not null,
	name varchar(128) not null,
	description varchar(256),
	overall_limit int null,
	primary key (id)
);

create table if not exists user_group (
	id int auto_increment not null,
	name varchar(128) not null,
	description varchar(256),
	primary key (id)
);



create table if not exists ticket_group_membership (
	id int auto_increment not null,
	ticket_type_id int not null,
	ticket_group_id int not null,
	primary key (id),
	FOREIGN KEY (ticket_group_id) REFERENCES ticket_group(id),
	FOREIGN KEY (ticket_type_id) REFERENCES ticket_type(id),
	unique(ticket_type_id, ticket_group_id)
);

create table if not exists user_group_membership (
	id int auto_increment not null,
	user_id int not null,
	group_id int not null,
	primary key (id),
	FOREIGN KEY (group_id) REFERENCES user_group(id),
	FOREIGN KEY (user_id) REFERENCES user(id),
	unique(user_id, group_id)
);



create table if not exists group_access_right (
	id int auto_increment not null,
	group_id int not null,
	ticket_group_id int not null,
	allowance int,
	open_time int,
	close_time int,
	primary key (id),
	FOREIGN KEY (group_id) REFERENCES user_group(id),
	FOREIGN KEY (ticket_group_id) REFERENCES ticket_group(id)
);



create table if not exists payment_method (
	id int auto_increment not null,
	name varchar(128) not null,
	description varchar(256),
	primary key (id)
);



create table if not exists group_payment_method_access (
	id int auto_increment not null,
	group_id int not null,
	payment_method_id int not null,
	primary key (id),
	FOREIGN KEY (group_id) REFERENCES user_group(id),
	FOREIGN KEY (payment_method_id) REFERENCES payment_method(id),
	unique(group_id, payment_method_id)
);



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
	
	
	
	
	
	
	status ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'ADMITTED', 'PENDING_WL', 'CANCELLED_WL', 'INVALID') not null default 'INVALID',
	primary key (id),
	FOREIGN KEY (user_id) REFERENCES user(id),
	FOREIGN KEY (ticket_type_id) REFERENCES ticket_type(id),
	FOREIGN KEY (payment_method_id) REFERENCES payment_method(id)
);




create table if not exists email (
	id int auto_increment not null,
	from_email varchar(128) not null,
	send_time int not null,
	message_content text not null,
	primary key (id)
);

create table if not exists email_destination (
	id int auto_increment not null,
	address varchar(128) not null,
	user int,
	email_id int not null,
	primary key (id),
	foreign key (email_id) references email(id)
);
