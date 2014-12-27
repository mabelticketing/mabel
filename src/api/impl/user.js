var connection = require("./connection.js");
var runSql = connection.runSql;

module.exports = {
	get: get,
	getAll: getAll,
	insert: insert,
	update: update
};

function get(user_id, callback) {
	var sql = "SELECT * FROM user WHERE id=?;";
	runSql(sql, [user_id], function(err, users) {
		if (err) return callback(err);
		if (users.length !== 1) return callback({error:users.length + " users match"});
		var groupSql = "SELECT * FROM user_group_membership WHERE user_id=?;";
		runSql(groupSql, [user_id], function(err, groups) {
			if (err) return callback(err);
			users[0].groups = [];
			for (var i=0; i<groups.length; i++) {
				users[0].groups.push(groups[i].group_id);
			}
			callback(null, users[0]);
		});
	});
}

function update(user, callback) {
	var sql = "UPDATE user SET ? WHERE id=?;";
	runSql(sql, [user, user.id], function(err) {
		if (err) return callback(err);
		
		get(user.id, callback);
	});
}

function insert(user, callback) {
	var sql = "INSERT INTO user SET ?;";
	runSql(sql, [user], function(err, result) {
		if (err) return callback(err);
		
		get(result.insertId, callback);
	});
}

function getAll(opts, callback) {
	var conn = connection.getConnection();
	var sql = "SELECT * from user";

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
		sql += " JOIN (SELECT COUNT(*) AS count FROM user" + whereClause + ") AS c";
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
			} else {
				callback("Unrecognised order direction '" + opts.order[p] + "'");
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
	conn.query(sql, function(err, rows) {
		if (err) return callback(err);
		callback(null, rows);
	});
	conn.end();
}