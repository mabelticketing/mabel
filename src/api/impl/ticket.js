/**
 * Copyright (C) 2015  Mabel Ticketing
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("../connection.js");
var runSql = connection.runSql;
var _ = require("lodash");
var Q = require("q");
var api = require("../api.js");
var config = require("../../config.js");

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

	function put(data) {
		var sql = "UPDATE ticket SET ? WHERE id=?;";
		var promise = runSql(sql, [data.ticket, id]);

		return promise.then(function() {
			return get();
		});
	}
}

// NB this route is only for admins (no validation)
ticket.post = function post(data) {
	var t = data.ticket;

	// need to get/set ticket price
	return api.type(t.ticket_type_id).get()
		.then(function(type) {
			t.transaction_value = type.price;
			t.transaction_value += t.donation ? config.donation_value : 0;
		})
		.then(function() {
			// over-ride status whatever the admin says (TODO: is this right?)
			t.status = 'PENDING';
			var sql = "INSERT INTO ticket SET ?";
			if (t.book_time === undefined) sql += ", book_time=UNIX_TIMESTAMP()";

			return runSql(sql, [t])
		})
		.then(function(result) {
			return ticket(result.insertId).get();
		});

};

ticket.get =
	function get(opts) {
		var sql = connection.getFilteredSQL("ticket", opts);

		return runSql(sql);
	};

ticket.delete =
	function del(data) {

		var sql = "UPDATE ticket SET status='CANCELLED' WHERE id=?";
		var promises = _.map(data.ids, function(id) {
			return runSql(sql, [id]);
		});

		return Q.all(promises);
	};