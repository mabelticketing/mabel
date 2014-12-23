var express = require("express");
var passport = require("passport");
var bodyParser = require('body-parser');

var api = require("./api.js");
var __ = require("../strings.js");
var Queue = require("../queue.js");

var router = express.Router();


/* RESPONSIBILITY OF THIS FILE IS AUTHENTICATION AND MARSHALLING FOR HTTP */

module.exports                = router;

// TODO: I don't know if these functions should really be in here
module.exports.checkGroup     = checkGroup;
module.exports.checkAdmin     = checkAdmin;
module.exports.marshallResult = marshallResult;

// all API routes should be authenticated with an access_token
router
	.use(
		passport.authenticate('bearer', {
			session: false
		})
	)
	.use(
		bodyParser.json()
	);

router.use("/event",
	require("./routes/event.js"));

router.use("/user",
	require("./routes/user.js"));

router.use("/ticket_type",
	require("./routes/ticket_type.js"));

router.use("/payment_method",
	require("./routes/payment_method.js"));

// TODO: Increase number of people allowed through at a time from 1
var bookQueue = new Queue(1);

router.get("/book",
	function(req, res) {
		var result = bookQueue.joinQueue(req.user.id);
		if (result.queueing) {
			res.json({
				"status": "queueing",
				"data": {
					position: result.position,
					of: result.of
				}
			});
		} else {
			if (typeof req.query.event_id === "undefined") {
				return res.json({
					"error": "event_id not provided"
				});
			}
			// TODO: These can be obtained in individual requests, do we want that duped?
			api.ticket_type.getAll(req.user, req.query.event_id, function(err1, availableTickets) {
				if (err1) return res.status(500).send(err1);
				api.user.get(req.user.id, function(err2, user) {
					if (err2) return res.status(500).send(err2);
					api.payment_method.getAll(function(err3, payment_methods) {
						if (err3) return res.status(500).send(err3);
						res.json({
							"status": "booking",
							"data": {
								user: user,
								availableTickets: availableTickets,
								payment_methods: payment_methods
							}
						});
					});
				});
			});
		}
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

function checkGroup(groupId) {
	return function(req, res, next) {
		if (req.user.groups.indexOf(groupId) < 0) {
			next("You do not have permission to access this resource");
		}
		next();
	};
}

function checkAdmin() {
	return checkGroup(1);
}

function marshallResult(res) {
	return function(err, result) {
		if (err) return res.status(500).send(err);
		res.json(result);
	};
}
