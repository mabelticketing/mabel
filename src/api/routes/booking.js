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
		function(req, res, next) {
			// posted booking is in req.body
			var ticketsRequested = [];
			var ticketTypeIDs    = [];

			for (var i=0; i<req.body.tickets.length; i++) {
				var num = parseInt(req.body.tickets[i].payment_methods.length);
				for (var j=0; j<num; j++) {
					var ticket_type_id = req.body.tickets[i].ticket_type_id;
					if (ticketTypeIDs.indexOf(ticket_type_id) == -1) {
						// only add ticket_type_id if not in the array already
						ticketTypeIDs.push(ticket_type_id);
					}
					ticketsRequested.push({
						ticket_type_id: req.body.tickets[i].ticket_type_id,
						payment_method: parseInt(req.body.tickets[i].payment_methods[j])
					});
				}
			}

			/*** VALIDATION ***/

			// Check that the user has access to each of these ticket types
			// TODO: implement this
			api.booking_validate.hasAccess(req.user.id, req.params.event_id, ticketTypeIDs, function(err, result) {
				if (err) return next(err);
				if (!result.success) {
					// TODO: return more useful information
					return next("You haven't got access to all of the tickets you requested.");
					// TODO: Where is next() going?!?!
				}
				// does have access
				// -> allow to continue
			}


			// Check that the user is allowed to buy this many tickets
			// - put into array: {ticket_type_id: quantity} both integers! allowed.
			// - api.booking_validate.canBuyX() for each ticket_type requested

			// Check that the user is allowed to use the selected payment methods
			// go through payment methods. College Bill only for emmanuel college users

			// Check that "College Bill" hasn't been used more than once

			api.booking.makeBooking(req.user.id, ticketsRequested, req.body.donate)
				.then(function(result) {
					console.log(result);
					res.mabel = {};
					res.mabel.tickets = result;
					return api.transaction.getByBookings(result.ticketsAllocated);
				})
				.then(function(result) {
					res.mabel.transactions = result;
					return api.transaction.insert(result);
				})
				.then(function() {
					next();
				})
				.fail(function(err) {
					console.log("Something went sad", err);
					res.json({error:err, success:false});
				});
			
			// bookingPromise.then(function(result) {
			// 	req.ticketsAllocated = result.ticketsAllocated;
			// 	console.log(req.ticketsAllocated);
			// 	// make transaction!
			// 	return api.booking.makeTransaction(req.user.id, req.params.event_id, req.body, result.ticketsAllocated);
			// })
			// .then(function(transactionInsertResults) {
			// 	// inserting transaction went well - we're done here
			// 	next();
			// }, function(err) {
			// 	if (err) return next(err);
			// });
		},
		function(req, res) {
			// leave the queue
			var result = api.booking.leaveQueue(req.user.id, req.params.event_id);
			result.success = true;
			result.tickets = res.mabel.tickets;
			result.transactions = res.mabel.transactions;
			res.json(result);
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