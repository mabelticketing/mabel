/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

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
				apiRouter.marshallPromise(res, api.waitingList.getByUser(req.user.id));
			}
		},
		function(req, res) {
			// this only gets called for admins
			var opts = {};
			if (req.query.from !== undefined) opts.from = parseInt(req.query.from);
			if (req.query.size !== undefined) opts.size = parseInt(req.query.size);
			if (req.query.order !== undefined) opts.order = JSON.parse(req.query.order);
			if (req.query.filter !== undefined) opts.filter = JSON.parse(req.query.filter);
		
			apiRouter.marshallPromise(res, api.waitingList.getAll(opts));
		}
	)
	.post(
		apiRouter.checkAdmin(),
		function(req, res) {
			apiRouter.marshallPromise(res, api.waitingList.insert(apiRouter.stripMeta(req.body)));
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
				return (apiRouter.checkAdmin())(req, res, next);
			} 
		});
}

router.route("/summary/")
	.get(
		apiRouter.checkAdmin(),
		function(req, res) {
			var opts = {};
			if (req.query.from !== undefined) opts.from = parseInt(req.query.from);
			if (req.query.size !== undefined) opts.size = parseInt(req.query.size);
			if (req.query.order !== undefined) opts.order = JSON.parse(req.query.order);
			if (req.query.filter !== undefined) opts.filter = JSON.parse(req.query.filter);
		
			apiRouter.marshallPromise(res, api.waitingList.summary(opts));
		}
	);

router.route("/:id")
	.get(
		checkTicketAccess,
		function(req, res) {
			apiRouter.marshallPromise(res, api.waitingList.get(req.params.id));
		}
	)
	.post(
		apiRouter.checkAdmin(),
		function(req, res) {
			apiRouter.marshallPromise(res, api.waitingList.update(req.body));
		}
	)
	.delete(
		checkTicketAccess,
		function(req, res) {
			apiRouter.marshallPromise(res, api.waitingList.del(req.params.id)
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

router.route("/getByUser/:id")
	.get(
		function(req, res) {
			apiRouter.marshallPromise(res, api.waitingList.getByUser(req.params.id));
		}
	);