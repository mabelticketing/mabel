var connection = require("./connection.js");
var runSql = connection.runSql;

var api = {
	get: get,
	getAll: getAll,
	getByUser: getByUser,
	insert: insert,
	del: del,
	update: update
};
module.exports = api;

function get(ticket_id) {
	var sql = "SELECT a.id, user_id, user.name AS booking_user_name, ticket_type_id, \
					ticket_type.name AS ticket_type_name, book_time\
				FROM (SELECT * FROM waiting_list WHERE id=?) AS a \
				JOIN user ON a.user_id=user.id \
				JOIN ticket_type on ticket_type.id=ticket_type_id LIMIT 1;";
	return runSql(sql, [ticket_id]).then(function(values) {
		return values[0];
	});
}

function update(ticket) {
	var sql = "UPDATE waiting_list SET ? WHERE id=?;";
	var promise = runSql(sql, [ticket, ticket.id]);

	return promise.then(function(result) {
		return get(ticket.id);
	});
}

function insert(ticket) {
	var sql = "INSERT INTO waiting_list SET ?;";
	var promise = runSql(sql, [ticket]);

	return promise.then(function(result) {
		return get(result.insertId);
	});
}

function del(ticket_id) {
	return runSql("DELETE FROM waiting_list WHERE id = ?;", [ticket_id]);
}

function getAll(opts) {
	var sql = connection.getFilteredSQL("waiting_list", opts);

	return runSql(sql, true);
}

function getByUser(user_id) {
	var sql = "SELECT ticket_type.name name, waiting_list.book_time book_time, waiting_list.id id, \
				ticket_type.id type_id, ticket_type.price price, payment_method.name payment_method \
			FROM waiting_list \
			JOIN ticket_type ON waiting_list.ticket_type_id=ticket_type.id \
			JOIN payment_method ON waiting_list.payment_method_id=payment_method.id \
			WHERE waiting_list.user_id=?";
	return runSql(sql, [user_id]);
}