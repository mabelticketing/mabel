// imports
var express  = module.parent.exports.express;
var passport = require("passport");
var bodyParser = require('body-parser');
var connection = require('./api/impl/connection.js');
var emailer = require("./emailer");
var config = require("./config");

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



			var errorHandler = function(error) {
				res.render("register.jade",{email:newUser.email, name:newUser.name, error:error});
			};

			// TODO: More intelligent validation?
			if (newUser.password.length < 5)
				return errorHandler("Password must be at least 5 characters long");
			if (newUser.name.length < 1)
				return errorHandler("Please enter a name");
			if (newUser.email.length < 1)
				return errorHandler("Please enter a valid email address");

			// generate verification code
			var code = genCode(32);
			

			connection.runSql("SELECT * FROM user WHERE email=?",[newUser.email])
				.then(function(users) {
					if (users.length > 0) {
						// user already exists
						throw newUser.email + ' has already been registered.';
					}

					return connection.runSql("INSERT INTO user SET name=?, email=?, password_md5=md5(?), registration_time=UNIX_TIMESTAMP(), verification_code=?",
						[newUser.name, newUser.email, newUser.password, code]);
				})
				.then(function() {
					return emailer.send("'" + newUser.name + "' <" + newUser.email + ">", "'Mabel Ticketing' <registration@mg.clittle.com>", "Mabel Registration Confirmation", 
						"test.jade", {name: newUser.name, link: config.base_url + "/confirm?code=" + code});
				})
				.then(function() {
					res.render("registered.jade",{name: newUser.name, email: newUser.email});
				}, errorHandler);
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


function genCode(len)
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < len; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}