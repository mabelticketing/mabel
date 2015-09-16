/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("../connection.js");
var runSql = connection.runSql;

module.exports = payment_method;

function payment_method(id) {
	return {
		get: get
	};

	function get() {
		var sql = "SELECT * FROM payment_method WHERE id=?;";
		return runSql(sql, [id]).then(function(rows) {
			if (rows.length !== 1) throw new Error('Expected one payment method but got ' + rows.length);
			return rows[0];
		});
	}	
}

payment_method.get = function(opts) {
	var sql = connection.getFilteredSQL("payment_method", opts);

	return runSql(sql);
};