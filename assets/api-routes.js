/*jshint unused:true, bitwise:true, eqeqeq:true, undef:true, latedef:true, eqnull:true */
/* global require, module, console */

var express = module.parent.exports.express;

var router = express.Router();
var __ = require("./strings.js");
var passport = require("passport");

router.get("/", function(req, res) {
	res.json({
		"Welcome": __("Welcome to the api, Strider!")
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



module.exports = router;