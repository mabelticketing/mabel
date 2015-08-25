/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("../connection.js");
var runSql = connection.runSql;
var Q = require("q");
var _ = require("lodash");

module.exports = {
	// main methods
	post: post,

	// subpaths
	id: _id
};


function post(user) {
	var sql = "INSERT INTO user SET ?;";
	runSql(sql, [user])
		.then(function(result) {
		
		return _id(result.insertId).get();
	});
}

function _id(id) {

	return {
		// main methods
		get: get, 
		put: put,
		del: del,

		// subpaths
		allowance: require('./user/collections/allowance.js')(id),
		payment_methods: require('./user/collections/payment-method.js')(id),
		ticket_types: require('./user/collections/ticket-type.js')(id),
		ticket: require('./user/resources/ticket.js')(id),
		tickets: require("./user/collections/ticket.js")(id)
	};

	function get() {
		var userPromise = runSql("SELECT * FROM user WHERE id=?;", [id])
			.then(function(values) {
				if (value.length !== 1) throw new Error("Expected one user but got " + value.length);
				return values[0];
			});

		// also get the groups for this user
		var groupPromise = runSql("SELECT * FROM user_group_membership WHERE user_id=?;", [id]);
		
		return Q.all([userPromise, groupPromise])
			.then(function(results) {
				results[0].groups = _(results[1]).pluck('group_id');
				return results[0];
			});
	}

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
			promises = promises.concat(_.map(userGroups, function(group) {
				return runSql(insql, {
					user_id: id,
					group_id: userGroups[i] 
				});
			}));
			
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