var connection = require("./connection.js");
var runSql = connection.runSql;
var Q = require("q");

module.exports = {
	getForUser: getForUser,
	getAll: getAll,
	insert: insert,
	get: get,
	del: del,
	update: update
};

function getForUser(user, event_id, callback) {
	if (user.groups.length < 1)
		return callback({error:"The user is not a member of any groups!"});
	var sql = "SELECT DISTINCT(ticket_type.id) AS ticket_type_id,\
			ticket_type.name AS name, \
			ticket_type.price AS price \
		FROM group_access_right \
		JOIN user_group \
			ON user_group.id = group_access_right.group_id \
		JOIN ticket_type \
			ON ticket_type.id = group_access_right.ticket_type_id \
		WHERE ticket_type.event_id=? AND (";

	var sep = "";
	for (var i = 0; i < user.groups.length; i++) {
		sql += sep + "user_group.id = ?";
		sep = " OR ";
	}
	sql += ");";
	return runSql(sql, [event_id].concat(user.groups));
}

function getAll(opts, event_id) {

	var conn = connection.getConnection();
	opts.where = "event_id=" + conn.escape(event_id);
	var sql = connection.getFilteredSQL("ticket_type", opts, conn);
	conn.end();

	return runSql(sql, true);
}

function insert(ticket_type, event_id) {
	ticket_type.event_id = event_id;
	var sql = "INSERT INTO ticket_type SET ?;";
	var promise = runSql(sql, [ticket_type]);

	return promise.then(function(result) {
		return get(result.insertId);
	});
}

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
	var sql = "DELETE FROM ticket WHERE ticket_type_id=?; ";
	sql += "DELETE FROM group_access_right WHERE ticket_type_id = ?; ";
	sql += "DELETE FROM ticket_type WHERE id=?";
	var p = runSql(sql, [ticket_type_id,ticket_type_id,ticket_type_id], true);
	return p.then(function() {
		return {};
	});
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
	return runSql(sql, data, true);
}

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