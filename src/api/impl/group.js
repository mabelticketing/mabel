/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("../connection.js");
var runSql = connection.runSql;

module.exports = group;

function group(id) {
	return {
		// main methods
		get: get, 
		put: put,
		del: del
	};

	function get() {
		var promise = runSql("SELECT * FROM user_group WHERE id=? LIMIT 1;", [id]);
		return promise.then(function(value) {
			if (value.length < 1) {
				var e = new Error("Group does not exist.");
				e.code = 404;
				throw e;
			}
			return value[0];
		});
	}

	function put(group) {
		var sql = "UPDATE user_group SET ? WHERE id=?;";
		var promise = runSql(sql, [group, id]);

		return promise.then(function() {
			// retrieve the updated group
			return get(group.id);
		});
	}

	function del() {
		var sql = "DELETE FROM user_group_membership WHERE group_id=?; ";
		sql += "DELETE FROM group_access_right WHERE group_id = ?; ";
		sql += "DELETE FROM user_group WHERE id = ?; ";
		return runSql(sql, [id, id, id]).then(function() {
			return {};
		});
	}
}

group.post = function post(group) {
	var promise = runSql("INSERT INTO user_group SET ?;", [group]);

	return promise.then(function(result) {
		// retrieve the actual group from the mysql result
		return _id(result.insertId).get();
	});
}

