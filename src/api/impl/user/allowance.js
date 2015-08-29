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

	function get(ticket_id) {
		if (ticket_id === undefined) {
			// called without arguments - get global/group allowance
		return runSql("", [user_id, user_id]);	
		}
	}
}
