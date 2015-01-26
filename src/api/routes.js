var express = require("express");
var passport = require("passport");
var bodyParser = require('body-parser');

var router = express.Router();

/* RESPONSIBILITY OF THE ROUTES FILES IS AUTHENTICATION AND MARSHALLING FOR HTTP */

module.exports                 = router;

// TODO: I don't know if these functions should really be in here or in some helper module
module.exports.checkGroup      = checkGroup;
module.exports.checkAdmin      = checkAdmin;
module.exports.marshallResult  = marshallResult;
module.exports.marshallPromise = marshallPromise;
module.exports.stripMeta       = stripMeta;

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

router.use("/user/group",
	require("./routes/group.js"));

router.use("/user",
	require("./routes/user.js"));

router.use("/ticket_type",
	require("./routes/ticket_type.js"));

router.use("/payment_method",
	require("./routes/payment_method.js"));

router.use("/booking",
	require("./routes/booking.js"));

router.use("/ticket",
	require("./routes/ticket.js"));

router.use("/transaction",
	require("./routes/transaction.js"));

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

function marshallPromise(res, promise) {
	promise.then(function(value) {
		if (value === undefined) value = {};
		res.json(value);
	}, function(err) {
		console.log(err);
		res.status(500).send(err);
	});
}


function stripMeta(obj) {
	// delete any properties which start with $ or _
	for (var i in obj) {
		if (i.indexOf("_") === 0 || i.indexOf("$") === 0) {
			delete obj[i];
		}
	}
	return obj;
}