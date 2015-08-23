/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("../../../connection.js");
var runSql = connection.runSql;

module.exports = {
	get: get,
	summary: summary
};

function get(user_id) {
	var sql = "SELECT ticket_type.name name, waiting_list.book_time book_time, waiting_list.id id, \
				ticket_type.id type_id, ticket_type.price price, payment_method.name payment_method \
			FROM waiting_list \
			JOIN ticket_type ON waiting_list.ticket_type_id=ticket_type.id \
			JOIN payment_method ON waiting_list.payment_method_id=payment_method.id \
			WHERE waiting_list.user_id=?";
	return runSql(sql, [user_id]);
}

// TODO: this might have to be in a collection
function summary(opts) {
	var sql = connection.getFilteredSQL("waiting_list_summary", opts);

	return runSql(sql);
}
