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
var resources = ['group', 'payment_method', 'ticket', 'ticket_type', 'transaction', 'user', 'wl_ticket'];

for (var i=0; i<resources.length; i++) {
	module.exports[resources[i]] = require('./resources/' + resources[i] + '.js');
	module.exports[resources[i] + 's'] = require('./collections/' + resources[i] + '.js');
}
