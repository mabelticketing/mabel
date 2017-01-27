/**
 * Copyright (C) 2015  Mabel Ticketing
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("../../connection.js");
var runSql = connection.runSql;

var Q = require('q');

module.exports = allowance;

function allowance(user_id) {
	return {
		get: get
	};

	function get() {

		// var access = runSql(`SELECT allowance, open_time, close_time, C.name name, D.description as group_name, price
		// 	FROM user_group_membership as A, group_access_right as B,\
		// ticket_type as C, user_group as D WHERE A.group_id=B.group_id AND B.ticket_type_id=C.id AND user_id=? AND close_time>UNIX_TIMESTAMP() AND A.group_id=D.id;`, [user_id]);
		// var overall = runSql("SELECT * FROM user_group_remaining_allowance WHERE user_id=?", [user_id]);
		var allowances = runSql("SELECT * FROM accessible_types WHERE user_id=?;", [user_id]);

		return allowances.then(function(a) {
			// in case there aren't allowances present:
			return a;
			var oa = o[0] && o[0].overall_allowance ? o[0].overall_allowance : 0;
			var ra = o[0] && o[0].remaining_allowance ? o[0].remaining_allowance : 0;
			return {
				access: a,
				overall_allowance: oa,
				remaining_allowance: ra
			};
		});
	}

}
