/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

// Responsibility of the router is for authentication and
// marshalling for HTTP.

// imports
var express    = require('express');
var passport   = require('passport');
var bodyParser = require('body-parser');
var api        = require('./api.js');
var Q          = require("q");
var moment     = require("moment");
var emailer    = require("../emailer.js");
var unidecode  = require('unidecode');
/*jshint -W079 */
var $          = require('./helpers.js'); // TODO: perhaps confusing if we are using underscore/lodash
var auth       = require('./auth.js');

var router = express.Router();

module.exports = router;


 /****************************
 * Auth                      *
 ****************************/

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


/****************************
* Booking                   *
****************************/
 
router.route('/booking')
	.post(
		// TODO: this looks like api stuff. need to just do auth and error handling really
		function(req, res, next) {
			// check that booking is open
			api.booking.canBook(req.user.id, function(err, result) {
				if (err) return next(err);
				if (!result.open) return next('Booking not open for this user');
				next();
			});
		}, function(req, res) {

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


/****************************
* Groups                    *
****************************/
 
router.route('/groups')
	.get(
		function(req, res) {

			var opts = {};
			if (req.query.from !== undefined) opts.from = parseInt(req.query.from);
			if (req.query.size !== undefined) opts.size = parseInt(req.query.size);
			if (req.query.order !== undefined) opts.order = JSON.parse(req.query.order);
			if (req.query.filter !== undefined) opts.filter = JSON.parse(req.query.filter);
		
			$.marshallPromise(res, api.groups.get(opts));
		}
	);
 
router.route('/group')
	.post(
		auth.admin(),
		function(req, res) {
			$.marshallPromise(res, api.group.post($.stripMeta(req.body)) );
		}
	);

router.route('/group/:id')
	.get(
		function(req, res) {
			$.marshallPromise(res, api.group.id(req.params.id).get() );
		}
	)
	.put(
		auth.admin(),
		function(req, res) {
			$.marshallPromise(res, api.group.id(req.params.id).put($.stripMeta(req.body)) );
		}
	)
	.delete(
		auth.admin(),
		function(req, res) {
			$.marshallPromise(res, api.group.id(req.params.id).del() );
		}
	);


/****************************
* Payment Method            *
****************************/
 
router.route("/payment_method/:id")
	.get(
		// get all payment method (admin)
		auth.admin(),
		function(req, res) {
			$.marshallPromise(res, api.payment_method.id(req.params.id).get());
		}
	);

// TODO@Chris: do this schema stuff

router.route("/schema/data")
	.get(
		apiRouter.checkAdmin(),
		function(req, res) {
			console.log(req.query);
			var opts = {}
			if (req.query.tables === undefined) throw Error("Table must be defined")
			opts.tables = JSON.parse(req.query.tables);
			
			sopts = {
				tables: opts.tables,
				columns: "COUNT(*) AS c"
			}
			if (req.query.from !== undefined) opts.from = parseInt(req.query.from);
			if (req.query.size !== undefined) opts.size = parseInt(req.query.size);
			if (req.query.columns !== undefined) opts.columns = JSON.parse(req.query.columns);
			if (req.query.joins !== undefined) opts.joins = sopts.joins = JSON.parse(req.query.joins);
			if (req.query.filters !== undefined) opts.filter = sopts.filter = JSON.parse(req.query.filters);

			apiRouter.marshallPromise(res, Q.all([api.schema.getData(opts, true), api.schema.getData(sopts)])
				.then(function(results) {
					return {
						data: results[0],
						size: results[1][0].c
					};
				}));
		}
	);
router.route("/schema/:tname")
	.get(
		apiRouter.checkAdmin(),
		function(req, res) {
			apiRouter.marshallPromise(res, api.schema.getSchema(req.params.tname));
		}
	);

router.route("/schema/:tname/size")
	.get(
		apiRouter.checkAdmin(),
		function(req, res) {
			apiRouter.marshallPromise(res, api.schema.getSize(req.params.tname));
		}
	);

router.route("/schema/:tname/data")
	.get(
		apiRouter.checkAdmin(),
		function(req, res) {
			var opts = {};
			if (req.query.from !== undefined) opts.from = parseInt(req.query.from);
			if (req.query.size !== undefined) opts.size = parseInt(req.query.size);
			apiRouter.marshallPromise(res, api.schema.getDataFromTable(req.params.tname, opts));
		}
	);

router.route("/schema")
	.get(
		apiRouter.checkAdmin(),
		function(req, res) {
			apiRouter.marshallPromise(res, api.schema.getNames());
		}
	);

router.route("/user/:id/tickets")
	.get(
		function(req, res, next) {
			if (auth.admin(req.user)) {
				next();
			} else if (req.params.id === req.user.id) {
				$.marshallPromise(res, api.user.tickets(req.user.id));
			} else {
				// error
				// TODO: do something
			}
		},
		function(req, res) {
			// this only gets called for admins
			var opts = {};
			if (req.query.from !== undefined) opts.from = parseInt(req.query.from);
			if (req.query.size !== undefined) opts.size = parseInt(req.query.size);
			if (req.query.order !== undefined) opts.order = JSON.parse(req.query.order);
			if (req.query.filter !== undefined) opts.filter = JSON.parse(req.query.filter);

			$.marshallPromise(res, api.tickets(opts));
		}
	)
	.post(
		auth.admin(),
		function(req, res) {
			$.marshallPromise(res, api.ticket.insert($.stripMeta(req.body)));
		}
	);

router.route("/tickets")
	.get(
		function(req, res) {
			$.marshallPromise(res, api.tickets.admitted());
		}
	);

router.route("/admit/:id")
	.post(
		function(req, res) {
			console.log("Admitted ticket #" + req.params.id + " @ " + (new Date()).toString());
			$.marshallPromise(res, api.ticket.admit(req.params.id));
		}
	);

function generateConfirmationsForWaitingList(ticketPromise) {
	var mapify = function(results) {
		var map = {};
		for (var i = 0; i < results.length; i++) {
			map[results[i].id] = results[i];
		}
		return map;
	};

	var userPromise = ticketPromise.then(function(tickets) {
		// get the user details for each of these tickets
		var usersToGet = {};
		for (var i = 0; i < tickets.length; i++) {
			usersToGet[tickets[i].request.user_id] = true;
		}
		var userPromises = [];
		for (var user_id in usersToGet) {
			userPromises.push(api.user.get(user_id));
		}
		return Q.all(userPromises)
			.then(mapify);
	});
	var ticketTypePromise = api.ticket_type.getAll({}, 1)
		.then(mapify);

	var paymentMethodPromise = api.payment_method.getAll(1)
		.then(mapify);

	var confirmationPromise =
		Q.all([
			ticketPromise,
			userPromise,
			ticketTypePromise,
			paymentMethodPromise
		]).then(function(data) {
			var tickets = data[0];
			var users = data[1];
			var types = data[2];
			var payment_methods = data[3];

			// add data to response
			for (var i = 0; i < tickets.length; i++) {
				var type = types[tickets[i].request.ticket_type_id];
				tickets[i].request.ticket_type = type;
				tickets[i].request.payment_method = payment_methods[tickets[i].request.payment_method_id];
				tickets[i].request.user = users[tickets[i].request.user_id];
				tickets[i].request.id = tickets[i].rowId;
				tickets[i] = tickets[i].request;
			}

			// assemble result
			// TODO: put lots of useful information in here, externalise it
			var result = {
				success: true,
				tickets: tickets,
				payment_deadline: moment().add(14, 'd').format("dddd, MMMM Do YYYY")
			};
			return result;
		});

	confirmationPromise
		.then(function(result) {
			// first group by user
			var userMap = {};
			for (var i = 0; i < result.tickets.length; i++) {
				if (userMap[result.tickets[i].user_id] === undefined) {
					userMap[result.tickets[i].user_id] = [];
				}
				userMap[result.tickets[i].user_id].push(result.tickets[i]);
			}
			result.tickets = userMap;
			return result;
		})
		// now send emails
		.then(function(result) {
			for (var user_id in result.tickets) {
				// filter out donation tickets and calculate total price
				var donationPrice = 0,
					totalPrice = 0,
					ticketsAllocated = [];
				for (var i = 0; i < result.tickets[user_id].length; i++) {
					if (result.tickets[user_id][i].ticket_type.id === 5) {
						donationPrice += result.tickets[user_id][i].ticket_type.price;
					} else {
						ticketsAllocated.push(result.tickets[user_id][i]);
					}
					totalPrice += result.tickets[user_id][i].ticket_type.price;
				}
				var user = result.tickets[user_id][0].user;

				emailer.send("'" + unidecode(user.name) + "' <" + user.email + ">", "Waiting List Transfer",
					"transferConf.jade", {
						payment_deadline: result.payment_deadline,
						donationPrice: donationPrice,
						totalPrice: totalPrice,
						ticketsAllocated: ticketsAllocated,
						sampleID: result.tickets[user_id][0].id,
					});
			}
			return result;
		});
	return confirmationPromise;
}

router.route("/tickets/process_waiting_list/:id")
	.post(
		apiRouter.checkAdmin(),
		function(req, res) {

			var ticketPromise = api.ticket.processWaitingList(req.params.id);
			generateConfirmationsForWaitingList(ticketPromise)
				.then(function(result) {
					// output result to admin panel
					res.json(result);
				}, function(err) {
					res.status(500).send(err);
				});
		}
	);
router.route("/getAllDetailed/")
	.get(
		auth.admin(),
		function(req, res) {
			$.marshallPromise(res, api.ticket.getAllDetailed());
		}
	);

router.route("/process_waiting_list/")
	.post(
		auth.admin(),
		function(req, res) {
			var ticketPromise = api.ticket_type.getAll({}, 1)
				.then(function(ticket_types) {
					var promises = [];
					for (var i=0; i<ticket_types.length; i++) {
						promises.push(api.ticket.processWaitingList(ticket_types[i].id));
					}
					return Q.all(promises);
				})
				.then(function(ticketss) {
					var tickets = [];
					for (var i=0; i<ticketss.length; i++) {
						tickets = tickets.concat(ticketss[i]);
					}
					return tickets;
				});
				
			generateConfirmationsForWaitingList(ticketPromise)
				.then(function(result) {
					// output result to admin panel
					res.json(result);
				}, function(err) {
					res.status(500).send(err);
				});
		}
);

router.route("/summary/")
	.get(
		auth.admin(),
		function(req, res) {
			var opts = {};
			if (req.query.from !== undefined) opts.from = parseInt(req.query.from);
			if (req.query.size !== undefined) opts.size = parseInt(req.query.size);
			if (req.query.order !== undefined) opts.order = JSON.parse(req.query.order);
			if (req.query.filter !== undefined) opts.filter = JSON.parse(req.query.filter);

			$.marshallPromise(res, api.ticket.summary(opts));
		}
);

router.route("/summary/byuser")
	.get(
		auth.admin(),
		function(req, res) {
			var opts = {};
			if (req.query.from !== undefined) opts.from = parseInt(req.query.from);
			if (req.query.size !== undefined) opts.size = parseInt(req.query.size);
			if (req.query.order !== undefined) opts.order = JSON.parse(req.query.order);
			if (req.query.filter !== undefined) opts.filter = JSON.parse(req.query.filter);

			$.marshallPromise(res, api.ticket.summary_byuser(opts));
		}
);

router.route("/multi/:ids")
	.delete(
		function(req, res) {
			var ids = req.params.ids.split(",");
			var authPromises = [];
			var authedIds = [];

			// prepare function outside of loop
			var deleteTicket = function(ticket_id) {
				if (auth.admin(req.user)) {
					// authorised because I am an admin
					authedIds.push(ticket_id);
				} else {
					authPromises.push(api.ticket.get(ticket_id)
						.then(function(ticket) {
							if (ticket.user_id === req.user.id) {
								authedIds.push(ticket_id);
							} else {
								throw "Not authorised to delete " + ticket_id;
							}
						}));
				}
			};

			for (var i = 0; i < ids.length; i++) {
				deleteTicket(ids[i]);
			}

			$.marshallPromise(res, Q.all(authPromises).then(function() {
				var promises = [];
				for (var i = 0; i < authedIds.length; i++) {
					promises.push(api.ticket.del(authedIds[i]));
				}
				return Q.all(promises);
			}));
		}
);

router.route("/multi/")
	.post(
		function(req, res) {
			var tickets = req.body;
			var authPromises = [];
			var authedTickets = [];

			// prepare function outside of loop
			var authTicket = function(ticket) {
				if (auth.admin(req.user)) {
					// authorised because I am an admin
					authedTickets.push(ticket);
				} else {
					authPromises.push(api.ticket.get(ticket.id)
						.then(function(t) {
							if (t.user_id === req.user.id) {
								authedTickets.push(ticket);
							} else {
								throw "Not authorised to access " + ticket.id;
							}
						}));
				}
			};

			for (var i = 0; i < tickets.length; i++) {
				authTicket(tickets[i]);
			}

			$.marshallPromise(res, Q.all(authPromises).then(function() {
				var promises = [];
				for (var i = 0; i < authedTickets.length; i++) {

					var ticket = authedTickets[i];
					var t = {};
					if (ticket.guest_name) t.guest_name = ticket.guest_name;
					if (ticket.id) t.id = ticket.id;
					if (auth.admin(req.user)) {
						if (ticket.user_id) t.user_id = ticket.user_id;
						if (ticket.ticket_type_id) t.ticket_type_id = ticket.ticket_type_id;
						if (ticket.status_id) t.status_id = ticket.status_id;
						if (ticket.payment_method_id) t.payment_method_id = ticket.payment_method_id;
						if (ticket.book_time) t.book_time = ticket.book_time;
					}
					promises.push(api.ticket.update(t));
				}
				return Q.all(promises);
			}));
		}
);


function checkTicketAccess(req, res, next) {
	api.ticket.get(req.params.id)
		.then(function(ticket) {
			if (ticket.user_id === req.user.id) {
				// authorised because I can see my own tickets
				next();
			} else {
				// Requesting someone else's details, so only allowed if I am admin
				return (auth.admin())(req, res, next);
			}
		},
		next);
}

router.route("/:id")
	.get(
		checkTicketAccess,
		function(req, res) {
			$.marshallPromise(res, api.ticket.get(req.params.id));
		}
	)
	.post(
		checkTicketAccess,
		function(req, res) {
			// An admin can change anything - but a user can only change guest name
			// TODO: confirmation email?
			var ticket = $.stripMeta(req.body);
			var t = {};
			if (ticket.guest_name) t.guest_name = ticket.guest_name;
			if (ticket.id) t.id = ticket.id;
			if (auth.admin(req.user)) {
				if (ticket.user_id) t.user_id = ticket.user_id;
				if (ticket.ticket_type_id) t.ticket_type_id = ticket.ticket_type_id;
				if (ticket.status_id) t.status_id = ticket.status_id;
				if (ticket.payment_method_id) t.payment_method_id = ticket.payment_method_id;
				if (ticket.book_time) t.book_time = ticket.book_time;
			}
			$.marshallPromise(res, api.ticket.update(t));
		}
	)
	.delete(
		checkTicketAccess,
		function(req, res) {
			$.marshallPromise(res, api.ticket.del(req.params.id)
				.then(function(result) {
					if (result.affectedRows > 0) {
						// TODO: confirmation email + notification to admins
						return {
							success: true
						};
					} else {
						return {
							success: false
						};
					}
				})
			);
		}
	);

router.route("/getByUser/:id")
	.get(
		function(req, res) {
			$.marshallPromise(res, api.ticket.getByUser(req.params.id));
		}
);


router.route("/types") // AVAILIABLE TYPES
	.get(
		function(req, res) {
			var promise = api.ticket_type.getForUser(req.user, req.params.event_id)
				// TODO: I don't think this is necessarily the tidiest way to tie in allowance
				.then(function(results) {
					return api.user.getAllowance(req.user.id).then(function(r) {
						if (r.length !== 1) throw "Unexpected allowances length";
						for (var i=0; i<results.length; i++) {
							results[i].allowance = r[0].allowance;
						}
						return results;
					});
				});
			$.marshallPromise(res, promise);
		}
	);

router.route("/types") // ALL TYPES - merge with above
	.get(
		auth.admin(),
		function(req, res) {

			var opts = {};
			if (req.query.from !== undefined) opts.from = parseInt(req.query.from);
			if (req.query.size !== undefined) opts.size = parseInt(req.query.size);
			if (req.query.order !== undefined) opts.order = JSON.parse(req.query.order);
			if (req.query.filter !== undefined) opts.filter = JSON.parse(req.query.filter);
		
			$.marshallPromise(res, api.ticket_type.getAll(opts, req.params.event_id));
		}
	)
	.post(
		auth.admin(),
		function(req, res) {
			$.marshallPromise(
				res,
				api.ticket_type.insert(
					$.stripMeta(req.body),
					req.params.event_id
				).then(function(result) {
					return api.ticket_type.get(result.insertId);
				})
			);
		}
	);

router.route("/type/:id")
	.get(
		auth.admin(),
		function(req, res) {
			$.marshallPromise(res, api.ticket_type.get(req.params.ticket_type_id));
		}
	)
	.post(
		auth.admin(),
		function(req, res) {
			$.marshallPromise(res, api.ticket_type.update(req.params.ticket_type_id, $.stripMeta(req.body)));
		}
	)
	.delete(
		auth.admin(),
		function(req, res) {
			$.marshallPromise(
				res,
				api.ticket_type.del(req.params.ticket_type_id).then(function() {
					return {};
				})
			);
		}
	);


/****************************
* Users                     *
****************************/

// user.js

router.route("/user")
	.get(
		function(req, res) {
			$.marshallPromise(res, api.user.id(req.user.id).get());
		}
	)
	.post(
		function(req, res) {
			$.marshallPromise(
				res,
				api.user.post($.stripMeta(req.body))
			);
		}
	);

router.route("/user/:id")
	.get(
		function(req, res, next) {
			if (parseInt(req.params.id) === req.user.id) {
				// Authorised because I can see my own details
				next();
			} else {
				// Requesting someone else's details, so only allowed if admin
				return (auth.admin())(req, res, next);
			} 
		},
		function(req, res) {
			var id = parseInt(req.params.id);
			$.marshallPromise(res, api.user.id(id).get());
		}
	)
	.put(
		function(req, res, next) {
			if (parseInt(req.params.id) === req.user.id) {
				// Authorised because I can update my own details
				next();
			} else {
				// Requesting to update someone else's details, so only allowed if admin
				return (auth.admin())(req, res, next);
			} 
		},
		function(req, res) {
			var id = parseInt(req.params.id);
			$.marshallPromise(res, api.user.id(id).put($.stripMeta(req.body)));
		}
	)
	.delete(
		// only admins can delete (can't delete self)
		auth.admin(),
		function(req, res) {
			var id = parseInt(req.params.id);
			if (req.user.id !== id) {
				$.marshallPromise(res, api.user.id(id).del());
			} else {
				res.status(500).send({
					error: 'An admin cannot delete themself.'
				});
			}
		}
	);

// users.js

router.route("/users")
	.get(
		auth.admin(),
		function(req, res) {
			var opts = {};
			if (req.query.from !== undefined) opts.from = parseInt(req.query.from);
			if (req.query.size !== undefined) opts.size = parseInt(req.query.size);
			if (req.query.order !== undefined) opts.order = JSON.parse(req.query.order);
			if (req.query.filter !== undefined) opts.filter = JSON.parse(req.query.filter);
			
			$.marshallPromise(res, api.users.get(opts));
		}
	);

// user/ticket.js

router.route("/user/:id/ticket")
	.post(
		function(req, res) {
			var id = parseInt(req.params.id);
			$.marshallPromise(
				res,
				api.user.id(id).ticket.post($.stripMeta(req.body))
			);
		}
	);

router.route("/user/:id/ticket")
	.get(
		function(req, res) {
			var id = parseInt(req.params.id);
			$.marshallPromise(
				res,
				api.user.id(id).ticket.get()
			);
		}
	)
	.put(
		function(req, res) {
			var id = parseInt(req.params.id);
			$.marshallPromise(
				res,
				api.user.id(id).ticket.put($.stripMeta(req.body))
			);
		}
	);

// user/payment-methods.js

router.route("/user/:id/payment_methods")
	.get(
		function(req, res) {
			var id = parseInt(req.params.id);
			$.marshallPromise(res, api.user.id(id).payment_methods.get());
		}
	);

// user/allowance.js

// TODO: fix
router.route("/user/:id/allowance")
	.get(
		function(req, res) {
			$.marshallPromise(res, api.user.getAllowance(req.user.id));
		}
	);

// user/ticket-types.js

// TODO: fix
router.route("/user/:id/ticket_types")
	.get(
		function(req, res) {
			$.marshallPromise(res, api.user.ticketTypes);
		}
	);

// user/tickets.js

// TODO: fix big time
router.route("/tickets/waiting_list")
	.get(
		function(req, res, next) {
			if (auth.admin(req.user)) {
				next();
			} else {
				$.marshallPromise(res, api.waitingList.getByUser(req.user.id));
			}
		},
		function(req, res) {
			// this only gets called for admins
			var opts = {};
			if (req.query.from !== undefined) opts.from = parseInt(req.query.from);
			if (req.query.size !== undefined) opts.size = parseInt(req.query.size);
			if (req.query.order !== undefined) opts.order = JSON.parse(req.query.order);
			if (req.query.filter !== undefined) opts.filter = JSON.parse(req.query.filter);
		
			$.marshallPromise(res, api.waitingList.getAll(opts));
		}
	);

router.route('/ticket') // waitinglist: true or something
	.post(
		auth.admin(),
		function(req, res) {
			$.marshallPromise(res, api.waitingList.insert($.stripMeta(req.body)));
		}
	);

function checkTicketAccess(req, res, next) {
	api.waitingList.get(req.params.id)
		.then(function(ticket) {		
			if (ticket.user_id === req.user.id) {
				// authorised because I can see my own tickets
				next();
			} else {
				// Requesting someone else's details, so only allowed if I am admin
				return (auth.admin())(req, res, next);
			} 
		});
}

router.route("/tickets/summary")
	.get(
		auth.admin(),
		function(req, res) {
			var opts = {};
			if (req.query.from !== undefined) opts.from = parseInt(req.query.from);
			if (req.query.size !== undefined) opts.size = parseInt(req.query.size);
			if (req.query.order !== undefined) opts.order = JSON.parse(req.query.order);
			if (req.query.filter !== undefined) opts.filter = JSON.parse(req.query.filter);
		
			$.marshallPromise(res, api.waitingList.summary(opts));
		}
	);

router.route("/user/:id/tickets") // waitinglist: true
	.get(
		checkTicketAccess,
		function(req, res) {
			$.marshallPromise(res, api.waitingList.get(req.params.id));
		}
	);

router.route('/user/:id/ticket') // waitinglist: true
	.post(
		auth.admin(),
		function(req, res) {
			$.marshallPromise(res, api.waitingList.update(req.body));
		}
	)
	.delete(
		checkTicketAccess,
		function(req, res) {
			$.marshallPromise(res, api.waitingList.del(req.params.id)
				.then(function(result) {
					if (result.affectedRows > 0) {
						// TODO: confirmation email (+ notification to admins)?
						return {success:true};
					} else {
						return {success:false};
					}
				})
			);
		}
	);
