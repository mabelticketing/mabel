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
var Q = require("q");
var moment = require("moment");

module.exports = function (user_id) {

	ticket.get = get;
	ticket.post = post;

	return ticket;

	function ticket(ticket_id) {
		return {
			get: get,
			put: put,
			delete: del
		};

		function get() {
			return runSql("SELECT * FROM ticket WHERE id=? LIMIT 1;",[ticket_id])
				.then(function(rows) {
					if (rows.length<1) {
						var e = new Error("Ticket not found");
						e.code = 404;
						throw e;
					}
					return rows[0];
				});
		}

		function put(opts) {
			var ticket = opts.ticket;
			return runSql("UPDATE ticket SET ? WHERE id=?;", [ticket, ticket_id])
				.then(get);
		}

		function del() {
			// TODO: maybe serve up a nice erorr message for people who try to cancel tickets which are not pending
			return Q.all([
				runSql("UPDATE ticket SET status='CANCELLED' where id=? AND status='PENDING';",[ticket_id]),
				runSql("UPDATE ticket SET status='CANCELLED_WL' where id=? AND status='PENDING_WL';",[ticket_id])
			])
			.then(function() {
				return {success:true};
			});
		}
	}

	function get() {
		var sql = "SELECT ticket.book_time book_time, ticket.id id, ticket.transaction_value, \
					 ticket.guest_name guest_name, ticket.status status, ticket.donation donation, \
					ticket_type.name name, ticket_type.id type_id, \
					payment_method.name payment_method \
				FROM ticket \
				JOIN ticket_type ON ticket.ticket_type_id=ticket_type.id \
				JOIN payment_method ON ticket.payment_method_id=payment_method.id \
				WHERE ticket.user_id=?";
		return runSql(sql, [user_id]);
	}

	function post(data) {
		var tickets = data.tickets;

		return check_types(tickets)
			.spread(function(booked, failed) {

				return [check_payments(booked), failed];
			})
			.spread(function(results, failed) {

				// NB there is technically a race condition here which would allow a user to book more than their allowance
				// It's a time-of-check-to-time-of-use (TOCTTOU) vulnerability, since a user could have two sessions, both
				// of which pass the check_allowance before either has proceeded to `book`. I don't currently believe this 
				// is a significant threat, so no measures are in place to mitigate it.
				return [check_allowance(results[0]), failed.concat(results[1])];
			})
			.spread(function(results, failed) {
				
				return [book(results[0]), failed.concat(results[1])];
			})
			.spread(function(results, failed) {
				// collect final data
				var booked = results.PENDING, 
					waiting_list = results.PENDING_WL;

				return [api.user(user_id).get(), booked, failed, waiting_list];
			})
			.spread(function(user, booked, failed, waiting_list) {
				// log and send confirmation email
				// prepare data for email
				var data = {
					booked:booked, waiting_list:waiting_list,
					totalPrice: _.sum(booked, "transaction_value"),
					payment_deadline: moment().add(14,'d').format("dddd, MMMM Do YYYY"),
					sampleID: booked.length>0?booked[0].id:123
				};
				if (booked.length + waiting_list.length > 0) {
					// TODO: Actually send the email
					console.log(user.name + " just made a booking - " + booked.length + " tickets" + 
						(waiting_list.length>0?" (and " + waiting_list.length + " waiting list)":"") +
						" for a total of £" + data.totalPrice + "");
				}
				return {
					booked: booked, 
					waiting_list:waiting_list,
					failed: failed,
					totalPrice: data.totalPrice,
					payment_deadline: data.payment_deadline
				};
			});
	}

	///////////////////////////
	// Helpers (not exposed) //
	///////////////////////////
	
	// Helper function to determine if booking is available for all tickets in an array
	function check_types(ts) {

		// get the types which are available to me
		return api.user(user_id).type.get()
			.then(function(types) {
				types = _.indexBy(types, 'id');

				ts = _.partition(ts, function(ticket) {
						if (ticket.ticket_type_id in types) {

							// jot down the type while we have it
							ticket.ticket_type = types[ticket.ticket_type_id];
							return true;	
						} 
						// console.log(ticket.ticket_type_id + "is not in ");
						// console.log(types);
						ticket.reason = "You don't have access to this kind of ticket right now.";
					});

				// note that we do not look at ticket_limit. That's
				// because if there are no tickets available we should still
				// join the waiting list, and that's handled by "book".
			
				// array of tickets:
				// ts[0] = [{TICKET}, ...]
				return ts[0].length<1?ts:_.chain(ts[0])
					.groupBy('ticket_type_id')
					// { ticket_type_id: [{TICKET}, ...], ...}
					.values()
					// array of tickets grouped by type:
					// [ [{TICKET}, ...], ...]
					.map(function(tickets) {
						// array of tickets, all of which have the same type
						// tickets = [{TICKET}, ...]
						return _.partition(tickets, function(t, i) {
							if (i < t.ticket_type.remaining_allowance) return true;
							t.reason = "You may currently only book " + t.ticket_type.type_allowance + " " + t.ticket_type.name + " ticket" + (t.ticket_type.type_allowance===1?"":"s" ) + " in total. ";
							if (t.ticket_type.remaining_allowance > 0) {
								t.reason += "You already have " + 
									(t.ticket_type.type_allowance - t.ticket_type.remaining_allowance) + 
									" tickets booked, so you may currently only book " + t.ticket_type.remaining_allowance + " more.";
							} else if (t.ticket_type.remaining_allowance === 0) {
								t.reason += "You already have this many tickets booked, so you may not currently book any more.";
							} else {
								t.reason += "You already have more than this many tickets booked, so you may not currently book any more.";
							}
						});
						// returns [[{TICKET_S}, ...], [{TICKET_F}, ...]]
					})
					// [ [ [{TICKET_S}, ...], [{TICKET_F}, ...] ], ...]
					.thru(function(ts) {
						return _.zip.apply(null, ts);
					})
					// [ [[{TICKET_S}, ...], ...], [[{TICKET_F}, ...], ...] ]
					.map(_.flatten)
					// [ [{TICKET_S}, ...], [{TICKET_F}, ...] ]
					// add on the original failures (no change in structure)
					.tap(function(result) {
						result[1] = result[1].concat(ts[1]);
					})
					.value();

			});
	}
  
	// Helper function to determine if payment method is available for all tickets in an array
	function check_payments(ts) {

		// get the payment methods which are available to me
		return api.user(user_id)["payment-method"].get()
			.then(function(payment_methods) {
				payment_methods = _.indexBy(payment_methods, 'id');

				return _.partition(ts, function(ticket) {
						if (ticket.payment_method_id in payment_methods) {
							// jot down the payment method while we have it
							ticket.payment_method= payment_methods[ticket.payment_method_id];
							return true;
						}
						ticket.reason = "You don't have access to this payment method.";
					});
			});
	}

	// helper function to get users' remaining allowance
	function check_allowance(ts) {
		return api.user(user_id).allowance.get()
			.then(function(allowance) {
				var a = allowance.remaining_allowance;
				var r = _.partition(ts, function(t, i) {
					if (i < a) return true;
					t.reason = "You may only book " + a + " tickets.";
				});
				return r;
			});
	}





	// helper function to carefully book tickets (avoiding races and such)
	function book(ts) {

		if (ts.length < 1) {
			return {
				PENDING: [],
				PENDING_WL: []
			};
		}

		var promises = [];
		// add transaction value to each ticket
		// This is technically redundant in the DB but Chris is paranoid
		_.each(ts, function(t) {
			promises.push(
				api.type(t.ticket_type_id).get()
					.then(function(type) {
						t.transaction_value = type.price;
						t.transaction_value += t.donation ? config.donation_value : 0;
					})
			);
		});

		// now actually insert
		return Q.all(promises)
			.then(function() {

				var sql = "CALL safe_add_ticket(?, ?, ?, ?, ?, ?);";
				var promises = [];

				_.each(ts, function(t) {
					promises.push(
						runSql(sql, [user_id, t.ticket_type_id, t.guest_name, t.donation, t.payment_method_id, t.transaction_value])
							.spread(function(result, meta) {

								if (result[0].rowsAffected <= 0) {
									// insert failed - waiting list
									t.status = "PENDING_WL";
									return runSql("INSERT INTO ticket SET user_id=?, ?, book_time=UNIX_TIMESTAMP()", [user_id, _.omit(t, ['ticket_type', 'payment_method', 'form_id'])]);
								} else {
									return result[0];
								}
							})
							.then(function(result) {
								// we've just inserted either a real ticket or a waiting list ticket.
								// Get the actual inserted item for display:
								return api.ticket(result.insertId).get();
							})
							.then(function(ticket) {
								// add back the ticket type and payment_method that we jotted down earlier
								ticket.ticket_type = t.ticket_type;
								ticket.payment_method = t.payment_method;
								return ticket;
							})
					);

				});
				return Q.all(promises);
			})
			.then(function(results) {

				// split successful and failed inserts
				var res = _(results)
					.flatten()
					.groupBy('status')
					.value();
				res.PENDING = res.PENDING || [];
				res.PENDING_WL = res.PENDING_WL || [];
				return res;
			});
	}

};