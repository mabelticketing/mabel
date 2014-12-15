var express = module.parent.exports.express;

var router = express.Router();
var __ = require("./strings.js");
var Queue = require("./queue.js");
var passport = require("passport");
var api = require("./api.js");
var mysql = require('mysql');
var config = require('./config.js');
var bodyParser = require('body-parser');


/* RESPONSIBILITY OF THIS FILE IS AUTHENTICATION AND MARSHALLING FOR HTTP */


router
	.use(
		passport.authenticate('bearer', {
			session: false
		})
)
	.use(
		bodyParser.json()
);

function checkGroup(req, res, groupId) {
	if (req.user.groups.indexOf(groupId) < 0) {
		res
			.status(401)
			.send("You do not have permission to access this resource");
		return false;
	}
	return true;
}

function checkAdmin(req, res) {
	return checkGroup(req, res, 1);
}

function marshallResult(res) {
	return function(err, result) {
		if (err) return res.status(500).send(err);
		res.json(result);
	};
}
/* event */

router.get("/event/:id", function(req, res) {
	api.event.get(req.params.id, marshallResult(res));
});

router.post("/event/:id", function(req, res) {
	if (!checkAdmin(req, res)) return;
	api.event.update(req.params.id, req.body, marshallResult(res));
});

/* user */

router.get("/user/:id", function(req, res) {
	api.user.get(req.params.id, marshallResult(res));
});

router.get("/user", function(req, res) {
	if (!checkAdmin(req, res)) return;
	api.user.getAll(marshallResult(res));
});

/* payment_method */

router.get("/payment_method/:id", function(req, res) {
	api.payment_method.get(req.params.id, marshallResult(res));
});

router.get("/payment_method", function(req, res) {
	api.payment_method.getAll(marshallResult(res));
});

/* ticket_type */

router.get("/ticket_type", function(req, res) {
	api.ticket_type.getAll(req.user, req.query.event_id, marshallResult(res));
});


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

module.exports = router;