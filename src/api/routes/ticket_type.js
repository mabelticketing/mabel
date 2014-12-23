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
			api.ticket_type.getAll(req.user, req.query.event_id, apiRouter.marshallResult(res));
		}
	);
