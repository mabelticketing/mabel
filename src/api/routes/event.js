/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var express   = require("express");
var apiRouter = require("../routes.js");
var api       = require("../api.js");

var router = express.Router({
	mergeParams: true
});

module.exports = router;
	
router.route("/:id")
	.get(
		function(req, res) {
			api.event.get(req.params.id).then(function(rows) {
				// TODO: test & fix
				if (rows.length !== 1) throw new Error("err");
				res.json(rows[0]);
			}, function(err) {
				console.log(err);
				res.status(500).send(err);
			});
		}
	)
	.put(
		apiRouter.checkAdmin(),
		function(req, res) {
			api.event.update(req.params.id, req.body).then(function(rows) {
				if (rows.length !== 1) throw new Error("err");
				res.json(rows[0]);
			}, function(err) {
				console.log(err);
				res.status(500).send(err);
			});
		}
	);
