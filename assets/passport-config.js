/*jshint unused:true, bitwise:true, eqeqeq:true, undef:true, latedef:true, eqnull:true */
/* global require, console */
var config 		   = require('./config.js');
var passport       = require('passport');
var LocalStrategy  = require('passport-local').Strategy;
var RavenStrategy  = require('passport-raven').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var jwt            = require("jwt-simple");
var __             = require("./strings.js");
var mysql          = require("mysql");
var https          = require("https");

var secret = config.jwt_secret;

function getToken(userId) {
	return jwt.encode({
		authenticated: true,
		id: userId
	}, secret);
}

// configure trivial passport authentication strategy
passport.use(new LocalStrategy(
	function(username, password, done) {
		switch (username) {
			case "cl554":
				if (password === "eje14") {
					var token = getToken("cl554");
					return done(null, {
						token: token,
					});
				}
				break;
			case "tl368":
				if (password === "emb15") {
					var token = getToken("tl368");
					return done(null, {
						token: token,
					});
				}
				break;
			default:
				if (password === "myPass") {
					var token = getToken(username);
					return done(null, {
						token:token
					});
				}
		}
		return done(null, false, {
			message: __("Invalid username or password")
		});
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
	var conn = mysql.createConnection({
		host: config.db_host,
		user: config.db_user,
		password: config.db_password,
		database: config.db_db
	});
	conn.connect();

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
					name = "Demo User";
					var insertQuery = "INSERT INTO user (name, email, crsid, registration_time) " +
						 			"VALUES (?,?,?,CURRENT_TIMESTAMP)";
					
					// TODO: We have a bit more Ibis stuff to process to allocate user groups

					conn.query(insertQuery, 
						[name, crsid + "@cam.ac.uk", crsid],
						function(err, result) {
							// pass errors through middleware
							if (err) done(err);

							// now finally return the page to the user
							done(null, {
								token: getToken(result.insertId)
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
			done(null, {
				token: getToken(rows[0].id)
			});
		}
	});
}));

// passport bearer strategy
passport.use(new BearerStrategy(
	function(token, done) {
		var decoded = jwt.decode(token, secret);
		if (decoded.authenticated === true) {
			return done(null, {
				id: decoded.id
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