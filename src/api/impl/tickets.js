/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("../connection.js");
var runSql = connection.runSql;
var _ = require("lodash");
var Q = require("q");

// api.tickets.get(opts)
// api.tickets.get.waiting_list(opts);
module.exports = {
	get: get,
	del: del
};

function get(opts) {
	var sql = connection.getFilteredSQL("ticket", opts);

	return runSql(sql);
}

function del(ids) {
	var sql = "UPDATE ticket SET status='CANCELLED' WHERE id=?";
	var promises = _.map(ids, function(id) {
		return runSql(sql, [id]);
	});

	return Q.all(promises);
}

function getDetailed(ticket_id) {
	var sql = "SELECT a.id, user_id, guest_name as guest_name, user.name AS booking_user_name, ticket_type_id, \
					ticket_type.name AS ticket_type_name, status_id, ticket_status.name AS status_name, book_time\
				FROM (SELECT * FROM ticket WHERE id=?) AS a \
				JOIN user ON a.user_id=user.id \
				JOIN ticket_type on ticket_type.id=ticket_type_id \
				JOIN ticket_status ON ticket_status.id=status_id \
				WHERE ticket_type_id<>5 LIMIT 1;";
	return runSql(sql, [ticket_id]).then(function(values) {
		return values[0];
	});
}

function admitted() {
	return runSql("SELECT COUNT(*) as admitted FROM ticket WHERE status=\"ADMITTED\";")
		.then(function(result) {
			return {success:true, result:result[0]};
		});
}

function admit(ticket_id) {
	var sql = "SELECT status FROM ticket WHERE id=? LIMIT 1";
	return runSql(sql, [ticket_id])
		.then(function(statuses) {
			if (statuses.length < 1) throw Error("No ticket with that ID");
			if (statuses[0].status_id !== 2) throw Error("Ticket status is '" + statuses[0].name + "'");
			sql = "UPDATE ticket SET status=\"ADMITTED\" WHERE id=?";
			return runSql(sql, [ticket_id]);		
		})
		.then(function() {
			return runSql("SELECT COUNT(*) as admitted FROM ticket WHERE status=\"ADMITTED\";");
		})
		.then(function(result) {
			return {success:true, result:result[0]};
		}, function(err) {
			console.log(err);
			return {success: false, error: err.message};
		});
}

function getAllDetailed() {
	var sql = "SELECT a.id, user_id, guest_name as guest_name, user.name AS booking_user_name, ticket_type_id, \
					ticket_type.name AS ticket_type_name, status, book_time, user.email AS booking_user_email\
				FROM (SELECT * FROM ticket) AS a \
				JOIN user ON a.user_id=user.id \
				JOIN ticket_type on ticket_type.id=ticket_type_id";
	return runSql(sql);

}
