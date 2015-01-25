var connection = require("./connection.js");
var runSql = connection.runSql;
var Q = require("q");

var api = {
	get: get,
	getAll: getAll,
	insert: insert,
	del: del,
	update: update,
	getAllowance: getAllowance,
	group: require("./usergroup.js")
};
module.exports = api;

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

function getAllowance(user_id) {
	return runSql("SELECT a-b AS allowance FROM \
		(SELECT MAX(ticket_allowance) a \
			FROM user_group \
			JOIN user_group_membership \
				ON user_group.id=user_group_membership.group_id \
			WHERE user_id=?) A\
		JOIN (SELECT COUNT(*) b \
			FROM ticket \
			WHERE booking_user_id=?) B;", [user_id, user_id]);
}

function update(user, callback) {
	var userGroups;
	if (user.groups !== undefined) {
		userGroups = user.groups;
		delete user.groups;
	}

	var sql = "UPDATE user SET ? WHERE id=?;";
	var promise = runSql(sql, [user, user.id]);

	if (userGroups !== undefined) {
		var groupPromise = api.group.setGroups(user, userGroups);
		// only resolve once the group has been updated too
		promise = Q.all([promise, groupPromise]);
	}

	promise.then(function() {
		get(user.id, callback);
	}, function(err) {
		callback(err);
	});

	return promise;
}

function insert(user, callback) {
	// TODO: strip group from user and insert separately
	var sql = "INSERT INTO user SET ?;";
	runSql(sql, [user], function(err, result) {
		if (err) return callback(err);
		
		get(result.insertId, callback);
	});
}

function del(user_id, callback) {
	var sql = "DELETE FROM user_group_membership WHERE user_id=?; ";
	sql += "DELETE FROM transaction WHERE user_id = ?; ";
	sql += "DELETE FROM ticket WHERE booking_user_id = ?; ";
	sql += "DELETE FROM user WHERE id = ?; ";
	runSql(sql, [user_id, user_id, user_id, user_id], function(err, result){
		if (err) return callback(err);
		callback(null, {});
	}, true);
}

//TODO: We want users of different event sites to be separate
/*
	- create a default group for each event
	- add users to the appropriate group when they log into a new event site
	- api.users.getAll should return just the users within that group
*/
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
		if (err) return callback(err.message);
		callback(null, rows);
	});
	conn.end();
}