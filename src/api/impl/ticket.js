var connection = require("./connection.js");
var runSql = connection.runSql;
var config = require("../../config.js");

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
					ticket_type.name AS ticket_type_name, status_id, ticket_status.name AS status_name, book_time\
				FROM (SELECT * FROM ticket WHERE id=?) AS a \
				JOIN user ON a.user_id=user.id \
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

function getByUser(user_id) {
	var sql = "SELECT ticket_type.name name, ticket.book_time book_time, ticket.id id, \
				ticket_type.id type_id, ticket_type.price price, ticket.guest_name guest_name, \
				ticket_status.name status, payment_method.name payment_method \
			FROM ticket \
			JOIN ticket_type ON ticket.ticket_type_id=ticket_type.id \
			JOIN ticket_status ON ticket.status_id=ticket_status.id \
			JOIN payment_method ON ticket.payment_method_id=payment_method.id \
			WHERE ticket.user_id=?";
	return runSql(sql, [user_id])
		.then(function(results) {
			// TODO: Is this the tidiest way of doing things?
			// Move donation tickets into a separate list
			var realTickets = [];
			var extraTickets = [];

			for (var i=0; i<results.length; i++) {
				if (results[i].type_id === config.donation_ticket_type_id) {
					extraTickets.push(results[i]);
				} else {
					realTickets.push(results[i]);
				}
			}

			return {
				real: realTickets,
				extra: extraTickets
			};
		});
}