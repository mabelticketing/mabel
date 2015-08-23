/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var express = require("express");
var apiRouter = require("../routes.js");
var api = require("../api.js");

var router = express.Router({
	mergeParams: true
});

module.exports = router;

// TODO: not very resty

router.route("/:id")
	.get(
		apiRouter.checkAdmin(),
		function(req, res) {
			api.payment_method.get(req.params.id).then(function(rows) {
				if (rows.length !== 1) throw new Error(rows.length + ' payment methods match');
				return rows[0];
			}, function(err) {
				console.log(err);
				res.status(500).send(err);
			});
		}
	);

router.route("/")
	.get(
		function(req, res) {
			apiRouter.marshallPromise(res, api.payment_method.getByUser(req.user.id));
		}
	);
