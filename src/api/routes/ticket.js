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
			var ticket = apiRouter.stripMeta(req.body);
			if (!apiRouter.isAdmin(req.user)) {
				ticket = {guest_name:ticket.guest_name, id:req.params.id};
			}
			apiRouter.marshallPromise(res, api.ticket.update(ticket));
		}
	)
	.delete(
		checkTicketAccess,
		function(req, res) {
			apiRouter.marshallPromise(res, api.ticket.del(req.params.id)
				.then(function(result) {
					if (result.affectedRows > 0) {
						return {success:true};
					} else {
						return {success:false};
					}
				})
			);
		}
	);

// TODO: this should just go through the / route, since we have the user id in req.user.id
router.route("/getByUser/:id")
	.get(
		function(req, res) {
			apiRouter.marshallPromise(res, api.ticket.getByUser(req.params.id));
		}
	);