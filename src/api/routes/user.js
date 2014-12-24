var express = require("express");
var apiRouter = require("../routes.js");
var api = require("../api.js");
var router = express.Router({
	mergeParams: true
});
module.exports = router;

function checkGroup(groupId) {
	return function(req, res, next) {
		if (req.user.groups.indexOf(groupId) < 0) {
			next("You do not have permission to access this resource");
		}
		next();
	};
}

function checkAdmin() {
	return checkGroup(1);
}

router.route("/me")
	.get(
		function(req, res) {
			api.user.get(req.user.id, apiRouter.marshallResult(res));
		}
	);

router.route("/:id")
	.get(
		function(req, res, next) {
			if (parseInt(req.params.id) === req.user.id) {
				// authorised because I can see my own details
				next();
			} else {
				// Requesting someone else's details, so only allowed if I am admin
				return (apiRouter.checkAdmin())(req, res, next);
			} 
		},
		function(req, res) {
			api.user.get(req.params.id, apiRouter.marshallResult(res));
		}
	);

router.route("/")
	.get(
		apiRouter.checkAdmin(),
		function(req, res) {
			api.user.getAll(apiRouter.marshallResult(res));
		}
	);