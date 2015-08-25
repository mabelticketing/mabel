/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

module.exports = {
	// booking is lonely because it doesn't get a collection route :(
	booking: require('./resources/booking.js')
};

// allows us to stay DRY and perhaps enforces good file system structure
var resources = ['group', 'payment_method', 'ticket', 'type', 'user'];

for (var i=0; i<resources.length; i++) {
	module.exports[resources[i]] = require('./resources/' + resources[i] + '.js');
	module.exports[resources[i] + 's'] = require('./resources/' + resources[i] + 's.js');
}

// api structure reminder
/********************************************************
 * api
 * 		group
 * 			(id)
 * 				.get()
 *     			.put({...})
 * 	   			.del()
 * 			.post({...})
 * 		groups
 * 			.get(opts)
 * 		payment_method
 * 			(id)
 * 				.get()
 * 		payment_methods
 * 			.get()
 * 		ticket
 *   		(id)
 *   			.get()
 *   			.put({...})
 *   		.post({...}) // skip validation - for admins
 * 		tickets
 * 			.get(opts)
 * 			.del(ids) // bulk delete
 * 		type
 * 			(id)
 * 				.get()
 * 				.put({...})
 * 				.del()
 * 			.post({...})
 * 		types
 * 			.get(opts)
 * 		user
 * 			(id)
 * 				.get()
 * 				.put({...})
 * 				.del()
 * 				.allowance
 * 					.get()
 * 				.payment_methods
 * 					.get()
 * 				.types
 * 					.get()
 * 				.tickets
 * 					.post([{...}])
 * 					.get()
 * 			.post({...})
 * 		users
 * 			.get(opts)
 *