/*jshint unused:true, bitwise:true, eqeqeq:true, undef:true, latedef:true, eqnull:true */
/* global require, module, console */

var express  = module.parent.exports.express;

var router   = express.Router();
var __       = require("./strings.js");
var Queue    = require("./queue.js");
var passport = require("passport");
var api      = require("./api.js");
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

// TODO: Increase number of people allowed through at a time from 1
var bookQueue = new Queue(1);

router.get("/book",
	passport.authenticate('bearer', {
		session: false
	}),
	// have to wrap in a function because express drops the 'this' context otherwise
	// it does this for performance reasons, so if necessary this is a place to optimise
	function(req, res, next) {
		bookQueue.joinQueue(req, res, next);
	},
	function(req, res) {
		res.json(api.getBookingPageData());
	}
);

router.get("/finishBook",
	passport.authenticate('bearer', {
		session: false
	}),
	function(req, res, next) {
		bookQueue.leaveQueue(req, res, next);
	},
	function(req, res) {
		res.json({
			"status": "none", // TODO: Better status?
			"content": __("You have left the queue")
		});
	}
);

router.get("/user",
	passport.authenticate('bearer', {
		session: false
	}),
	function(req, res) {
		// make this page accessible to admins only (the admin group is group 1):
		if (req.user.groups.indexOf(1) < 0)
			return res.send("You do not have permission to view this page");

		var conn = mysql.createConnection({
			host: config.db_host,
			user: config.db_user,
			password: config.db_password,
			database: config.db_db
		});
		conn.query("SELECT * FROM user WHERE id=?", [req.query.id], function(err, rows) {
			if (err) res.send(err);
			if (rows.length === 0) {
				res.json({
					error: "user doesn't exist"
				});
			} else {
				var user = rows[0];
				res.json(user);
			}
		});
		conn.end();
	});

module.exports = router;