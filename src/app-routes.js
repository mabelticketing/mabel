// imports
var express  = module.parent.exports.express;
var passport = require("passport");

/*** APP ROUTER ***/
var router   = express.Router();

var api = require("./api.js");
var http = require('http');

router.get("/", function(req, res) {
	res.render("index.jade");
});

router.get("/apitest", function(req, res) {
	res.render("apitest.jade");
});

router.get('/login/mabel',
	passport.authenticate('local'),
	function(req, res) {
		res.render("loginConfirmation.jade", {token:req.user.token});
	}
);

router.get('/login/raven',
	passport.authenticate('raven'),
	function(req, res) {
		res.render("loginConfirmation.jade", {token:req.user.token});
	}
);

router.get('/admin', function(req, res) {
	res.render("admin.jade");
});

router.get('/book', function(req, res) {
	res.render("book.jade");
});

router.get('/confirmation',
	function(req, res) {
		// display confirmation page
		res.render('confirmation.jade');
	});

module.exports = router;
