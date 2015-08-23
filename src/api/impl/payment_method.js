/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("./connection.js");
var runSql = connection.runSql;

module.exports = {
	get: get,
	getAll: getAll,
	getByUser: getByUser
};

function get(payment_method_id) {
	var sql = "SELECT * FROM payment_method WHERE id=?;";
	return runSql(sql, [payment_method_id]);
}

function getByUser(user_id) {
	var sql = "SELECT id, name, description, event_id, ticket_limit \
	FROM payment_method JOIN \
		(SELECT DISTINCT(payment_method_id) FROM \
			(SELECT * FROM user_group_membership WHERE user_id=?) A \
				JOIN group_payment_method_access \
				ON A.group_id=group_payment_method_access.group_id) B \
		ON B.payment_method_id=id;";
	return runSql(sql, [user_id]);
}

function getAll(event_id) {
	var sql = "SELECT id, name, description, event_id, ticket_limit \
	FROM payment_method WHERE event_id=?";
	return runSql(sql, [event_id]);
}
