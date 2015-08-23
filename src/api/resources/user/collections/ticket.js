/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("../../../connection.js");
var runSql = connection.runSql;
var config = require("../../../../config.js");

module.exports = {
	get: get,
};

function get(user_id) {
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
