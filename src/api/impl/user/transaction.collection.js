/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("./connection.js");
var runSql     = connection.runSql;

module.exports = {
	get: get
};

function get(user_id) {
	var sql = "SELECT transaction.id id, value, payment_method.name payment_method, transaction_time, notes \
		FROM transaction \
		JOIN payment_method \
			ON payment_method_id=payment_method.id WHERE user_id=?";
	return runSql(sql, [user_id]);
}
