/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("../connection.js");
var runSql = connection.runSql;

module.exports = ticket;

function ticket(id) {
	return {
		// main methods
		get: get,
		put: put
	};

	function get() {
		var sql = "SELECT * FROM ticket WHERE id=?";
		var promise = runSql(sql, [id]);

		return promise.then(function(values) {
			if (values.length !== 1) throw new Error("Expected one ticket but got " + values.length);
			return values[0];
		});
	}

	function put(ticket) {
		var sql = "UPDATE ticket SET ? WHERE id=?;";
		var promise = runSql(sql, [ticket, id]);

		return promise.then(function() {
			return get();
		});
	}
}

// NB this route is only for admins (no validation)
ticket.post = function post(ticket) {
	var sql = "INSERT INTO ticket SET ?";
	if (ticket.book_time === undefined) sql += ", book_time=UNIX_TIMESTAMP()";
	sql += ";";

	return runSql(sql, [ticket])
		.then(function(result) {
			return ticket(result.insertId).get();
		});
};
