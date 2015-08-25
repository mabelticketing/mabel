/**
 * Copyright (C) 2015  Mabel Ticketing
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("../../connection.js");
var config = require("../../../config.js");
var runSql = connection.runSql;
var _ = require("lodash");
var api = require("../../api.js");

module.exports = ticket;

// use with e.g. api.user(12).ticket.post({...});
function ticket(user_id) {
	return {
		get:get,
		post: post
	};

	function get() {
		var sql = "SELECT ticket_type.name name, ticket.book_time book_time, ticket.id id, \
					ticket_type.id type_id, ticket_type.price price, ticket.guest_name guest_name, \
					ticket.status status, ticket.donation donation, payment_method.name payment_method \
				FROM ticket \
				JOIN ticket_type ON ticket.ticket_type_id=ticket_type.id \
				JOIN payment_method ON ticket.payment_method_id=payment_method.id \
				WHERE ticket.user_id=?";
		return runSql(sql, [user_id]);
	}
	
	function post(tickets) {

		var failed = [];
		return check_types(tickets)
			.then(function(tickets) {
				failed = failed.concat(tickets.failures);	

				return check_payments(tickets.successes);
			})
			.then(function(tickets) {
				failed = failed.concat(tickets.failures);

				return check_allowance(tickets.successes);
			})
			.then(function(tickets) {
				failed = failed.concat(tickets.failures);

				return book(tickets.successes);
			})
			.then(function(tickets) {
				return {
					booked: tickets["PENDING"],
					failed: failed,
					waiting_list: tickets["PENDING_WL"];
				}
			})
	}

	///////////////////////////
	// Helpers (not exposed) //
	///////////////////////////
	
	// Helper function to determine if booking is available for all tickets in an array
	function check_types(ts) {

		var failures = [];
		// get the types which are available to me
		return api.user(user_id).types.get()
			.then(function(types) {
				types = _.indexBy(types, 'id');
				var successes = _(ts)
					.filter(function(ticket) {
						if (ticket.ticket_type_id in types)  return true;
						ticket.reason = "You don't have access to this kind of ticket right now.";
						failures.push(ticket);
						return false;
					})
					.groupBy('ticket_type_id')
						.map(function(grouped_tickets, id) {
							var l = types[id].ticket_limit

							var r = _.partition(grouped_tickets, function(t, i) {
								if (i < l) return true;
								ticket.reason = "You may only book " + l + " tickets of this type."
								return false;
							})
							failures = failures.concat(r[1]);
							return r[0];
						})
					.values().flatten() // ungroup
					.value();
				return {
					successes: successes,
					failures: failures
				}
			});
	}
  
	// Helper function to determine if payment method is available for all tickets in an array
	function check_payments(ts) {

		var failures = [];
		// get the payment methods which are available to me
		return api.user(user_id).payment_methods.get()
			.then(function(payment_methods) {
				payment_methods = _.indexBy(payment_methods, 'id');
				var successes = _(ts)
					.filter(function(ticket) {
						if (ticket.payment_method_id in payment_methods) return true;
						ticket.reason = "You don't have access to this payment method.";
						failures.push(ticket);
						return false;
					})
					.groupBy('payment_method_id')
						.map(function(grouped_tickets, id) {
							var l = payment_method[id].ticket_limit
							
							var r = _.partition(grouped_tickets, function(t, i) {
								if (i < l) return true;
								ticket.reason = "You may only book " + l + " tickets using this payment method."
								return false;
							})
							failures = failures.concat(r[1]);
							return r[0];
						})
					.values().flatten() // ungroup
					.value();
				return {
					successes: successes,
					failures: failures
				}
			});
	}

	// helper function to get users' overall allowance
	function check_allowance(ts) {
		return api.user(user_id).allowance.get()
			.then(function(allowance) {
				allowance = allowance[0].allowance;
				var r = _.partition(ts, function(t, i) {
					if (i < allowance) return true;
					t.reason = "You may only book " + allowance + " tickets.";
					return false;
				})
				return {
					successes: r[0],
					failures: r[1]
				};
			})
	}





	// helper function for speedy access to ticket types
	var getType = _.memoize(function(ticket_type_id) {
		return runSql("SELECT * FROM ticket_type WHERE id=?", ticket_type_id);
	});

	// helper function to carefully book tickets (avoiding races and such)
	function book(ts) {

		var promises = [];
		// add transaction value to each ticket
		_.each(ts, function(t) {
			promises.push(
				getType(t.ticket_type_id)
				.then(function(type) {
					t.transaction_value = type.price;
					t.transaction_value += t.donation ? config.donation_value : 0;
				})
			);
		});

		// now actually insert
		Q.all(promises)
			.then(function() {
				// we are going to insert tickets one at a time to make sure we don't go over. 
				// This is a magic SQL query which will only insert if there is space. 
				/*
						It works by selecting our set of values once for each row in the inner SELECT'd table.
						This table will either have one row, if COUNT(*) <= ticket_limit,
						(and so we insert the new ticket once), or no rows, in which case
						we insert no tickets.
						It is possible we could be even cleverer here and ensure the inner 
						SELECT has the same number of rows as tickets we want to book of this 
						type, then we would just need one query per ticket type.
					*/
				var sql = "INSERT INTO ticket \
							(user_id, ticket_type_id, guest_name, donation, transaction_value, payment_method_id, status, book_time) \
						SELECT ?, ?, ?, ?, ?, ?, 'PENDING', UNIX_TIMESTAMP() \
						FROM \
							(SELECT COUNT(*) sold FROM ticket WHERE ticket_type_id=? AND (status='PENDING' OR status='CONFIRMED' OR status='ADMITTED' OR status='CANCELLED') A \
							JOIN \
							(SELECT ticket_limit cap FROM ticket_type WHERE id=?) B \
							WHERE B.cap>A.sold;";
				var promises = [];

				_.each(ts, function(t) {
					promises.push(
						runSql(sql, [user_id, t.ticket_type_id, t.guest_name, t.donation, t.payment_method, t.transaction_value,
							t.ticket_type_id, t.ticket_type_id
						])
						.then(function(result) {

							if (result.affectedRows <= 0) {
								// insert failed - waiting list
								t.status = "PENDING_WL";
								return runSql("INSERT INTO ticket SET ?, book_time=UNIX_TIMESTAMP()", [t]);
							} else {
								return result;
							}
						})
						.then(function(result) {
							// we've just inserted either a real ticket or a waiting list ticket.
							// Get the actual inserted item for display:
							return runSql("SELECT * FROM ticket WHERE id=? LIMIT 1", [result.insertId]);
						});
					);

				});
				return Q.all(promises);
			})
			.then(function(results) {

				// split successful and failed inserts
				return _(results)
					.flatten()
					.groupBy('status')
					.value();
			});
	}
}