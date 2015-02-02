var express = require("express");
var apiRouter = require("../routes.js");
var api = require("../api.js");
var Q = require("q");
var router = express.Router({
	mergeParams: true
});
module.exports = router;

router.route("/:event_id")
	.post(
		function(req, res, next) {
			// check that booking is open
			api.booking.canBook(req.user.id, req.params.event_id, function(err, result) {
				if (err) return next(err);
				if (!result.open) return next("Booking not open for this user");
				next();
			});
		},
		function(req, res) {

			var ticketsRequested = [];
			var count = 0;

			var paymentMethodIDs = []; // requested
			var ticketTypeIDs    = []; // requested
			
			var availableTicketTypes    = []; // available
			var availablePaymentMethods = []; // available

			// subset helper function
			function subset(requested, available) {
				for (var i=0; i<requested.length; i++) {
					if (available.indexOf(requested[i]) === -1) return false;
				}
				return true;
			}

			for (var i=0; i<req.body.tickets.length; i++) {

				var num = parseInt(req.body.tickets[i].payment_methods.length);
				
				for (var j=0; j<num; j++) {
					var ticket_type_id = req.body.tickets[i].ticket_type_id;
					// todo: change to object keys rather than using indexOf
					if (ticketTypeIDs.indexOf(ticket_type_id) === -1) {
						// only add ticket_type_id if not in the array already
						ticketTypeIDs.push(ticket_type_id);
					}
					var payment_method_id = parseInt(req.body.tickets[i].payment_methods[j]);
					if (paymentMethodIDs.indexOf(payment_method_id) === -1) {
						// only add payment_method_id if not in the array already
						paymentMethodIDs.push(payment_method_id);
					}
					// add to count
					count++;
					// add to ticketsRequested
					ticketsRequested.push({
						ticket_type_id: ticket_type_id,
						payment_method: payment_method_id
					});
				}
			}

			// check user has requested >0 tickets
			if (count === 0) {
				res.json({
					error: "You have not selected any tickets!",
					success: false
				});
			}

			// check that every ticket has been allocated a payment method
			for (i=0; i<ticketsRequested.length; i++) {
				var method = ticketsRequested[i].payment_method;
				if (method === undefined || method <= 0) // (undefined == null)
					res.json({
						error: "You have a missing payment method for one of your tickets",
						success: false
					});
			}

			var ticketsAllocByID = ticketsRejecByID = {};

			// get ticket types available to user
			api.ticket_type.getForUser(req.user, req.params.event_id)
				.then(function(result) {
					for (var i=0; i<result.length; i++) {
						var ticket_type_id = result[i].id;
						if (availableTicketTypes.indexOf(ticket_type_id) === -1)
							availableTicketTypes.push(ticket_type_id);
					}
					// check ticket types are all available to user
					if (!subset(ticketTypeIDs, availableTicketTypes)) {
						throw "You have requested ticket types not available to your account.";
					}
					// get available payment methods to the user
					return api.payment_method.getAll(req.user.id);
				})
				.then(function(result) {
					for (i=0; i<result.length; i++) {
						var method_id = result[i].id;
						if (availablePaymentMethods.indexOf(method_id) === -1)
							availablePaymentMethods.push(method_id);
					}
					// check payment methods are available to user
					if (!subset(paymentMethodIDs, availablePaymentMethods)) {
						throw "You have requested payment methods not available to your account.";
					}
					// find ticket allowance
					return api.user.getAllowance(req.user.id);
				})
				.then(function(result) {
					var allowance = result[0].allowance;
					// check ticket allowance
					if (allowance < count) {
						throw "You are not allowed to buy that many tickets.";
					}
				})
				.then(function() {
					// Check that "College Bill" hasn't been used more than once
					// (at this point if they are using college bill we KNOW they are from Emma)
					var c = 0;
					var COLLEGE_BILL_METHOD_ID = 1;
					for (var i=0; i<ticketsRequested.length; i++) {
						if (ticketsRequested[i].payment_method === COLLEGE_BILL_METHOD_ID) {
							c += 1;
						}
					}
					if (c > 1) {
						// "College Bill" was used more than once
						throw "You are not allowed to put more than one ticket on your college bill.";
					}

					return Q.all([
						api.booking.makeBooking(req.user.id, ticketsRequested, req.body.donate),
						api.ticket_type.getAll({},1)
					]);
				}).then(function(data) {
					var tickets = data[0];
					var types 	= data[1];
					// create map ids -> names
					var typeNames = {};
					for (var i=0; i<types.length; i++) {
						typeNames[types[i]["id"]] = types[i]["name"];
					}

					// add ticket type names to response
					for (var i=0; i<tickets.ticketsAllocated.length; i++) {
						var name = typeNames[tickets.ticketsAllocated[i].request.ticket_type_id];
						tickets.ticketsAllocated[i].request.ticket_type_name = name;
					}
					for (var i=0; i<tickets.ticketsRejected.length; i++) {
						var name = typeNames[tickets.ticketsRejected[i].request.ticket_type_id];
						tickets.ticketsRejected[i].request.ticket_type_name = name;
					}

					// should use a filter in angular but doing this instead - sorry
					var ticketsExclDonations = {
						ticketsAllocated: [],
						ticketsRejected: []
					};

					for (var i=0; i<tickets.ticketsAllocated.length; i++) {
						if (tickets.ticketsAllocated[i].request.ticket_type_id != 5) {
							ticketsExclDonations.ticketsAllocated.push(tickets.ticketsAllocated[i]);
						}
					}
					for (var i=0; i<tickets.ticketsRejected.length; i++) {
						if (tickets.ticketsRejected[i].request.ticket_type_id != 5) {
							ticketsExclDonations.ticketsRejected.push(tickets.ticketsRejected[i]);
						}
					}
					
					// assemble result
					// TODO: put lots of useful information in here, externalise it
					var result = {
						success: true,
						// total: ,
						tickets: ticketsExclDonations
					};

					// send result back
					// TODO: obtain client email address and spam them
					res.json(result);
				})
				.fail(function(err) {
					res.json({
						success: false,
						error: err
					});
				});
		}
	);

// determine whether the current user is able to book or not
router.route("/open/:event_id")
	.get(
		function(req, res) {
			//console.log("Received");
			api.booking.canBook(req.user.id, req.params.event_id, apiRouter.marshallResult(res));
		}
	);