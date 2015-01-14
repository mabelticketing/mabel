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
	var sql = "SELECT a.id, booking_user_id, user.name AS booking_user_name, ticket_type_id, \
					ticket_type.name AS ticket_type_name, status_id, ticket_status.name AS status_name, book_time\
				FROM (SELECT * FROM ticket WHERE id=1) AS a \
				JOIN user ON a.booking_user_id=user.id \
				JOIN ticket_type on ticket_type.id=ticket_type_id \
				JOIN ticket_status ON ticket_status.id=status_id LIMIT 1;";
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

function getAll(opts) {
	var conn = connection.getConnection();
	var sql = connection.getFilteredSQL("ticket", opts, conn);
	conn.end();

	return runSql(sql, true);
}