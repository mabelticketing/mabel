var express = module.parent.exports.express;

var router = express.Router();
var passport = require("passport");
var api = require("./api.js");

router.get("/", function(req, res) {
	res.render("index.jade");
});

router.get('/login/mabel',
	passport.authenticate('local'),
	function(req, res) {
		// If this function gets called, authentication was successful.
		// `req.user` contains the authenticated user.
		res.json({
			"user": req.user
		});
	}
);

router.get('/login/raven',
	passport.authenticate('raven'),
	function(req, res) {
		// If this function gets called, authentication was successful.
		// `req.user` contains the authenticated user.
		res.json({
			"user": req.user
		});
	}
);

router.get('/admin', function(req, res) {
	res.render("admin.jade");
});

router.get('/buy', function(req, res) {
	res.render("buy.jade");
});
module.exports = router;