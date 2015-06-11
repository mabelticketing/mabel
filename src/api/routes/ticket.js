var express = require("express");
var apiRouter = require("../routes.js");
var api = require("../api.js");
var Q = require("q");
var config = require("../../config.js");
var moment = require("moment");
var router = express.Router({
	mergeParams: true
});
var unidecode = require("unidecode");
var emailer = require("../../emailer.js");

module.exports = router;

router.route("/")
	.get(
		function(req, res, next) {
			if (apiRouter.isAdmin(req.user)) {
				next();
			} else {
				apiRouter.marshallPromise(res, api.ticket.getByUser(req.user.id));
			}
		},
		function(req, res) {
			// this only gets called for admins
			var opts = {};
			if (req.query.from !== undefined) opts.from = parseInt(req.query.from);
			if (req.query.size !== undefined) opts.size = parseInt(req.query.size);
			if (req.query.order !== undefined) opts.order = JSON.parse(req.query.order);
			if (req.query.filter !== undefined) opts.filter = JSON.parse(req.query.filter);

			apiRouter.marshallPromise(res, api.ticket.getAll(opts));
		}
)
	.post(
		apiRouter.checkAdmin(),
		function(req, res) {
			apiRouter.marshallPromise(res, api.ticket.insert(apiRouter.stripMeta(req.body)));
		}
);
router.route("/admit")
	.get(
		function(req, res) {
			apiRouter.marshallPromise(res, api.ticket.admitted());
		});

router.route("/admit/:id")
	.post(function(req, res) {
		apiRouter.marshallPromise(res, api.ticket.admit(req.params.id));
	});

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
router.route("/process_waiting_list/:id")
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
		apiRouter.checkAdmin(),
		function(req, res) {
			apiRouter.marshallPromise(res, api.ticket.getAllDetailed());
		}
	);

router.route("/process_waiting_list/")
	.post(
		apiRouter.checkAdmin(),
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
		apiRouter.checkAdmin(),
		function(req, res) {
			var opts = {};
			if (req.query.from !== undefined) opts.from = parseInt(req.query.from);
			if (req.query.size !== undefined) opts.size = parseInt(req.query.size);
			if (req.query.order !== undefined) opts.order = JSON.parse(req.query.order);
			if (req.query.filter !== undefined) opts.filter = JSON.parse(req.query.filter);

			apiRouter.marshallPromise(res, api.ticket.summary(opts));
		}
);

router.route("/summary/byuser")
	.get(
		apiRouter.checkAdmin(),
		function(req, res) {
			var opts = {};
			if (req.query.from !== undefined) opts.from = parseInt(req.query.from);
			if (req.query.size !== undefined) opts.size = parseInt(req.query.size);
			if (req.query.order !== undefined) opts.order = JSON.parse(req.query.order);
			if (req.query.filter !== undefined) opts.filter = JSON.parse(req.query.filter);

			apiRouter.marshallPromise(res, api.ticket.summary_byuser(opts));
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
				if (apiRouter.isAdmin(req.user)) {
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

			apiRouter.marshallPromise(res, Q.all(authPromises).then(function() {
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
				if (apiRouter.isAdmin(req.user)) {
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

			apiRouter.marshallPromise(res, Q.all(authPromises).then(function() {
				var promises = [];
				for (var i = 0; i < authedTickets.length; i++) {

					var ticket = authedTickets[i];
					var t = {};
					if (ticket.guest_name) t.guest_name = ticket.guest_name;
					if (ticket.id) t.id = ticket.id;
					if (apiRouter.isAdmin(req.user)) {
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
				return (apiRouter.checkAdmin())(req, res, next);
			}
		},
		next);
}

router.route("/:id")
	.get(
		checkTicketAccess,
		function(req, res) {
			apiRouter.marshallPromise(res, api.ticket.get(req.params.id));
		}
)
	.post(
		checkTicketAccess,
		function(req, res) {
			// An admin can change anything - but a user can only change guest name
			// TODO: confirmation email?
			var ticket = apiRouter.stripMeta(req.body);
			var t = {};
			if (ticket.guest_name) t.guest_name = ticket.guest_name;
			if (ticket.id) t.id = ticket.id;
			if (apiRouter.isAdmin(req.user)) {
				if (ticket.user_id) t.user_id = ticket.user_id;
				if (ticket.ticket_type_id) t.ticket_type_id = ticket.ticket_type_id;
				if (ticket.status_id) t.status_id = ticket.status_id;
				if (ticket.payment_method_id) t.payment_method_id = ticket.payment_method_id;
				if (ticket.book_time) t.book_time = ticket.book_time;
			}
			apiRouter.marshallPromise(res, api.ticket.update(t));
		}
)
	.delete(
		checkTicketAccess,
		function(req, res) {
			apiRouter.marshallPromise(res, api.ticket.del(req.params.id)
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
			apiRouter.marshallPromise(res, api.ticket.getByUser(req.params.id));
		}
);