var config = require('./config.js');
var passport = require('passport');
var connection = require("./api/impl/connection.js");
var LocalStrategy = require('passport-local').Strategy;
var RavenStrategy = require('passport-raven').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var jwt = require("jwt-simple");
var __ = require("./strings.js");
var crypto = require('crypto');

var secret = config.jwt_secret;

// configure trivial passport authentication strategy
passport.use(new LocalStrategy(
	function(email, password, done) {
		var count = (email.match(/@/g) || []).length;
		if (count !== 1) {
			done({
				error: __("Invalid email address")
			});
		}
		// try to find user in db with crsid
		connection.runSql("SELECT * FROM user WHERE email=?", [email])
			.then(function(values) {
				if (values.length < 1) {
					// user not registered
					throw {
						// deliberately not saying whether it's email or password that was wrong (security mofo)
						error: __("Invalid credentials")
					};
				} else if (values.length > 1) {
					throw {
						error: __("Unexpectedly found many users :(")
					};
				} else {
					var user = values[0];
					if (user.is_verified === 0) {
						// user is not verified
						throw {
							error: __("User is not verified")
						};
					} else {
						var hash = crypto.createHash('md5');
						hash.update(password);
						var md5_pass = hash.digest();
						if (md5_pass === user.password_md5) {
							return getToken(user.id);
						} else {
							throw {
								error: __("Invalid credentials")
							};
						}
					}
				}
			})
			.then(function(token) {
				return done(null, {
					token: token,
				});
			}, function(err) {
				return done(err);
			});
	}
));

// configure raven passport authentication strategy
passport.use(new RavenStrategy({
	// NB I don't know what audience is actually for. It seems to just work like a base url
	audience: config.base_url,
	desc: __('Mabel Ticketing System'),
	msg: __('Mabel needs to check you are a current member of the university'),
	// use demonstration raven server in development
	debug: false
}, function(crsid, params, done) {

	// try to find user in db with crsid
	connection.runSql("SELECT * FROM user WHERE crsid=?", [crsid])
		.then(function(rows) {
			var tokenPromise;

			if (rows.length < 1) {
				// if user not in table then put them in
				tokenPromise = register({
					// TODO: Can we get a better name than this?
					name: "Mabel User",
					email: crsid + "@cam.ac.uk",
					crsid: crsid,
					is_verified: 1
				}).then(function(user) {
					return getToken(user.id);
				});

			} else {
				// the user is in the table, so just get his user id to encode as the token
				tokenPromise = getToken(rows[0].id);
			}

			tokenPromise.then(function(token) {
				done(null, {
					token: token,
				});
			}, function(err) {
				done(err);
			});
		});

}));

// passport bearer strategy
passport.use(new BearerStrategy(
	function(token, done) {
		var decoded = jwt.decode(token, secret);
		if (decoded.authenticated === true) {
			return done(null, {
				id: decoded.id,
				groups: decoded.groups,
				token: token
			}, null);
		} else {
			return done(null, false);
		}
	}
));



// below is currently not used meaningfully because we don't actually use sessions
// but things get unhappy if the functions don't exist

passport.deserializeUser(function(userid, done) {
	// convert a user id into the user object itself
	done(null, userid);
});

passport.serializeUser(function(user, done) {
	// convert a user object into the ID.
	// we do this to keep the session size small
	done(null, user);
});


function register(user) {
	var insertQuery = "INSERT INTO user SET ?, registration_time=UNIX_TIMESTAMP()";
	return connection.runSql(insertQuery, user)
		.then(function(result) {
			return result.insertId;
		})
		// TODO: lookup groups and assign
		// register will return a promise which is resolved with the new user
		.then(getUser)
		.then(function(newUser) {
			var groups = [];
			// TODO: lookup groups
			newUser.groups = groups;
			return newUser;
		});
}

function getUser(userId) {
	return connection.runSql("SELECT * FROM user WHERE id = ?", [userId])
		.then(function(results) {
			if (results.length !== 1) {
				throw {
					error: __("Unexpected user length")
				};
			}
			return results[0];
		});
}

// the token contains the user ID and also the groups which the user is a member of
function getToken(userId) {

	// try to find user in db with crsid
	var sql = "SELECT user_group.id AS group_id FROM user_group \
		JOIN user_group_membership \
		ON (user_group.id=user_group_membership.group_id) \
		WHERE user_id=?";
	return connection.runSql(sql, [userId]).then(
		function(rows) {
			var groups = [];
			for (var i = 0; i < rows.length; i++) {
				groups.push(rows[i].group_id);
			}
			// TODO: compress this somewhat?
			var tokenObj = {
				authenticated: true,
				id: userId,
				groups: groups
			};
			return jwt.encode(tokenObj, secret);
		}
	);
}