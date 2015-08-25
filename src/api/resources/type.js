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

function post(ticket_type) {
	var sql = "INSERT INTO ticket_type SET ?;";

	return runSql(sql, [ticket_type])
		.then(function(result) {
			return _id(result.insertId).get();
		});
}

function _id(id) {
	return {
		get: get,
		put: put,
		del: del
	};

	function get() {
		// This returns a group access rights with the result
		// for your convenience.
		return Q.all([
			runSql("SELECT * FROM ticket_type WHERE id=? LIMIT 1;", [id]), 
			runSql("SELECT * FROM group_access_right WHERE ticket_type_id=?;", [id])
		]).then(function(values) {
			if (values[0].length !== 1) throw new Error("Expected one ticket type but got " + values[0].length);
			var type = values[0][0];
			type.groups = _.map(values[1], function (right) {
				return right.group_id;
			});
			return type;
		});
	}

	function put(ticket_type) {

		var allowedGroups;
		if (ticket_type.groups !== undefined) {
			allowedGroups = ticket_type.groups;
		}

		var sql = "UPDATE ticket_type SET ? WHERE id=?;";
		var promise = runSql(sql, [ticket_type, id]);

		if (allowedGroups !== undefined) {
			var groupPromise = setAllowedGroups(id, allowedGroups);
			promise = Q.all([promise, groupPromise]);
		}

		return promise.then(function() {
			return get();
		});
	}

	function del() {
		// TODO: put checks on ticket status in this query - if it is only cancelled tickets, probably fine.
		// TODO: deal with the error somewhere
		var promise = runSql("SELECT COUNT(*) FROM ticket WHERE ticket_type_id=?;", [id]);

		return promise.then(function(rows) {
			if (rows[0]) throw new Error('You cannot delete a ticket type if there are tickets that exist with that ticket type.');
			return runSql("DELETE FROM ticket WHERE ticket_type_id=?;", [id]);
		}).then(function() {
			return runSql("DELETE FROM group_access_right WHERE ticket_type_id = ?;", [id]);
		}).then(function() {
			return runSql("DELETE FROM ticket_type WHERE id=?;", [id]);
		});
	}

	// HELPERS (not exposed)

	function setAllowedGroups(groups) {
		// we expect this to be a full specification of user groups
		// i.e. any groups not mentioned should be removed
		var delSql = "DELETE FROM group_access_right WHERE ticket_type_id=?;";

		return runSql(delSql, [id])
			.then(function() {
				var insSql = "INSERT INTO group_access_right SET ?;";

				// prepare statement for each group membership
				var promises = _.map(groups, function(group) {
					return runSql(insSql, [{
						ticket_type_id: id,
						group_id: group
					}]);
				});
				return Q.all(promises);
			});
	}
}
