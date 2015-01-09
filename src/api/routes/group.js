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
			apiRouter.marshallPromise(res, api.user.group.getAll());
		}
	)
	.post(
		function(req, res) {
			apiRouter.marshallPromise(res, api.user.group.insert(req.body));
		}
	);

router.route("/:id")
	.get(
		function(req, res) {
			apiRouter.marshallPromise(res, api.user.group.get(req.params.id));
		}
	)
	.post(
		function(req, res) {
			apiRouter.marshallPromise(res, api.user.group.update(req.params.id, req.body));
		}
	)
	.delete(
		function(req, res) {
			apiRouter.marshallPromise(res, api.user.group.del(req.params.id));
		}
	);