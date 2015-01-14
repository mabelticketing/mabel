var connection = require("./connection.js");
var runSql = connection.runSql;
var Q = require("q");

var api = {
	get: get,
	getAll: getAll,
	insert: insert,
	del: del,
	update: update
};
module.exports = api;

function get(ticket_id) {
	var sql = "SELECT * FROM (SELECT id, booking_user_id, ticket_type_id, status_id, book_time FROM ticket WHERE id=?) AS a JOIN user ON user.id=a.user_id LIMIT 1;";
	return runSql(sql, [ticket_id]).then(function(values) {
		return values[0];
	});
}

function update(ticket) {
	var sql = "UPDATE ticket SET ? WHERE id=?;";
	var promise = runSql(sql, [ticket, ticket.id]);

	return promise.then(function(result) {
		return get(result.insertId);
	});
}

function insert(ticket) {
	var sql = "INSERT INTO ticket SET ?;";
	var promise = runSql(sql, [ticket]);

	return promise.then(function(result) {
		return get(result.insertId);
	});
}

function del(ticket_id) {
	return runSql("DELETE FROM ticket WHERE id = ?;", [ticket_id]);
}

//TODO: We want tickets of different event sites to be separate
/*
	- create a default group for each event
	- add tickets to the appropriate group when they log into a new event site
	- api.tickets.getAll should return just the tickets within that group
*/
function getAll(opts) {
	var conn = connection.getConnection();
	var sql = connection.getFilteredSQL("ticket", opts, conn);
	conn.end();

	return runSql(sql, true);
}