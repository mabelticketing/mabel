var express = require("express");
var apiRouter = require("../routes.js");
var api = require("../api.js");
var router = express.Router({
	mergeParams: true
});
module.exports = router;

router.route("/:id")
	.get(
		apiRouter.checkAdmin(),
		function(req, res) {
			api.payment_method.get(req.params.id, apiRouter.marshallResult(res));
		}
	);

router.route("/")
	.get(
		function(req, res) {
			apiRouter.marshallPromise(res, api.payment_method.getByUser(req.user.id));
		}
	);