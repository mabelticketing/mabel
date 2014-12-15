var config = require('./config.js');
var passport = require('passport');
var getConnection = require("./api/connection.js").getConnection;
var LocalStrategy = require('passport-local').Strategy;
var RavenStrategy = require('passport-raven').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var jwt = require("jwt-simple");
var __ = require("./strings.js");

var secret = config.jwt_secret;

// the token contains the user ID and also the groups which the user is a member of
function getToken(userId, callback) {
	var conn = getConnection();

	// try to find user in db with crsid
	var sql = "SELECT user_group.id AS group_id FROM user_group \
		JOIN user_group_membership \
		ON (user_group.id=user_group_membership.group_id) \
		WHERE user_id=?";

	conn.query(sql, [userId], function(err, rows) {
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
		callback(jwt.encode(tokenObj, secret));
	});

	conn.end();

}

// configure trivial passport authentication strategy
passport.use(new LocalStrategy(
	function(email, password, done) {
		var count = (email.match(/@/g) || []).length;
		if (count !== 1) {
			done({
				error: __("Invalid email address")
			});
		}
		var username = email.split("@")[0];
		// password has to be equal to the part of the email before
		if (password === username) {
			var conn = getConnection();

			// try to find user in db with crsid
			conn.query("SELECT * FROM user WHERE email=?", [email], function(err, rows) {
				// pass errors through middleware
				if (err) done(err);
				if (rows.length < 1) {
					var insertQuery = "INSERT INTO user (name, email, registration_time) " +
						"VALUES (?,?,CURRENT_TIMESTAMP)";

					conn.query(insertQuery, ["Mabel User", email],
						function(err, result) {
							// pass errors through middleware
							if (err) return done(err);

							// now finally return the page to the user

							getToken(result.insertId, function(token) {
								done(null, {
									token: token,
								});
							});
						}
					);
					// });
					// }).on('error', function(e) {
					// 	console.log("Got error: ", e);
					// 	done(err);
					// });
					conn.end();
				} else {
					// the user is in the table, so just get his user id to encode as the token
					
					return getToken(rows[0].id, function(token) {
						done(null, {
							token: token,
						});
					});
				}
			});

		}
	}
));

// configure raven passport authentication strategy
passport.use(new RavenStrategy({
	// NB I don't know what audience is actually for. It seems to just work like a base url
	audience: config.base_url,
	desc: __('Mabel Ticketing System'),
	msg: __('Mabel needs to check you are a current member of Emmanuel College'),
	// use demonstration raven server in development
	debug: false
}, function(crsid, params, done) {
	// connect to database
	var conn = getConnection();

	// try to find user in db with crsid
	conn.query("SELECT * FROM user WHERE crsid=?", [crsid], function(err, rows) {
		// pass errors through middleware
		if (err) done(err);
		if (rows.length < 1) {
			// if user not in table then put them in

			// Temporary patch while lookup is broken
			// var lookupURL = config.lookup_url + "person/crsid/" + crsid + "?format=json";
			// https.get(lookupURL, function(res) {
			// var body = '';
			// res.on('data', function(chunk) {
			// 	body += chunk;
			// });
			// res.on('end', function() {
			// var response = JSON.parse(body);
			// var name = response.result.person.displayName;
			var name = "Demo User";
			var insertQuery = "INSERT INTO user (name, email, crsid, registration_time) " +
				"VALUES (?,?,?,CURRENT_TIMESTAMP)";

			// TODO: We have a bit more Ibis stuff to process to allocate user groups

			conn.query(insertQuery, [name, "demo@cam.ac.uk", crsid],
				function(err, result) {
					// pass errors through middleware
					if (err) done(err);

					// now finally return the page to the user

					getToken(result.insertId, function(token) {
						done(null, {
							token: token,
						});
					});
				}
			);
			// });
			// }).on('error', function(e) {
			// 	console.log("Got error: ", e);
			// 	done(err);
			// });
		} else {
			// the user is in the table, so just get his user id to encode as the token
			
			getToken(rows[0].id, function(token) {
				done(null, {
					token: token,
				});
			});
		}
	});

	conn.end();
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