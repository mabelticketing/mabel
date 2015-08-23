/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("./connection.js");
var runSql = connection.runSql;
var Q = require("q");

module.exports = {
	get: get,
	insert: insert,
	del: del,
	update: update,
	allowance: require('./user/collections/allowance.js'),
	payment_methods: require('./user/collections/payment-method.js'),
	ticket_types: require('./user/collections/ticket-type.js'),
	tickets: require('./user/collections/ticket.js'),
	transactions: require('./user/collections/transaction.js'),
	wl_tickets: require('./user/collections/wl-ticket.js')
};

// TODO: make it a promise the router cannot revious
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

//TODO: so many callbacks
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
	runSql(sql, [user_id, user_id, user_id, user_id], function(err){
		if (err) return callback(err);
		callback(null, {});
	});
}
