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

function all() {
	var sql = "SELECT id, name, description, ticket_limit FROM payment_method";
	return runSql(sql);
}
