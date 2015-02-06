var express = require("express");
var apiRouter = require("../routes.js");
var api = require("../api.js");
var router = express.Router({
	mergeParams: true
});
module.exports = router;

router.route("/")
	.get(
		function(req, res) {

			var opts = {};
			if (req.query.from !== undefined) opts.from = parseInt(req.query.from);
			if (req.query.size !== undefined) opts.size = parseInt(req.query.size);
			if (req.query.order !== undefined) opts.order = JSON.parse(req.query.order);
			if (req.query.filter !== undefined) opts.filter = JSON.parse(req.query.filter);
		
			apiRouter.marshallPromise(res, api.user.group.getAll(opts));
		}
	)
	.post(
		apiRouter.checkAdmin(),
		function(req, res) {
			apiRouter.marshallPromise(res, api.user.group.insert(apiRouter.stripMeta(req.body)));
		}
	);

router.route("/:id")
	.get(
		function(req, res) {
			apiRouter.marshallPromise(res, api.user.group.get(req.params.id));
		}
	)
	.post(
		apiRouter.checkAdmin(),
		function(req, res) {
			apiRouter.marshallPromise(res, api.user.group.update(req.params.id, apiRouter.stripMeta(req.body)));
		}
	)
	.delete(
		apiRouter.checkAdmin(),
		function(req, res) {
			apiRouter.marshallPromise(res, api.user.group.del(req.params.id));
		}
	);