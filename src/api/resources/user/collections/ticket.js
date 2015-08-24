/**
 * Copyright (C) 2015  Mabel Ticketing
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("../../../connection.js");
var config = require("../../../../config.js");
var runSql = connection.runSql;
var _ = require("lodash");

module.exports = ticket;

function ticket(user_id) {
    return {
        get: get,
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

    	// TODO: I mostly copied functionality from booking.js, but I don't
    	// think this handles per-user or per payment_method ticket limits.
    	// Where did this happen before?!

    	var not_open;
        return canBook(tickets)
            .then(function(tickets) {
            	not_open = tickets.closed;
            	return book(tickets.open);
            })
            .then(function(tickets) {
            	pending = tickets["PENDING"];
            	waiting_list = tickets["PENDING_WL"];
            	return {
            		not_open: not_open,
            		pending: tickets["PENDING"],
            		waiting_list: tickets["PENDING_WL"];
            	}
            })

        // Helper function to determine if booking is available for all tickets in an array
        function canBook(ts) {
            // Note that we could do this by generating all the (type, group) pairs
            // and querying each but I want to minimise # of queries

            // allow calling with a single ticket (might be useful?)
            if (ts.constructor !== Array) ts = [ts];

            var _types = _(ts)
                .groupBy('ticket_type_id') // gather up tickets by type id
                .keys() // only actually care about the type id
                .map(function(type) { // get all relevant access rights
                    return runSql("SELECT * FROM group_access_right WHERE ticket_type_id=?", [type]);
                }).value();

            // get all my groups
            var _groups = runSql("SELECT * FROM user_group_membership WHERE user_id=?", [id]);

            var now = new Date().getTime() / 1000;

            // wait for all my queries to be made
            return Q.all([_groups].concat(_types))
                .then(function(results) {

                    var groups = _.pluck(results.shift(), 'id'); // I only care about the group ids

                    return _(results)
                        .groupBy('ticket_type_id') // gather up rights by type
                        .mapObject(function(type_rights) { // for each type, see if I have access
                            return _(type_rights)
                                .groupBy('group_id') // gather up rights by group
                                .pick(groups) // only look at rights for my groups
                                .some(function(right) { // check if any rights are currently valid
                                    return right.open_time < now && right.close_time > now;
                                }).value();
                        }).value();
                })
                .then(function(typeAccess) {
                    // at this point we should have an object with the relevant ticket
                    // types as keys, and boolean values indicating if I have access.

                    var r = _.partition(ts, function(t) {
                        return typeAccess[t.ticket_type_id]
                    });
                    return {
                        open: r[0],
                        closed: r[0]
                    };
                });
        }

        // helper function to carefully book tickets (avoiding races and such)
        function book(ts) {

            var getType = _.memoize(function(ticket_type_id) {
                return runSql("SELECT * FROM ticket_type WHERE id=?", ticket_type_id);
            });

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

}