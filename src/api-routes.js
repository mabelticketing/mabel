/*jshint unused:true, bitwise:true, eqeqeq:true, undef:true, latedef:true, eqnull:true */
/* global require, module, console */

var express = module.parent.exports.express;

var router = express.Router();
var __ = require("./strings.js");
var Queue = require("./queue.js");
var passport = require("passport");

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
		res.json({
			"status": "booking",
			"content": __("This is the booking content")
		});
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

module.exports = router;