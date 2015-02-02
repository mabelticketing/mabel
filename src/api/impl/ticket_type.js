var connection = require("./connection.js");
var mysql = require("mysql");
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

// TODO: use event_id
function getForUser(user, event_id) {
	var sql = 
	"SELECT id, name, price, ticket_limit - IFNULL(C.sold,0) ticket_limit \
	FROM ticket_type \
	JOIN \
		(SELECT DISTINCT(ticket_type_id) \
		 FROM \
			 (SELECT * \
				FROM user_group_membership \
				WHERE user_id=?) A \
		 JOIN group_access_right ON A.group_id=group_access_right.group_id) B ON B.ticket_type_id=id \
	LEFT JOIN \
		(SELECT ticket_type_id, \
						COUNT(ticket_type_id) sold \
		 FROM ticket \
		 GROUP BY ticket_type_id) C ON C.ticket_type_id=id;"; 
	return runSql(sql, [user.id]);
}

function getAll(opts, event_id) {

	opts.where = "event_id=" + mysql.escape(event_id);
	var sql = connection.getFilteredSQL("ticket_type", opts);
	
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