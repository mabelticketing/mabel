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

module.exports = ticket;




// use with e.g. api.user(12).ticket.post({...});
function ticket(user_id) {
	return {
		get:get,
		post: post
	};

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
	
	function post(tickets) {

		return check_types(tickets)
			.spread(function(booked, failed) {

				return [check_payments(booked), failed];
			})
			.spread(function(results, failed) {

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
				console.log(user.name + " just made a booking - " + booked.length + " tickets" + 
					(waiting_list.length>0?" (and" + waiting_list.length + " waiting list)":"") +
					"(£" + data.totalPrice + ")");
			});
	}

	///////////////////////////
	// Helpers (not exposed) //
	///////////////////////////
	
	// Helper function to determine if booking is available for all tickets in an array
	function check_types(ts) {

		// get the types which are available to me
		return api.user(user_id).types.get()
			.then(function(types) {
				types = _.indexBy(types, 'id');

				ts = _.partition(ts, function(ticket) {
						if (ticket.ticket_type_id in types) {

							// jot down the type while we have it
							ticket.ticket_type = types[ticket.ticket_type_id];
							return true;	
						} 
						ticket.reason = "You don't have access to this kind of ticket right now.";
					});
				// note that we do not really look at available. That's
				// because if there are no tickets available we shouold still
				// join the waiting list, and that's handled by "book".
			
				// ts[0] = [{TICKET}, ...]
				return _.chain(ts[0])
					.groupBy('ticket_type_id')
					// { ticket_type_id: [{TICKET}, ...], ...}
					.values()
					// [ [{TICKET}, ...], ...]
					.map(function(tickets) {
						// tickets = [{TICKET}, ...]
						return _.partition(tickets, function(t, i) {
							if (i < t.ticket_type.allowance) return true;
							t.reason = "You may only book " + t.ticket_type.allowance + " " + t.ticket_type.name + " tickets.";
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
		return api.user(user_id).payment_methods.get()
			.then(function(payment_methods) {
				payment_methods = _.indexBy(payment_methods, 'id');

				var results = 
					_.partition(ts, function(ticket) {
						if (ticket.payment_method_id in payment_methods) {
							// jot down the payment method while we have it
							ticket.payment_method= payment_methods[ticket.payment_method_id];
							return true;
						}
						ticket.reason = "You don't have access to this payment method.";
					});
				results[0] = _(results[0])
					.groupBy('payment_method_id')
						.map(function(grouped_tickets, id) {
							var l = payment_methods[id].ticket_limit;
							
							return _.partition(grouped_tickets, function(t, i) {
								if (i < l) return true;
								ticket.reason = "You may only book " + l + " tickets using this payment method.";
								results[1].push(ticket);
							});
						})
					.values().flatten() // ungroup
					.value();
				return results;
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
				});
				return r;
			});
	}





	// helper function to carefully book tickets (avoiding races and such)
	function book(ts) {

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
		Q.all(promises)
			.then(function() {

				var sql = "CALL safe_add_ticket(?, ?, ?, ?, ?, ?);";
				var promises = [];

				_.each(ts, function(t) {
					promises.push(
						runSql(sql, [user_id, t.ticket_type_id, t.guest_name, t.donation, t.payment_method_id, t.transaction_value])
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
								return api.ticket(result.insertId).get();
							})
							.then(function(ticket) {
								// add back the ticket type and payment_method that we jotted down earlier
								ticket.ticket_type = t.ticket_type;
								ticket.payment_method = t.payment_method;
							})
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