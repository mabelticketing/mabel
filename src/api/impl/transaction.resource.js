/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("./connection.js");
var runSql     = connection.runSql;

module.exports = {
	get: get,
	getDetailed: getDetailed,
	update: update,
	insert: insert,
	del: del,
};

function get(transaction_id) {
	return runSql("SELECT * FROM transaction WHERE id=?", [transaction_id]).then(function(values) {
		return values[0];
	});
}

function update(transaction) {
	var sql = "UPDATE transaction SET ? WHERE id=?;";
	var promise = runSql(sql, [transaction, transaction.id]);

	return promise.then(function() {
		return get(transaction.id);
	});
}

function insert(transaction) {
	var sql = "INSERT INTO transaction SET ?, transaction_time=UNIX_TIMESTAMP();";
	var promise = runSql(sql, [transaction]);

	var p = promise.then(function(result) {
		// TODO: confirmation email
		return get(result.insertId);
	});
	return p;
}

function del(transaction_id) {
	return runSql("DELETE FROM transaction WHERE id = ?;", [transaction_id]);
}

function getDetailed(transaction_id) {

	var sql = 
		"SELECT transaction.id id, value, payment_method.name payment_method, user.name name, notes, tickets, transaction_time \
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
	return runSql(sql, [transaction_id]).then(function(values) {
		return values[0];
	});
}
