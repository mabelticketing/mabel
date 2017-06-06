/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("../connection.js");
var runSql = connection.runSql;
var Q = require("q");
var _ = require("lodash");
var crypto = require('crypto');
var api = require("../api.js");


module.exports = user;

function user(id) {

	return {
		// main methods
		get: get, 
		put: put,
		del: del,

		// subpaths
		allowance: require('./user/allowance.js')(id),
		'payment-method': require('./user/payment-methods.js')(id),
		type: require('./user/types.js')(id),
		ticket: require("./user/tickets.js")(id),

		confirm: require('./user/confirm.js')(id)
	};

	function get() {
		var userPromise = runSql("SELECT * FROM user WHERE id=? LIMIT 1;", [id])
			.then(function(rows) {
				if (rows.length < 1) {
					var err = new Error("User does not exist");
					err.code = 404; 
					throw err;
				} else if (rows.length > 1) {
					throw new Error("More than one user exists with that ID. How?!");
				}
				return rows[0];
			});

		// also get the groups for this user
		var groupPromise = runSql("SELECT * FROM user_group_membership WHERE user_id=?;", [id]);
		
		return Q.all([userPromise, groupPromise])
			.then(function(results) {
				results[0].groups = _.pluck(results[1], 'group_id');
				return results[0];
			});
	}

	function put(data) {

		var u = data.u;

		// update groups separately from the rest of the users' properties
		var userGroups;
		if (u.groups !== undefined) {
			userGroups = u.groups;
			delete u.groups;
		}

		// update normal properties
		var promises = [runSql("UPDATE user SET ? WHERE id=?;", [u, id])];

		// update groups
		if (userGroups !== undefined) {
			promises.push(runSql("DELETE FROM user_group_membership WHERE user_id=?;", [id]));

			var insql = "INSERT INTO user_group_membership SET ?;";

			// prepare a statement for each group membership
			promises = promises.concat(_.map(userGroups, function(group) {
				return runSql(insql, {
					user_id: id,
					group_id: group
				});
			}));
			
		}
		return Q.all(promises)
			.then(function() {
				return get();
			});
	}


	function del() {
		var sql = "DELETE FROM user_group_membership WHERE user_id=?; ";
		sql += "DELETE FROM transaction WHERE user_id = ?; ";
		sql += "DELETE FROM ticket WHERE user_id = ?; ";
		sql += "DELETE FROM user WHERE id = ?; ";
		return runSql(sql, [id, id, id, id]);
	}

}

// collection methods:

user.post = function post(data) {
	var source = data.u;

	var u = {};
	// extract groups
	// everyone gets at least group 4
	var groups = [4];
	if (source.groups !== undefined) {
		groups = groups.concat(source.groups);
	}

	// basic validation
	// name and email are always required
	var e;
    if (source.name === undefined || source.name === null || source.name.length < 1 || source.name === "Mabel User") {
    	e = new Error("User lacks a valid name");
    	e.code = 401;
    	throw e;
    } else if (source.email === undefined || source.email === null || source.email.length < 1) {
    	e = new Error("User lacks a valid email");
    	e.code = 401;
    	throw e;
    }
    u.name = source.name;
    u.email = source.email;

    // pass on crsid if defined
    if (source.crsid !== undefined && source.crsid !== null && source.crsid.length > 0) u.crsid = source.crsid;


    if (source.is_verified !== undefined && source.is_verified !== null) {
    	if (source.is_verified === false) {
	    	// if the source says we're not verified, then generate a verification code	
	    	u.verification_code = genCode(32);
	    	u.is_verified = false;
	    } else {
			// else assume we've already been verified by some external auth
	    	u.is_verified = true;
	    }
	} else {
		// if there's no mention of verification, assume we're not verified
    	u.verification_code = genCode(32);
    	u.is_verified = false;
	}

	// hash the password if one has been given
    if (source.password !== undefined) {
		if (source.password.length < 5) {
	    	e = new Error("Password must be at least 5 characters long");
	    	e.code = 401;
	    	throw e;
		}
        var hash = crypto.createHash('md5');
        hash.update(source.password);
        u.password_md5 = hash.digest('hex');
    }

    // check we're not already registered
	return connection.runSql("SELECT * FROM user WHERE email=?", [u.email])
		.then(function(users) {
			if (users.length > 0) {
				// user already exists
		    	e = new Error(u.email + ' has already been registered.');
		    	e.code = 401;
		    	throw e;
			}

			// finally we can insert
   			return connection.runSql("INSERT INTO user SET ?, registration_time=UNIX_TIMESTAMP()", [u]);
   		})
        .then(function(result) {

        	// now also insert group memberships
            var promises = [];
            promises.push(user(result.insertId).get());

        	if (groups !== null) {
	            for (var i = 0; i < groups.length; i++) {
	                promises.push(
	                    connection.runSql("insert into user_group_membership (user_id, group_id) VALUES (?, ?)", [result.insertId, groups[i]])
	                );
	            }
        	}
            return Q.all(promises);
        })
        .spread(function(u, group_result1) {
			// mailgun doesn't seem to like certain characters in the address
			api.user(u.id).confirm.get();
			return u;
		});
};


// extra methods - internal use only:

user.get_by_email = function(data) {
	return runSql("SELECT * FROM user WHERE email=? LIMIT 1;", [data.user.email])
		.then(function(rows) {
			if (rows.length < 1) {
				var err = new Error("User does not exist");
				err.code = 404; 
				throw err;
			}
			return rows[0];
		});
};


function genCode(len) {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for (var i = 0; i < len; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}
