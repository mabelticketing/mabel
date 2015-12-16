/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("../../connection.js");
var runSql = connection.runSql;

module.exports = allowance;

function allowance(user_id) {
	return {
		get: get
	};

	function get() {
		return runSql("SELECT * FROM user_group_remaining_allowance WHERE user_id=?", [user_id])
			.then(function(rows) {
				var r = {
					remaining_allowance: rows[0].remaining_allowance
				};
				return r;
			});
	}
}
