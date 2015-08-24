/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("../connection.js");
var runSql = connection.runSql;
var Q = require("q");
var _ = require("underscore");

module.exports = {
	// main methods
	post: post,

	// subpaths
	id: _id,

	// stuff I haven't tidied yet
	allowance: require('./user/collections/allowance.js'),
	payment_methods: require('./user/collections/payment-method.js'),
	ticket_types: require('./user/collections/ticket-type.js'),
	tickets: require('./user/collections/ticket.js'),
	transactions: require('./user/collections/transaction.js')
};


function post(user, callback) {
	// TODO: strip group from user and insert separately
	var sql = "INSERT INTO user SET ?;";
	runSql(sql, [user], function(err, result) {
		if (err) return callback(err);
		
		get(result.insertId, callback);
	});
}

function _id(id) {

	return {
		// main methods
		get: get, 
		put: put,
		del: del,

		// subpaths
		tickets: require("./user/collections/ticket.js")(id),
	};

	function get() {
		var userPromise = runSql("SELECT * FROM user WHERE id=?;", [id])
			.then(function(values) {
				if (value.length !== 1) throw new Error("Expected one user but got " + value.length);
				return values[0];
			});

		// also get the groups for this user (TODO: is this helpful?)
		var groupPromise = runSql("SELECT * FROM user_group_membership WHERE user_id=?;", [id]);
		
		return Q.all([userPromise, groupPromise])
			.then(function(results) {
				results[0].groups = _(results[1]).pluck('group_id');
				return results[0];
			});
	}

	//TODO: so many callbacks
	function put(user) {
		// update groups separately from the rest of the users' properties
		var userGroups;
		if (user.groups !== undefined) {
			userGroups = user.groups;
			delete user.groups;
		}

		// update normal properties
		var promises = [runSql("UPDATE user SET ? WHERE id=?;", [user, id])];

		// update groups
		if (userGroups !== undefined) {
			promises.push(runSql("DELETE FROM user_group_membership WHERE user_id=?;", [id]));

			var insql = "INSERT INTO user_group_membership SET ?;";

			// prepare a statement for each group membership
			for (var i = 0; i < userGroups.length; i++) {
				grpsql += insql;
				data.push({
					user_id: id,
					group_id: userGroups[i] // NB there used to be a parseInt here but it shouldn't be api's responsibility
				});
			}

			promises.push(runSql(grpsql, data));
		}
		return Q.all(promises)
			.then(function(results) {
				return get();
			})
	}


	function del() {
		var sql = "DELETE FROM user_group_membership WHERE user_id=?; ";
		sql += "DELETE FROM transaction WHERE user_id = ?; ";
		sql += "DELETE FROM ticket WHERE user_id = ?; ";
		sql += "DELETE FROM user WHERE id = ?; ";
		return runSql(sql, [id, id, id, id]);
	}

}