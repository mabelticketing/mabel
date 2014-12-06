/*jshint unused:true, bitwise:true, eqeqeq:true, undef:true, latedef:true, eqnull:true */
/* global require, console */

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var RavenStrategy = require('passport-raven').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var jwt = require("jwt-simple");
var __ = require("./strings.js");
var secret = "---top-secret-string---";

function getToken(userId) {
	return jwt.encode({
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
		}
		return done(null, false, {
			message: __("Invalid username or password")
		});
	}
));

// configure raven passport authentication strategy
passport.use(new RavenStrategy({
	// NB I don't know what audience is actually for. It seems to just work like a base url
	audience: 'http://localhost:2000/api',
	desc: __('Mabel Ticketing System'),
	msg: __('Mabel needs to check you are a current member of Emmanuel College'),
	// use demonstration raven server in development
	debug: false
}, function(crsid, params, callback) {
	callback(null, {
		token: getToken(crsid)
	});
}));

// passport bearer strategy
passport.use(new BearerStrategy(
	function(token, done) {
		console.log("Checking token: " + token);
		var decoded = jwt.decode(token, secret);
		// TODO: make the token check more meaningful (see if it is valid in DB?)
		if (decoded.id === "cl554" || decoded.id === "tl368") {
			return done(null, {
				id: decoded.id
			}, {
				scope: 'all'
			});
		} else {
			return done(null, false);
		}
	}
));



// // passport session stuff - currently unused

passport.deserializeUser(function(userid, done) {
	// convert a user id into the user object itself
	done(null, userid);
});

passport.serializeUser(function(user, done) {
	// convert a user object into the ID.
	// we do this to keep the session size small
	done(null, user);
});