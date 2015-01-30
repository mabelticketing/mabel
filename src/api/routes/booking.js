var express = require("express");
var apiRouter = require("../routes.js");
var api = require("../api.js");
var router = express.Router({
	mergeParams: true
});
module.exports = router;

router.route("/:event_id")
	.post(
		function(req, res, next) {
			// check we can book (that we're at the front of the queue an' all)
			console.log(req.body);
			api.booking.canBook(req.user.id, req.params.event_id, function(err, result) {
				if (err) return next(err);
				if (!result.open) return next("Booking not open for this user");
				next();
			});

		},
		function(req, res) {
			// posted booking is in req.body
			var ticketsRequested = [];

			for (var i=0; i<req.body.tickets.length; i++) {
				var num = parseInt(req.body.tickets[i].payment_methods.length);
				for (var j=0; j<num; j++) {
					ticketsRequested.push({
						ticket_type_id: req.body.tickets[i].ticket_type_id,
						payment_method: parseInt(req.body.tickets[i].payment_methods[j])
					});
				}
			}

			// TODO: ticket validation:
			// Check that the user has access to each of these ticket types (and that these ticket types exist)
			// Check that the user is allowed to buy this many tickets
			// Check that the user is allowed to use the selected payment methods
			// Check that "College Bill" hasn't been used more than once

			api.booking.makeBooking(req.user.id, ticketsRequested, req.body.donate)
				.then(function(result) {
					console.log(result);
					res.mabel = {};
					res.mabel.tickets = result;
				})
				.then(function() {
					// ticket insert worked
					// leave the queue
					var result = api.booking.leaveQueue(req.user.id, req.params.event_id);
					result.success = true;
					result.tickets = res.mabel.tickets;
					res.json(result);
				})
				.fail(function(err) {
					console.log("Something went wrong", err);
					// TODO: the client should do something with this error
					res.json({error:err, success:false});
				});
		}
	);

// determine whether the current user is able to book or not
router.route("/open/:event_id")
	.get(
		function(req, res) {
			console.log("Received");
			api.booking.canBook(req.user.id, req.params.event_id, apiRouter.marshallResult(res));
		}
	);

// determine whether the current user is able to book or not
router.route("/queue/:event_id")
	// TODO: Do something with event_id
	.post( // join the queue
		function(req, res) {
			res.json(api.booking.joinQueue(req.user.id, req.params.event_id));
		}
	)
	.get( // get queue status
		function(req, res) {
			res.json(api.booking.getStatus(req.user.id, req.params.event_id));
		}
	)
	.delete( // leave the queue
		function(req, res) {
			res.json(api.booking.leaveQueue(req.user.id, req.params.event_id));
		}
	);