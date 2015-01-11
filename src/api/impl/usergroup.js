var connection = require("./connection.js");
var runSql = connection.runSql;

module.exports = {
	getAll: getAll,
	setGroups: setGroups,
	insert: insert,
	get: get,
	del: del,
	update: update
};
function stripMeta(obj) {
	// delete any properties which start with $ or _
	for (var i in obj) {
		if (i.indexOf("_") === 0 || i.indexOf("$") === 0) {
			delete obj[i];
		}
	}
	return obj;
}
function getFilteredSQL(table, opts, conn) {
	var sql = "SELECT * from " + table;

	var whereClause = "";
	if (opts.filter !== undefined) {
		var wheres = [];
		var hasWhere = false;
		for (var i in opts.filter) {
			if (opts.filter[i].length < 1) continue;
			hasWhere = true;
			wheres.push(conn.escapeId(i) + " LIKE " +  conn.escape('%' + opts.filter[i] + '%'));
		}
		if (hasWhere) {
			whereClause = " WHERE " + wheres.join(" AND ");
		}
	}

	if (opts.size !== undefined) {
		sql += " JOIN (SELECT COUNT(*) AS $count FROM " + table + whereClause + ") AS c";
	}
	sql += whereClause;

	if (opts.order !== undefined) {
		var orders = [];
		var hasOrder = false;
		for (var p in opts.order) {
			var dir;
			hasOrder = true;
			if (opts.order[p].match(/^asc$/i) !== null) {
				dir = "ASC";
			} else if (opts.order[p].match(/^desc$/i) !== null) {
				dir = "DESC";
			}
			orders.push(conn.escapeId(p) + " " +  dir);
		}
		if (hasOrder) {
			sql += " ORDER BY " + orders.join(", ");
		}
	}

	if (opts.size !== undefined) {
		sql += " LIMIT ";
		if (opts.from !== undefined) {
			sql += conn.escape(opts.from) + ",";
		}
		sql += conn.escape(opts.size);
	}
	sql += ";";
	return sql;
}

function getAll(opts) {
	// TODO: visibility of groups for admins of different events?

	var conn = connection.getConnection();
	var sql = getFilteredSQL("user_group", opts, conn);
	conn.end();

	return runSql(sql, true);
}

function setGroups(user, groups) {
	// we expect this to be a full specification of user groups
	// i.e. any groups not mentioned should be removed
	var sql = "DELETE FROM user_group_membership WHERE user_id=?;";
	var data = [user.id];
	var insql = "INSERT INTO user_group_membership SET ?;";

	// prepare a statement for each group membership
	for (var i=0; i<groups.length; i++) {
		sql += insql;
		data.push({user_id:user.id, group_id: parseInt(groups[i])});
	}
	// make sure to enable multi-statement
	return runSql(sql, data, true);
}

function insert(group) {
	var sql = "INSERT INTO user_group SET ?;";
	var promise = runSql(sql, [stripMeta(group)]);

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
	return runSql("DELETE FROM user_group WHERE id=?", [group_id]);
}

function update(group_id, group) {
	var sql = "UPDATE user_group SET ? WHERE id=?;";
	var promise = runSql(sql, [stripMeta(group), group_id]);

	return promise.then(function() {
		return get(group.id);
	});
}