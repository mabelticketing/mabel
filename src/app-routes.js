var express = module.parent.exports.express;

var router   = express.Router();
var passport = require("passport");

router.get("/", function(req, res) {
	res.render("index.jade");
});

router.get("/apitest", function(req, res) {
	res.render("apitest.jade");
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

router.get('/book', function(req, res) {
	// load page that either displays queue or booking form.
	res.render("book.jade");
});

router.get('/confirmation', function(req, res) {
	// display confirmation page
	res.render('confirmation.jade');
});

router.get('/buy', function(req, res) {
	// TODO: remove this? not entirely sure what it is for
	res.render("buy.jade");
});

module.exports = router;
