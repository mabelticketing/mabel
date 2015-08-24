/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("../connection.js");
var runSql     = connection.runSql;
var Q 		   = require("q");

module.exports = {
	// main methods
	get: get
};

function get(opts) {
	var sql = connection.getFilteredSQL("transaction", opts);

	return runSql(sql);
}