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
		tickets: {
			get: tickets_get, // TODO: split into own file
			post: tickets_post // TODO: split into own file
		},
		ticket: _ticket
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


	////////////////////////
	// TICKET ROUTE STUFF //
	////////////////////////
	// TODO: this should probably go in another file but I haven't figured out how to best get user's id there
	
	function tickets_post() {

		// .....

		// Helper function to determine if booking is available for all tickets in an array
		// TODO: It would be nice to give more feedback than simply true/false for each ticket.
		// Trouble with that is what do you say if you have multiple sets of rights? e.g. you're too late
		// for the student early booking, but too early for the general public booking.
		function canBook(tickets) {
			// Note that we could do this by generating all the (type, group) pairs
			// and querying each but I want to minimise # of queries
			 
			// allow calling with a single ticket (might be useful?)
			if (tickets.constructor !== Array) tickets = [tickets];

			var _types = _(tickets)
				.groupBy('type') // gather up tickets by type id
				.keys() // only actually care about the type id
				.map(function(type) { // get all relevant access rights
					return runSql("SELECT * FROM group_access_right WHERE ticket_type_id=?", [type]);
				}).value();

			// get all my groups
			var _groups = runSql("SELECT * FROM user_group_membership WHERE user_id=?", [id]);

			var now = new Date().getTime()/1000;

			// wait for all my queries to be made
			return Q.all([_groups].concat(_types))
				.then(function(results) {

					var groups = _(results.shift()).pluck('id'); // I only care about the group ids

					return _(results)
						.groupBy('type_id') // gather up rights by type
						.mapObject(function (type_rights) { // for each type, see if I have access
							return _(type_rights)
								.groupBy('group_id') // gather up rights by group
								.pick(groups) // only look at rights for my groups
								.some(function(right) { // check if any rights are currently valid
									return right.open_time < now && right.close_time > now;
								}).value();
						}).value();
				})
				.then(function (typeAccess) {
					// at this point we should have an object with the relevant ticket
					// types as keys, and boolean values indicating if I have access.
					
					// TODO: I can't decide if canBook should return an array of bools, or
					// augment the given ticket objects
					
					// OPTION A
					// return _(tickets).map(function(t) {
					// 	return typeAccess[t.type]
					// }).value();

					// OPTION B 
					return _(tickets).each(function(t) {
						t.bookable = typeAccess[t.type]
					}).value();
				});
			
		}

		// helper function to carefully book tickets (avoiding races and such)
		function book(tickets) {
			// TODO: fill in, inspired by booking.js, wherever that is
		}
	}

	function tickets_get() {

	}

	function _ticket(ticket) {

		return {
			// main methods
			// get: get, 
			// put: put,
			// del: del
		}
	}
}