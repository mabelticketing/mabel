var express = module.parent.exports.express;

var router = express.Router();
var passport = require("passport");
var api = require("./api.js");
var http = require('http');
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

router.get('/book', function(req, res) {
	res.render("book.jade");
});

router.get('/confirmation', function(req, res) {
	res.render('confirmation.jade');
});

module.exports = router;
