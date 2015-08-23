/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

module.exports = {
	booking: require('./resources/booking.js'),
	group: require('./resources/group.js'),
	groups: require('./collections/group.js'),
	payment_method: require('./resources/payment-method.js'),
	payment_methods: require('./collections/payment-method.js'),
	ticket: require('./resources/ticket.js'),
	ticket_type: require('./resources/ticket-type.js'),
	ticket_types: require('./collections/ticket-type.js'),
	tickets: require('./collections/ticket.js'),
	transaction: require('./resources/transaction.js'),
	transactions: require('./collections/transaction.js'),
	user: require('./resources/user.js'),
	users: require('./collections/user.js'),
	wl_ticket: require('./resources/waiting-list.js'),
	wl_tickets: require('./collections/waiting-list.js')
};
