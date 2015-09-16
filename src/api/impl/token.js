/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("../connection.js");
var helpers = require("../helpers.js");
var Q = require("q");
var runSql = connection.runSql;

module.exports = {
	// main methods
	get: get,
	mabel: {
		get: mabel_get
	},
	raven: {
		get: raven_get
	},
};

// get a new token to renew an old one
function get(obj) {
	console.log("Renewing token");
	// i don't think we should have to do this but we do
	if (typeof obj.access_token !== "string" && typeof obj.access_token === "object" && obj.access_token.length > 0)
		obj.access_token = obj.access_token[0];
	var old_token = helpers.checkToken(obj.access_token);
	return Q({
		token: helpers.makeToken(old_token.id)
	});
}

// requires obj.email
function mabel_get(obj) {
	return runSql("SELECT id FROM user WHERE email=? LIMIT 1", [obj.email])
		.then(function(rows) {
			if (rows.length < 1) {
				var e = new Error("Requested user was not found.");
				e.code = 404;
				throw e;
			}
			return {
				token: helpers.makeToken(rows[0].id)
			};
		});
}

function raven_get() {
	throw new Error("Not implemented :(");
}
