/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

module.exports = {};

// allows us to stay DRY and perhaps enforces good file system structure
var apiPaths = ['group', 'payment-method', 'ticket', 'type', 'user'];

for (var i=0; i<apiPaths.length; i++) {
	module.exports[apiPaths[i]] = require('./impl/' + apiPaths[i] + '.js');
	module.exports[apiPaths[i] + 's'] = require('./impl/' + apiPaths[i] + 's.js');
}

/**
 * API structure reminder
 * ----------------------
 *
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
 * 					.get()
 * 					.post([{...}])
 * 			.post({...})
 * 		users
 * 			.get(opts)
 *
 */
