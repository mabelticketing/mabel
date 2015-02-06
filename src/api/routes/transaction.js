var express   = require("express");
var apiRouter = require("../routes.js");
var api       = require("../api.js");

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
				apiRouter.marshallPromise(res, api.transaction.getByUser(req.user.id));
			}
		},
		function(req, res) {
			// this only gets called for admins
			var opts = {};
			if (req.query.from !== undefined) opts.from = parseInt(req.query.from);
			if (req.query.size !== undefined) opts.size = parseInt(req.query.size);
			if (req.query.order !== undefined) opts.order = JSON.parse(req.query.order);
			if (req.query.filter !== undefined) opts.filter = JSON.parse(req.query.filter);
		
			apiRouter.marshallPromise(res, api.transaction.getAll(opts));
		}
	)
	.post(
		apiRouter.checkAdmin(),
		function(req, res) {
			apiRouter.marshallPromise(res, api.transaction.insert(apiRouter.stripMeta(req.body)));
		}
	);

router.route("/:id")
	.get(
		function(req, res) {
			apiRouter.marshallPromise(res, api.transaction.getDetailed(req.params.id));
		}
	)
	.post(
		apiRouter.checkAdmin(),
		function(req, res) {
			var transaction = apiRouter.stripMeta(req.body);
			var t = {};
			if (transaction.id) t.id = transaction.id;
			if (transaction.user_id) t.user_id = transaction.user_id;
			if (transaction.value) t.value = transaction.value;
			if (transaction.payment_method_id) t.payment_method_id = transaction.payment_method_id;
			if (transaction.notes) t.notes = transaction.notes;
			apiRouter.marshallPromise(res, api.transaction.update(t));
		}
	)
	.delete(
		apiRouter.checkAdmin(),
		function(req, res) {
			apiRouter.marshallPromise(res, api.transaction.del(req.params.id)
				.then(function(result) {
					if (result.affectedRows > 0) {
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
			apiRouter.marshallPromise(res, api.transaction.getByUser(req.params.id));
		}
	);