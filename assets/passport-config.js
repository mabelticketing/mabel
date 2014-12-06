/*jshint unused:true, bitwise:true, eqeqeq:true, undef:true, latedef:true, eqnull:true */
/* global require, console */

var passport       = require('passport');
var LocalStrategy  = require('passport-local').Strategy;
var RavenStrategy  = require('passport-raven').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var jwt            = require("jwt-simple");
var __             = require("./strings.js");
var mysql          = require("mysql");
var https           = require("https");

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
	audience: 'http://localhost:2000',
	desc: __('Mabel Ticketing System'),
	msg: __('Mabel needs to check you are a current member of Emmanuel College'),
	// use demonstration raven server in development
	debug: false
}, function(crsid, params, done) {
	// connect to database
	var conn = mysql.createConnection({
		host: '104.236.25.186',
		user: 'chris',
		password: 'mabel-dbCHRISTMAS',
		database: 'mabel'
	});
	conn.connect();

	// try to find user in db with crsid
	conn.query("SELECT * FROM user WHERE crsid='" + crsid + "'", function(err, rows) {
		if (err) console.log(err);
		if (rows.length == 0) {
			// if user not in table then put them in
			var lookupURL = "https://anonymous:@lookup-test.csx.cam.ac.uk/api/v1/person/crsid/" + crsid+ "?format=json";
			https.get(lookupURL, function(res) {
				var body = '';
				res.on('data', function(chunk) {
					body += chunk;
				});
				res.on('end', function() {
					var response = JSON.parse(body);
					var name = response.result.person.displayName;
					conn.query("INSERT INTO user (name, email, crsid,\
					 registration_time) VALUES ('"+name+"','"+crsid+"@cam.ac.uk','"+crsid+"', CURRENT_TIMESTAMP)");
					conn.commit(function(err) { if (err) throw err; });
				});
			}).on('error', function(e) {
				  console.log("Got error: ", e);
			});
		}
	});

	// call callback
	done(null, {
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