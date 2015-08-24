/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("../connection.js");
var runSql = connection.runSql;

// api.tickets.get(opts)
// api.tickets.get.waiting_list(opts);
module.exports = {
	get: get
};

function get(opts) {
	var sql = connection.getFilteredSQL("ticket", opts);

	return runSql(sql);
}
