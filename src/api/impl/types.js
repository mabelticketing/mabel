/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("../connection.js");
var runSql = connection.runSql;

module.exports = {
	// main methods
	get: get,
	open: open
};

function get(opts) {
	var sql = connection.getFilteredSQL("ticket_type", opts);
	
	return runSql(sql);
}

function open(socket) {
	function emitOpenTypes() {
		socket.emit('types', {});
	}

	// Emit open ticket types at intervals of 5 seconds
	setInterval(emitOpenTypes, 5000);
}
