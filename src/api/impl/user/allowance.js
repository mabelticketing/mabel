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

		// TODO: add more detail here for the box at the top of the dashboard.
		//       probably a good idea to wait for the schema changes to be finished.




		return runSql("SELECT * FROM user_group_allowance WHERE user_id=?", [user_id])
			.then(function(rows) {
				return {
					allowance: rows[0].allowance
				};
			});
	}
}
