/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("../connection.js");
var runSql = connection.runSql;

module.exports = {
	get: get
};

function get(payment_method_id) {
	var sql = "SELECT * FROM payment_method WHERE id=?;";
	return runSql(sql, [payment_method_id]);
}
