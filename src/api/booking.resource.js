/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("./connection.js");
var runSql = connection.runSql;
var Q = require("q");
var config = require("../../config.js");

module.exports = {
	canBook: canBook,
	makeBooking: makeBooking,
};

// TODO: Per-group opening/closing times
function canBook(user_id, event_id, callback) {
	// check if the event booking start date is in the past
	var eventSql = "SELECT * FROM event WHERE id=?";

	// TODO: move to promise
	runSql(eventSql, [event_id], function(err, eventDetails) {
		if (err) return callback(err);
		if (eventDetails.length < 1) return callback("No such event");

		var now = new Date().getTime() / 1000;

		if (now < eventDetails[0].launch_time) {
			return callback(null, {
				open: false,
				reason: ("Booking is not yet open. Booking opens $$$startTime$$$"),
				startTime: eventDetails[0].launch_time
			});
		}

		if (now > eventDetails[0].close_time) {
			return callback(null, {
				open: false,
				reason: ("Booking has closed.")
			});
		}

		return callback(null, {
			open: true
		});
	});
}

function makeBooking(user_id, tickets, addDonations) {
	// we are going to insert tickets one at a time to make sure we don't go over. 
	// This is a magic SQL query which will only insert if there is space. 
	/*
		It works by selecting the constant values ?, ?, ?,
		UNIX_TIMESTAMP() once for each row in the inner SELECT'd table.
		This table will either have one row, if COUNT(*) <= ticket_limit,
		(and so we insert the new ticket once), or no rows, in which case
		we insert no tickets.
		It is possible we could be even cleverer here and ensure the inner 
		SELECT has the same number of rows as tickets we want to book of this 
		type, then we would just need one query per ticket type.
	*/
	var sql = "INSERT INTO ticket \
					(user_id, ticket_type_id, status_id, payment_method_id, book_time) \
				SELECT ?, ?, 1, ?, UNIX_TIMESTAMP() \
				FROM \
					(SELECT COUNT(*) sold FROM ticket WHERE ticket_type_id=?) A \
					JOIN \
					(SELECT ticket_limit cap FROM ticket_type WHERE id=?) B \
					WHERE B.cap>A.sold;";
	var promises = [];

	// prepare a function here because we shouldn't create functions inside loops
	function callback(ticket) {
		return function(result) {
			return {
				result: result,
				request: ticket
			};
		};
	}
	for (var i = 0; i < tickets.length; i++) {
		promises.push(
			runSql(sql, [user_id, tickets[i].ticket_type_id, tickets[i].payment_method,
				tickets[i].ticket_type_id, tickets[i].ticket_type_id
			])
			.then(callback(tickets[i]))
		);
	}

	var donation_ticket_type_id = config.donation_ticket_type_id;

	// wait until all queries have been made
	return Q.all(promises).then(function(results) {
		var donationPromises = [];
		var waitingPromises = [];
		var ticketsAllocated = [];
		var ticketsRejected = [];
		for (var i = 0; i < results.length; i++) {
			if (results[i].result.affectedRows > 0) {
				ticketsAllocated.push({
					rowId: results[i].result.insertId,
					request: results[i].request
				});
				if (addDonations) {
					// add a donation, now we know that the ticket is booked
					var req = {
						ticket_type_id: donation_ticket_type_id,
						payment_method: results[i].request.payment_method
					};
					donationPromises.push(
						runSql("INSERT INTO ticket SET ?, book_time=UNIX_TIMESTAMP()", [{
							user_id: user_id,
							ticket_type_id: donation_ticket_type_id,
							status_id: 1,
							payment_method_id: req.payment_method
						}])
						.then(callback(req))
					);
				}
			} else {
				// not able to process ticket - add to the waiting list instead
				waitingPromises.push(
					runSql("INSERT INTO waiting_list SET ?, book_time=UNIX_TIMESTAMP()", [{
						user_id: user_id,
						ticket_type_id: results[i].request.ticket_type_id,
						payment_method_id: results[i].request.payment_method,
						has_donation: addDonations
					}])
					.then(callback(results[i].request))
				);
			}
		}

		return Q.all([
			Q.all(donationPromises)
			.then(function(dResults) {
				for (var j = 0; j < dResults.length; j++) {
					if (dResults[j].result.affectedRows > 0) {
						ticketsAllocated.push({
							rowId: dResults[j].result.insertId,
							request: dResults[j].request
						});
					}
				}
				return ticketsAllocated;
			}),
			Q.all(waitingPromises)
			.then(function(wResults) {
				for (var j = 0; j < wResults.length; j++) {
					if (wResults[j].result.affectedRows > 0) {
						ticketsRejected.push({
							rowId: wResults[j].result.insertId,
							request: wResults[j].request
						});
					}
				}
				return ticketsRejected;
			})
		])
		.then(function(dwResults) {
			return {
				ticketsAllocated: dwResults[0],
				ticketsRejected: dwResults[1]
			};
		});
	});
}

// TODO: don't like this file, make it better
function makeTransaction(user_id, event_id, booking, ticketsAllocated, callback) {
	// firstly group payment methods so we have one transaction per payment method
	// shouldn't trust data from the client - so retrieve ticket prices from DB

	return runSql("SELECT price, id from ticket_type")
		.then(function(priceRow) {
			// key the prices by ticket_type_id for clarity
			var keyedPrices = {};
			for (var i = 0; i < priceRow.length; i++) {
				keyedPrices[priceRow[i].id] = priceRow[i].price;
			}
			return keyedPrices;
		})
		.then(function(prices) {
			// group by payment method id
			var paymentsToMake = {};
			for (var i = 0; i < ticketsAllocated.length; i++) {

				// NB if we didn't sell all the tickets,
				// ticketsAllocated[i].quantity will be smaller than the
				// ticketsAllocated[i].payment_methods array. We assume that
				// the first j payment methods are to be used.
				for (var j = 0; j < ticketsAllocated[i].quantity; j++) {
					var method_id = ticketsAllocated[i].payment_methods[j];
					if (paymentsToMake[method_id] === undefined) {
						paymentsToMake[method_id] = 0;
					}
					paymentsToMake[method_id] += prices[ticketsAllocated[i].ticket_type_id];
					// TODO: fix assumption
					// add charitable donation if nesc.
					paymentsToMake[method_id] += booking.donate ? 2 : 0; // ASSUMES booking donation = £2.00 which it IS FOR EMB2015
				}

			}
			return paymentsToMake;
		})
		.then(function(payments) {
			// actually insert the transactions
			var promises = [];
			for (var method_id in payments) {
				promises.push(
					runSql("INSERT INTO transaction SET ?, transaction_time=UNIX_TIMESTAMP()", {
						user_id: user_id,
						value: payments[method_id],
						payment_method_id: method_id
					})
				);
			}
			return Q.all(promises);
		});
}
