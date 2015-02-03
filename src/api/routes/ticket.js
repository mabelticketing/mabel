var express = require("express");
var apiRouter = require("../routes.js");
var api = require("../api.js");
var router = express.Router({
	mergeParams: true
});
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
		});
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
						return {success:true};
					} else {
						return {success:false};
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
