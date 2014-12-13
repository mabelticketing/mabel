
var express = module.parent.exports.express;

var router = express.Router();
var passport = require("passport");
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

router.get('/book', function(req, res) {
	//TODO: new info - queue also displayed on this page.



	// TODO: complete this route.
	// check user did pass through queue
	// get user information
	// check what tickets are available to user
	// get ticket information, prices etc
	// send to page
	var user_at_front_of_queue = true; //TODO: check queue position etc etc
	if (user_at_front_of_queue) {
		// do stuff here

		// GET /api/user - basically just for user.name i think

		// GET /api/ticketinfo (Large object (searching multiple tables) - hope its okay)

		// create data object & res.render, sending data with it

res.render('book.jade');

	} // if queue position not okay redirect to /queue

	


	
	// will need to allow users to select tickets available to them, and then hit "book",
	// and then be redirected to a confirmation page, hopefully displaying tickets they
	// booked, along with a "what happens next" paragraph e.g. will receive a confirmation email.
});

router.get('/confirmation', function(req, res) {
	// TODO: complete this route
	res.render('confirmation.jade');
});

module.exports = router;
