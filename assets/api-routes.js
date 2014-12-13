/*jshint unused:true, bitwise:true, eqeqeq:true, undef:true, latedef:true, eqnull:true */
/* global require, module, console */

var express = module.parent.exports.express;

var router = express.Router();
var __ = require("./strings.js");
var passport = require("passport");
var mysql = require('mysql');
var config = require('./config.js');
// TODO: send every route through passport.authenticate
//       rather than doing it on each route individually

router.get("/", function(req, res) {
	res.json({
		"Welcome": __("Welcome to the api, Strider")
	});
});

router.get("/test",
	passport.authenticate('bearer', {
		session: false
	}),
	function(req, res) {
		res.json({
			"user": req.user
		});
	}
);

router.get("/buy",
	passport.authenticate('bearer', {
		session: false
	}),
	function(req, res) {
		res.json({
			"Welcome": __("You are authenticated!")
		});
	}
);

var conn = mysql.createConnection({
		host: config.db_host,
		user: config.db_user,
		password: config.db_password,
		database: config.db_db
	});

router.get("/user",
	passport.authenticate('bearer', {
		session: false
	}),
	function(req, res) {
		var conn = mysql.createConnection({
			host: config.db_host,
			user: config.db_user,
			password: config.db_password,
			database: config.db_db
		});
		conn.query("SELECT * FROM user WHERE id=?", [req.params.id], function(err, rows) {
			if (err) res.send(err);
			var user = rows[0];
			res.json(user);
		});
		conn.end();
	});

module.exports = router;