var connection = require("./connection.js");
var runSql = connection.runSql;
var config = require("../../config.js");
var Q = require("q");

var api = {
	get: get,
	getAll: getAll,
	getByUser: getByUser,
	summary: summary,
	summary_byuser: summary_byuser,
	processWaitingList: processWaitingList,
	insert: insert,
	del: del,
	update: update
};
module.exports = api;

function getDetailed(ticket_id) {
	var sql = "SELECT a.id, user_id, guest_name as guest_name, user.name AS booking_user_name, ticket_type_id, \
					ticket_type.name AS ticket_type_name, status_id, ticket_status.name AS status_name, book_time\
				FROM (SELECT * FROM ticket WHERE id=?) AS a \
				JOIN user ON a.user_id=user.id \
				JOIN ticket_type on ticket_type.id=ticket_type_id \
				JOIN ticket_status ON ticket_status.id=status_id LIMIT 1;";
	return runSql(sql, [ticket_id]).then(function(values) {
		return values[0];
	});
}

function get(ticket_id) {
	return runSql("SELECT * FROM ticket WHERE id=?", [ticket_id]).then(function(values) {
		return values[0];
	});
}

function update(ticket) {
	var sql = "UPDATE ticket SET ? WHERE id=?;";
	var promise = runSql(sql, [ticket, ticket.id]);

	return promise.then(function(result) {
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

function processWaitingList(ticket_type_id) {

	// prepare a function here because we shouldn't create functions inside loops
	function callback(ticket) {
		return function(result) {
			return {
				result: result,
				request: ticket
			};
		};
	}

	return runSql("SELECT available FROM ticket_summary WHERE id=?", [ticket_type_id])
		.then(function(result) {
			// get the right number of tickets
			if (result.length !== 1) throw new Error("Ticket type " + ticket_type_id + " not found");
			var available = result[0].available;
			if (available < 1) return [];
			return runSql("SELECT * FROM waiting_list WHERE ticket_type_id=? ORDER BY book_time LIMIT ?", [ticket_type_id, available]);
		})
		// .then(function(result) {
		// 	// add donation tickets
		// 	var toInsert = result.slice(0);
		// 	for (var i=0; i<result.length; i++) {
		// 		if (result[i].has_donation === 1) {
		// 			toInsert.push({
		// 				user_id: result[i].user_id,
		// 				ticket_type_id: config.donation_ticket_type_id,
		// 				payment_method_id: result[i].payment_method_id,
		// 				book_time: result[i].book_time
		// 			});
		// 		}
		// 	}
		// 	return toInsert;
		// })
		.then(function(tickets) {
			var sql = "INSERT INTO ticket \
					(user_id, ticket_type_id, status_id, payment_method_id, book_time) \
				SELECT ?, ?, 1, ?, UNIX_TIMESTAMP() \
				FROM \
					(SELECT COUNT(*) sold FROM ticket WHERE ticket_type_id=?) A \
					JOIN \
					(SELECT ticket_limit cap FROM ticket_type WHERE id=?) B \
					WHERE B.cap>A.sold;";
			var promises = [];

			for (var i = 0; i < tickets.length; i++) {
				promises.push(
					runSql(sql, [tickets[i].user_id, tickets[i].ticket_type_id, tickets[i].payment_method_id,
						tickets[i].ticket_type_id, tickets[i].ticket_type_id
					])
					.then(callback(tickets[i]))
				);
			}
			return Q.all(promises);
		})
		.then(function(results) {

			var donationPromises = [];
			var deletionPromises = [];
			var ticketsAllocated = [];
			for (var i = 0; i < results.length; i++) {
				if (results[i].result.affectedRows > 0) {
					ticketsAllocated.push({
						rowId: results[i].result.insertId,
						request: results[i].request
					});
					if (results[i].request.has_donation) {
						// add a donation, now we know that the ticket is successfully booked
						var req = {
							ticket_type_id: config.donation_ticket_type_id,
							payment_method_id: results[i].request.payment_method_id,
							user_id: results[i].request.user_id
						};
						donationPromises.push(
							runSql("INSERT INTO ticket SET ?, book_time=UNIX_TIMESTAMP()", [{
								user_id: results[i].request.user_id,
								ticket_type_id: config.donation_ticket_type_id,
								status_id: 1,
								payment_method_id: req.payment_method_id
							}])
							.then(callback(req))
						);
					}
					// remove the ticket from the waiting list
					deletionPromises.push(
						runSql("DELETE FROM waiting_list WHERE id=?", [results[i].request.id])
					);
				}
			}
			return Q.all([Q.all(donationPromises), Q.all(deletionPromises), Q.when(ticketsAllocated)]);
		})
		.then(function(results) {
			var donations = results[0];
			// var deletions = results[1];
			var ticketsAllocated = results[2];
			for (var i = 0; i < donations.length; i++) {
				ticketsAllocated.push({
					rowId: donations[i].result.insertId,
					request: donations[i].request
				});
			}

			return ticketsAllocated;
		});
}

function del(ticket_id) {
	return runSql("DELETE FROM ticket WHERE id = ?;", [ticket_id]);
}

function getAll(opts) {
	var sql = connection.getFilteredSQL("ticket", opts);

	return runSql(sql, true);
}

function summary(opts) {
	var sql = connection.getFilteredSQL("ticket_summary", opts);

	return runSql(sql, true);
}

function summary_byuser(opts) {
	var sql = connection.getFilteredSQL("tickets_grouped_by_user", opts);

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

			for (var i = 0; i < results.length; i++) {
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