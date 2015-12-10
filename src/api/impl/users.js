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

	// subpaths
	me: function() {
		return runSql("SELECT 1");
	}
};

function get(opts) {
	var sql = connection.getFilteredSQL("user", opts);
	return runSql(sql);
}
