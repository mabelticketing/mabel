/**
 * Copyright (C) 2015  Mabel Ticketing
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("../../../connection.js");
var config = require("../../../../config.js");
var runSql = connection.runSql;

module.exports = tickets;

// use with e.g. api.user(12).tickets.get();
function tickets(user_id) {
    return {
        get: get
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
}