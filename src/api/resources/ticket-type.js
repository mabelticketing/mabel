/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("../connection.js");
var runSql = connection.runSql;
var Q = require("q");

module.exports = {
	insert: insert,
	get: get,
	del: del,
	update: update
};

function insert(ticket_type, event_id) {
	ticket_type.event_id = event_id;
	var sql = "INSERT INTO ticket_type SET ?;";

	return runSql(sql, [ticket_type]);
}

// TODO: not sure how to sort this one out. Should be returning promise
function get(ticket_type_id) {
	return Q.all([
		runSql("SELECT * FROM ticket_type WHERE id=? LIMIT 1;", [ticket_type_id]), 
		runSql("SELECT * FROM group_access_right WHERE ticket_type_id=?;", [ticket_type_id])
	]).then(function(values) {
		var type = values[0][0];
		type.groups = [];
		for (var i =0; i<values[1].length; i++ ) {
			type.groups.push(values[1][i].group_id);
		}
		return type;
	});
}

function del(ticket_type_id) {
	var sql = "DELETE FROM ticket WHERE ticket_type_id=?; \
			DELETE FROM group_access_right WHERE ticket_type_id = ?; \
			DELETE FROM ticket_type WHERE id=?";
	return runSql(sql, [ticket_type_id,ticket_type_id,ticket_type_id]);
}

function setAllowedGroups(ticket_type_id, groups) {
	// we expect this to be a full specification of user groups
	// i.e. any groups not mentioned should be removed
	var sql = "DELETE FROM group_access_right WHERE ticket_type_id=?;";
	var data = [ticket_type_id];
	var insql = "INSERT INTO group_access_right SET ?;";

	// prepare a statement for each group membership
	for (var i=0; i<groups.length; i++) {
		sql += insql;
		data.push({ticket_type_id:ticket_type_id, group_id: parseInt(groups[i])});
	}
	// make sure to enable multi-statement
	return runSql(sql, data);
}

// TODO: wasn't sure how to get the get(ticket_type.id) out of the function
// because don't know how to pass down ticket_type.id. Want to do this because
// API functions should do one thing. Joining of multiple queries should happen
// in the API router.
function update(ticket_type_id, ticket_type) {
	var allowedGroups;
	if (ticket_type.groups !== undefined) {
		allowedGroups = ticket_type.groups;
		delete ticket_type.groups;
	}

	var sql = "UPDATE ticket_type SET ? WHERE id=?;";
	var promise = runSql(sql, [ticket_type, ticket_type_id]);

	if (allowedGroups !== undefined) {
		var groupPromise = setAllowedGroups(ticket_type_id, allowedGroups);
		// only resolve once the group has been updated too
		promise = Q.all([promise, groupPromise]);
	}

	return promise.then(function() {
		return get(ticket_type.id);
	});
}
