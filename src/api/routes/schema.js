var express = require("express");
var apiRouter = require("../routes.js");
var api = require("../api.js");
var Q = require("q");
var router = express.Router({
	mergeParams: true
});
module.exports = router;

router.route("/data")
	.get(
		apiRouter.checkAdmin(),
		function(req, res) {
			console.log(req.query);
			var opts = {}
			if (req.query.tables === undefined) throw Error("Table must be defined")
			opts.tables = JSON.parse(req.query.tables);
			
			sopts = {
				tables: opts.tables,
				columns: "COUNT(*) AS c"
			}
			if (req.query.from !== undefined) opts.from = parseInt(req.query.from);
			if (req.query.size !== undefined) opts.size = parseInt(req.query.size);
			if (req.query.columns !== undefined) opts.columns = JSON.parse(req.query.columns);
			if (req.query.joins !== undefined) opts.joins = sopts.joins = JSON.parse(req.query.joins);
			if (req.query.filters !== undefined) opts.filter = sopts.filter = JSON.parse(req.query.filters);

			apiRouter.marshallPromise(res, Q.all([api.schema.getData(opts, true), api.schema.getData(sopts)])
				.then(function(results) {
					return {
						data: results[0],
						size: results[1][0].c
					};
				}));
		}
	);
router.route("/:tname")
	.get(
		apiRouter.checkAdmin(),
		function(req, res) {
			apiRouter.marshallPromise(res, api.schema.getSchema(req.params.tname));
		}
	);

router.route("/:tname/size")
	.get(
		apiRouter.checkAdmin(),
		function(req, res) {
			apiRouter.marshallPromise(res, api.schema.getSize(req.params.tname));
		}
	);

router.route("/:tname/data")
	.get(
		apiRouter.checkAdmin(),
		function(req, res) {
			var opts = {}
			if (req.query.from !== undefined) opts.from = parseInt(req.query.from);
			if (req.query.size !== undefined) opts.size = parseInt(req.query.size);
			apiRouter.marshallPromise(res, api.schema.getDataFromTable(req.params.tname, opts));
		}
	);

router.route("/")
	.get(
		apiRouter.checkAdmin(),
		function(req, res) {
			apiRouter.marshallPromise(res, api.schema.getNames());
		}
	);
