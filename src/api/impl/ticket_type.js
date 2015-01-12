var connection = require("./connection.js");
var runSql = connection.runSql;

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
	var promise = runSql("SELECT * FROM ticket_type WHERE id=? LIMIT 1;", [ticket_type_id]);
	return promise.then(function(value) {
		return value[0];
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

function update(ticket_type_id, ticket_type) {
	var sql = "UPDATE ticket_type SET ? WHERE id=?;";
	var promise = runSql(sql, [ticket_type, ticket_type_id]);

	return promise.then(function() {
		return get(ticket_type.id);
	});
}