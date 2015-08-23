/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("../connection.js");
var runSql = connection.runSql;

module.exports = {
	get: get,
	insert: insert,
	del: del,
	update: update
};

function get(ticket_id) {
	var sql = "SELECT a.id, user_id, user.name AS booking_user_name, ticket_type_id, \
					ticket_type.name AS ticket_type_name, book_time\
				FROM (SELECT * FROM waiting_list WHERE id=?) AS a \
				JOIN user ON a.user_id=user.id \
				JOIN ticket_type on ticket_type.id=ticket_type_id LIMIT 1;";
	return runSql(sql, [ticket_id]).then(function(values) {
		return values[0];
	});
}

function update(ticket) {
	var sql = "UPDATE waiting_list SET ? WHERE id=?;";
	var promise = runSql(sql, [ticket, ticket.id]);

	return promise.then(function() {
		return get(ticket.id);
	});
}

function insert(ticket) {
	var sql = "INSERT INTO waiting_list SET ?;";
	var promise = runSql(sql, [ticket]);

	return promise.then(function(result) {
		return get(result.insertId);
	});
}

function del(ticket_id) {
	return runSql("DELETE FROM waiting_list WHERE id = ?;", [ticket_id]);
}
