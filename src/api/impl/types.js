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

function open() {
	// "distinct" is in there just in case there are multiple ways a particular group could have access right now.
	var sql = "SELECT DISTINCT group_id, ticket_type_id FROM group_access_right WHERE open_time<UNIX_TIMESTAMP() AND close_time>UNIX_TIMESTAMP();"
	return runSql(sql);
}
