/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("../connection.js");
var runSql     = connection.runSql;

module.exports = {
	// main methods
	post: post,

	// subpaths
	id: _id
};

function post(transaction) {
	var sql = "INSERT INTO transaction SET ?, transaction_time=UNIX_TIMESTAMP();";
	var promise = runSql(sql, [transaction]);

	return promise.then(function(result) {
		// TODO: confirmation email
		return _id(result.insertId).get();
	});
}

function _id(id) {
	return {
		get: get,
		put: put,
		del: del
	};

	function get() {
		// getting a lot of details
		var sql = "SELECT transaction.id id, value, payment_method.name payment_method, user.name name, notes, tickets, transaction_time \
			FROM transaction \
			JOIN payment_method \
				ON payment_method.id = payment_method_id \
			JOIN user \
				ON user.id = user_id \
			JOIN ( \
				SELECT user_id, GROUP_CONCAT(id ORDER BY id ASC SEPARATOR ', ') tickets \
				FROM ticket \
				GROUP BY user_id \
				) A \
				ON A.user_id = transaction.user_id \
			WHERE transaction.id=?;";

		return runSql(sql, [id]).then(function(rows) {
			if (rows.length !== 1) throw new Error('Expected one transaction but got ' + rows.length);
			return rows[0];
		});
	}

	function put(transaction) {
		var sql = "UPDATE transaction SET ? WHERE id=?;";
		var promise = runSql(sql, [transaction, id]);

		return promise.then(function() {
			return get(id);
		});

	}

	function del() {
		var sql = "DELETE FROM transaction WHERE id=?;";

		return runSql(sql, [id]);
	}
}
