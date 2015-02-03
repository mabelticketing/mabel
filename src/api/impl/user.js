var connection = require("./connection.js");
var runSql = connection.runSql;
var Q = require("q");
var config = require("../../config.js");

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
	var p = runSql(sql, [user_id]).then(
		function(users) {
			if (users.length !== 1) throw {error:users.length + " users match"};
			var groupSql = "SELECT * FROM user_group_membership WHERE user_id=?;";
			return runSql(groupSql, [user_id]).then(function(groups) {
				users[0].groups = [];
				for (var i=0; i<groups.length; i++) {
					users[0].groups.push(groups[i].group_id);
				}
				return users[0];	
			});
		}
	);
	if (callback !== undefined)
		p.then(function(result) { callback(null, result); }, callback);
	return p;
}

function getAllowance(user_id) {
	// TODO: Parameterise this
	var donation_ticket_type_id = config.donation_ticket_type_id;
	return runSql("SELECT a-b AS allowance FROM \
		(SELECT MAX(ticket_allowance) a \
			FROM user_group \
			JOIN user_group_membership \
				ON user_group.id=user_group_membership.group_id \
			WHERE user_id=?) A\
		JOIN (SELECT COUNT(*) b \
			FROM ticket \
			WHERE user_id=? AND ticket_type_id<>?) B;", [user_id, user_id, donation_ticket_type_id]);
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
	sql += "DELETE FROM ticket WHERE user_id = ?; ";
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
	var sql = connection.getFilteredSQL("user", opts);
	runSql(sql).then(
		function(rows) {
			callback(null, rows);
		}, function(err) {
			callback(err);
		}
	);
}