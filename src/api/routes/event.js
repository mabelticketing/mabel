var express = require("express");
var apiRouter = require("../routes.js");
var api = require("../api.js");
var router = express.Router({
	mergeParams: true
});
module.exports = router;
	
router.route("/:id")
	.get(
		function(req, res) {
			api.event.get(req.params.id, apiRouter.marshallResult(res));
		}
	)
	.post(
		apiRouter.checkAdmin(),
		function(req, res) {
			return res.status(500).send("poop");
			api.event.update(req.params.id, req.body, apiRouter.marshallResult(res));
		}
	);
