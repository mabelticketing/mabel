// imports
var express  = module.parent.exports.express;
var passport = require("passport");
var bodyParser = require('body-parser');

/*** APP ROUTER ***/
var router   = express.Router();


router.get('/login/mabel',
	passport.authenticate('local'),
	function(req, res) {
		console.log(req.user.token); // helper for now, if needed TODO: remove
		// store cookie - loginConfirmation will then redirect to /dash
		res.render("loginConfirmation.jade", {token: req.user.token});
	}
);

router.get('/login/raven',
	passport.authenticate('raven'),
	function(req, res) {
		console.log(req.user.token); // helper for now, if needed TODO: remove
		// store cookie - loginConfirmation will then redirect to /dash
		res.render("loginConfirmation.jade", {token: req.user.token});
	}
);

router.get('/logout',
	function(req, res) {
		res.render("logout.jade");
	}
);

router.route("/register")
	.post(
		bodyParser.urlencoded({ extended: false }), 
		function(req, res) {
			var newUser = req.body;
			var error = 'Not implemented yet';
			if (error !== undefined)
				res.render("register.jade", {email:newUser.email, name:newUser.name, error:'Not implemented yet'});
			else {
				// TODO: register + log in + redirect to dash
			}
		}
	).get(function(req, res) {
		res.render("register.jade");
	});

// TODO: everything below this point should be precompiled HTML

router.get('/dash',
	function(req, res) {
		res.render("dash.jade");
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

router.get("/", function(req, res) {
	res.render("index.jade");
});

router.get(/^\/views\/(.*)$/,
	function(req, res) {
		res.render(req.params[0] + ".jade");
	}
);
module.exports = router;
