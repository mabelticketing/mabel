/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("./connection.js");
var runSql = connection.runSql;

module.exports = {
	all: all,
	insert: insert,
	get: get,
	del: del,
	update: update
};

function all(opts) {
	// TODO: visibility of groups for admins of different events?
	var sql = connection.getFilteredSQL("user_group", opts);

	return runSql(sql);
}

function insert(group) {
	var sql = "INSERT INTO user_group SET ?;";
	var promise = runSql(sql, [group]);

	return promise.then(function(result) {
		return get(result.insertId);
	});
}

function get(group_id) {
	var promise = runSql("SELECT * FROM user_group WHERE id=? LIMIT 1;", [group_id]);
	return promise.then(function(value) {
		return value[0];
	});
}

function del(group_id) {
	var sql = "DELETE FROM user_group_membership WHERE group_id=?; ";
	sql += "DELETE FROM group_access_right WHERE group_id = ?; ";
	sql += "DELETE FROM user_group WHERE id = ?; ";
	return runSql(sql, [group_id, group_id, group_id]).then(function() {
		return {};
	});
}

function update(group_id, group) {
	var sql = "UPDATE user_group SET ? WHERE id=?;";
	var promise = runSql(sql, [group, group_id]);

	return promise.then(function() {
		return get(group.id);
	});
}
