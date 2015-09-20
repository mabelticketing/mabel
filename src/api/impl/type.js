/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("../connection.js");
var runSql = connection.runSql;
var Q = require("q");
var _ = require("lodash");

module.exports = type;

function type(id) {
	return {
		get: get,
		put: put,
		delete: del
	};

	function get() {
		// This returns a list of groups which currently have access to this
		// ticket type for your convenience.
		return Q.all([
			runSql("SELECT * FROM ticket_type WHERE id=? LIMIT 1;", [id]), 
			runSql("SELECT * FROM group_access_right WHERE ticket_type_id=? AND open_time<UNIX_TIMESTAMP() AND close_time>UNIX_TIMESTAMP();", [id])
		]).spread(function(types, rights) {
			if (types.length < 1) {
				var e = new Error("Ticket does not exist.");
				e.code = 404;
				throw e;
			}
			var type = types[0];
			type.groups = _.pluck(rights, 'group_id');
			return type;
		});
	}

	function put(data) {

		var allowedGroups;
		if (data.ticket_type.groups !== undefined) {
			allowedGroups = data.ticket_type.groups;
		}

		var sql = "UPDATE ticket_type SET ? WHERE id=?;";
		var promise = runSql(sql, [data.ticket_type, id]);

		if (allowedGroups !== undefined) {
			var groupPromise = setAllowedGroups(id, allowedGroups);
			promise = Q.all([promise, groupPromise]);
		}

		return promise.then(function() {
			return get();
		});
	}

	function del() {
		var promise = runSql("SELECT COUNT(*) AS c FROM ticket WHERE ticket_type_id=? AND status<>'CANCELLED' AND status<>'CANCELLED_WL';", [id]);

		return promise.then(function(rows) {
			if (rows.length!==1) {
				throw new Error("Unexpected MySQL Error");
			} else if (rows[0].c > 0) { 
				var e = new Error('You cannot delete a ticket type if there are tickets that exist with that ticket type.');
				e.code = 400;
				throw e;
			}
			return runSql("DELETE FROM ticket WHERE ticket_type_id=?;", [id]);
		}).then(function() {
			return runSql("DELETE FROM group_access_right WHERE ticket_type_id = ?;", [id]);
		}).then(function() {
			return runSql("DELETE FROM ticket_type WHERE id=?;", [id]);
		});
	}
}

type.post = function post(data) {

	var allowedGroups;
	if (data.ticket_type.groups !== undefined) {
		allowedGroups = data.ticket_type.groups;
	}

	return runSql("INSERT INTO ticket_type SET ?;", [data.ticket_type])
		.then(function(result) {

			var promise = type(result.insertId).get();
			if (allowedGroups !== undefined) {
				var groupPromise = setAllowedGroups(result.insertId, allowedGroups);
				promise = Q.all([promise, groupPromise]);
			}
			return promise;
		}).spread(function(newType) {
			return newType;
		});
};

type.get = function get(opts) {
	var sql = connection.getFilteredSQL("ticket_type", opts);

	return Q.all([
		runSql(sql),
		runSql("SELECT * FROM group_access_right WHERE open_time<UNIX_TIMESTAMP() AND close_time>UNIX_TIMESTAMP();")
	]).spread(function(types, rights) {
		return _.map(types, function(type) {
			type.groups = _.pluck(_.filter(rights, {ticket_type_id: type.id}), 'group_id');
			return type;
		});
	});
};


// HELPERS (not exposed)

function setAllowedGroups(id, groups) {
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