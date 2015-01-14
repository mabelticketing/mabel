var express = require("express");
var apiRouter = require("../routes.js");
var api = require("../api.js");
var router = express.Router({
	mergeParams: true
});
module.exports = router;

router.route("/")
	.get(
		// TODO: allow users to get their own tickets
		apiRouter.checkAdmin(),
		function(req, res) {

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

router.route("/:id")
	.get(
		// TODO: allow users to get their own tickets
		apiRouter.checkAdmin(),
		function(req, res) {
			apiRouter.marshallPromise(res, api.ticket.get(req.params.id));
		}
	)
	.post(
		apiRouter.checkAdmin(),
		function(req, res) {
			apiRouter.marshallPromise(res, api.ticket.update(req.params.id, apiRouter.stripMeta(req.body)));
		}
	)
	.delete(
		apiRouter.checkAdmin(),
		function(req, res) {
			apiRouter.marshallPromise(res, api.ticket.del(req.params.id));
		}
	);