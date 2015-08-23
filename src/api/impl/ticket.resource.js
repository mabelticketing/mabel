/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("./connection.js");
var runSql = connection.runSql;

module.exports = {
	get: get,
	insert: insert,
	del: del,
	update: update,
	admit: admit,
	admitted: admitted
};

function get(ticket_id) {
	return runSql("SELECT * FROM ticket WHERE id=?", [ticket_id]).then(function(values) {
		if (values.length < 1) throw new Error("No tickets with that ID");
		return values[0];
	});
}

function update(ticket) {
	var sql = "UPDATE ticket SET ? WHERE id=?;";
	var promise = runSql(sql, [ticket, ticket.id]);

	return promise.then(function() {
		return get(ticket.id);
	});
}

function insert(ticket) {
	var sql = "INSERT INTO ticket SET ?";
	if (ticket.book_time === undefined) sql += ", book_time=UNIX_TIMESTAMP()";
	sql += ";";
	var promise = runSql(sql, [ticket]);

	return promise.then(function(result) {
		return get(result.insertId);
	});
}

function del(ticket_id) {
	return runSql("DELETE FROM ticket WHERE id = ?;", [ticket_id]);
}

function admit(ticket_id) {
	var sql = "SELECT status_id, name FROM ticket JOIN ticket_status ON status_id=ticket_status.id WHERE ticket.id=? LIMIT 1";
	return runSql(sql, [ticket_id]).then(function(statuses) {
		if (statuses.length < 1) throw Error("No ticket with that ID");
		if (statuses[0].status_id !== 2) throw Error("Ticket status is '" + statuses[0].name + "'");
		sql = "UPDATE ticket SET status_id=4 WHERE id=?";
		return runSql(sql, [ticket_id]);		
	})
	.then(function() {
		return runSql("SELECT COUNT(*) as admitted FROM ticket WHERE status_id=4;");
	})
	.then(function(result) {
		return {success:true, result:result[0]};
	}, function(err) {
		console.log(err);
		return {success: false, error: err.message};
	});
}

function admitted() {
	// TODO: hard coding... 
	return runSql("SELECT COUNT(*) as admitted FROM ticket WHERE status_id=4;")
		.then(function(result) {
			return {success:true, result:result[0]};
		});
}
