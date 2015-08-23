/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("./connection.js");
var runSql = connection.runSql;

module.exports = {
	getAll: getAll
};

function getAll(opts) {
	var sql = connection.getFilteredSQL("ticket_type", opts);
	
	return runSql(sql);
}
