/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("../connection.js");
var runSql = connection.runSql;

module.exports = {
	getAll: getAll,
	getAllDetailed: getAllDetailed
};

function getAllDetailed() {
	var sql = "SELECT a.id, user_id, guest_name as guest_name, user.name AS booking_user_name, ticket_type_id, \
					ticket_type.name AS ticket_type_name, status_id, ticket_status.name AS status_name, book_time, user.email AS booking_user_email\
				FROM (SELECT * FROM ticket WHERE ticket_type_id<>5) AS a \
				JOIN user ON a.user_id=user.id \
				JOIN ticket_type on ticket_type.id=ticket_type_id \
				JOIN ticket_status ON ticket_status.id=status_id";

	return runSql(sql);
}

function getAll(opts) {
	var sql = connection.getFilteredSQL("ticket", opts);

	return runSql(sql);
}
