/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("./connection.js");
var runSql = connection.runSql;

module.exports = {
	all: all
};

function all(opts) {
	// TODO: visibility of groups for admins of different events?
	var sql = connection.getFilteredSQL("user_group", opts);

	return runSql(sql);
}
