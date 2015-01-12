var express = require("express");
var apiRouter = require("../routes.js");
var api = require("../api.js");
var router = express.Router({
	mergeParams: true
});
module.exports = router;

router.route("/available/:event_id")
	.get(
		function(req, res) {
			apiRouter.marshallPromise(res, api.ticket_type.getForUser(req.user, req.params.event_id));
		}
	);

router.route("/:event_id/")
	.get(
		apiRouter.checkAdmin(),
		function(req, res) {

			var opts = {};
			if (req.query.from !== undefined) opts.from = parseInt(req.query.from);
			if (req.query.size !== undefined) opts.size = parseInt(req.query.size);
			if (req.query.order !== undefined) opts.order = JSON.parse(req.query.order);
			if (req.query.filter !== undefined) opts.filter = JSON.parse(req.query.filter);
		
			apiRouter.marshallPromise(res, api.ticket_type.getAll(opts, req.params.event_id));
		}
	)
	.post(
		apiRouter.checkAdmin(),
		function(req, res) {
			apiRouter.marshallPromise(res, api.ticket_type.insert(apiRouter.stripMeta(req.body), req.params.event_id));
		}
	);

router.route("/:event_id/:ticket_type_id")
	.get(
		apiRouter.checkAdmin(),
		function(req, res) {
			apiRouter.marshallPromise(res, api.ticket_type.get(req.params.ticket_type_id));
		}
	)
	.post(
		apiRouter.checkAdmin(),
		function(req, res) {
			apiRouter.marshallPromise(res, api.ticket_type.update(req.params.ticket_type_id, apiRouter.stripMeta(req.body)));
		}
	)
	.delete(
		apiRouter.checkAdmin(),
		function(req, res) {
			apiRouter.marshallPromise(res, api.ticket_type.del(req.params.ticket_type_id));
		}
	);