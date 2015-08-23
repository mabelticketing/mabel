/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("./connection.js");
var runSql = connection.runSql;

module.exports = {
	summary: summary
};

// TODO: should this be a resource or a collection?

function summary(opts) {
	var sql = connection.getFilteredSQL("waiting_list_summary", opts);

	return runSql(sql);
}
