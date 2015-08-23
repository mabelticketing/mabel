/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("../connection.js");
var runSql = connection.runSql;
var config = require("../../config.js");
var Q = require("q");

module.exports = {
	all: all,
	process: process
};

function all(opts) {
	var sql = connection.getFilteredSQL("waiting_list", opts);

	return runSql(sql);
}

function process(ticket_type_id) {

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
