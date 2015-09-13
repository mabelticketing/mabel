/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("../connection.js");
var helpers = require("../helpers.js");
var runSql = connection.runSql;

module.exports = {
	// main methods
	get: get
};

// requires obj.email
function get(obj) {
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
