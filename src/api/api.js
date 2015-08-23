/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

module.exports = {
	booking: require('./booking.resource.js'),
	group: require('./group.resource.js'),
	groups: require('./group.collection.js'),
	payment_method: require('./payment-method.resource.js'),
	payment_methods: require('./payment-method.collection.js'),
	ticket: require('./ticket.resource.js'),
	tickets: require('./ticket.collection.js'),
	transaction: require('./transaction.resource.js'),
	transactions: require('./transaction.collection.js'),
	type: require('./type.resource.js'),
	types: require('./type.collection.js'),
	user: require('./user.resource.js'),
	users: require('./user.collection.js')
};