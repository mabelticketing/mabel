var express   = require("express");
var apiRouter = require("../routes.js");
var api       = require("../api.js");

var router = express.Router({
	mergeParams: true
});

module.exports = router;

router.route("/getByUser/:id")
	.get(
		function(req, res) {
			apiRouter.marshallPromise(res, api.transaction.getByUser(req.params.id));
		}
	);