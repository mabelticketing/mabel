// imports
var express  = module.parent.exports.express;
var passport = require("passport");

/*** APP ROUTER ***/
var router   = express.Router();

router.get("/", function(req, res) {
	res.render("index.jade");
});

router.get(/^\/views\/(.*)$/,
	function(req, res) {
		res.render(req.params[0] + ".jade");
	}
);

router.get("/apitest", function(req, res) {
	res.render("apitest.jade");
});

router.get('/login/mabel',
	passport.authenticate('local'),
	function(req, res) {
		console.log(req.user.token); // helper for now, if needed TODO: remove
		res.redirect("/dash");
	}
);

router.get('/login/raven',
	passport.authenticate('raven'),
	function(req, res) {
		console.log(req.user.token); // helper for now, if needed TODO: remove
		res.redirect("/dash");
	}
);

router.get('/dash',
	function(req, res) {
		res.render("dash.jade");
	}
);

router.get('/logout',
	function(req, res) {
		res.render("logout.jade");
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
