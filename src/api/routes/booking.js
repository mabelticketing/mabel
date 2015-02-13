var express = require("express");
var apiRouter = require("../routes.js");
var api = require("../api.js");
var moment = require("moment");
var emailer = require("../../emailer.js");
var unidecode = require('unidecode');
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

			// get ticket types available to user
			var verificationPromise = api.ticket_type.getForUser(req.user, req.params.event_id)
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
					return api.payment_method.getByUser(req.user.id);
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
				});

			var bookingPromise = verificationPromise.then(function() {
					return api.booking.makeBooking(req.user.id, ticketsRequested, req.body.donate);
				});

			// TODO: payment method data, user data
			var confirmationPromise = 
				Q.all([
					bookingPromise,
					api.user.get(req.user.id),
					api.ticket_type.getAll({},1),
					api.payment_method.getAll()
				]).then(function(data) {
					var tickets = data[0];
					var user = data[1];
					var i, type, payment_method, totalPrice = 0, donationPrice = 0;

					// create map ids -> types
					var types = {};
					for (i=0; i< data[2].length; i++) {
						types[ data[2][i].id ] = data[2][i];
					}

					var payment_methods = {};
					for (i=0; i< data[3].length; i++) {
						payment_methods[ data[3][i].id ] = data[3][i];
					}

					// add data to response
					for (i=0; i<tickets.ticketsAllocated.length; i++) {
						type = types[tickets.ticketsAllocated[i].request.ticket_type_id];
						payment_method = payment_methods[tickets.ticketsAllocated[i].request.payment_method];
						
						tickets.ticketsAllocated[i].request.ticket_type = type;
						tickets.ticketsAllocated[i].request.payment_method = payment_method;
					}
					for (i=0; i<tickets.ticketsRejected.length; i++) {
						type = types[tickets.ticketsRejected[i].request.ticket_type_id];
						payment_method = payment_methods[tickets.ticketsRejected[i].request.payment_method];
						
						tickets.ticketsRejected[i].request.ticket_type = type;
						tickets.ticketsRejected[i].request.payment_method = payment_method;
					}

					// should use a filter in angular but doing this instead - sorry
					var ticketsExclDonations = {
						ticketsAllocated: [],
						ticketsRejected: []
					};

					for (i=0; i<tickets.ticketsAllocated.length; i++) {
						// TODO: parameterise donation_ticket_type_id
						type = tickets.ticketsAllocated[i].request.ticket_type;
						if (type.id !== 5) {
							ticketsExclDonations.ticketsAllocated.push(tickets.ticketsAllocated[i]);
						} else {
							donationPrice += type.price;
						}
						totalPrice += type.price;
					}
					for (i=0; i<tickets.ticketsRejected.length; i++) {
						if (tickets.ticketsRejected[i].request.ticket_type.id !== 5) {
							ticketsExclDonations.ticketsRejected.push(tickets.ticketsRejected[i]);
						}
					}
					
					// assemble result
					// TODO: put lots of useful information in here, externalise it
					var result = {
						success: true,
						totalPrice: totalPrice,
						donationPrice: donationPrice,
						tickets: ticketsExclDonations,
						payment_deadline: moment().add(14,'d').format("dddd, MMMM Do YYYY"),
						user: user,
						sampleID: tickets.ticketsAllocated.length>0?tickets.ticketsAllocated[0].rowId:123
					};
					return result;
				});

			confirmationPromise.then(function(result) {
					
					res.json(result);
					console.log(result.user.name + " booked some tickets - " + result.tickets.ticketsAllocated.length + " booked, " + result.tickets.ticketsRejected.length + " waiting list (£" + result.totalPrice + ")");
					return emailer.send("'" + unidecode(result.user.name) + "' <" + result.user.email + ">", "Emmanuel College May Ball 2015 Booking Confirmation",
						"bookConf.jade", result);

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