/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("../../connection.js");
var runSql = connection.runSql;

module.exports = allowance

function allowance(user_id) {
	return {
		get: get
	};

	function get() {
		return runSql("SELECT a-b AS allowance FROM \
			(SELECT MAX(ticket_limit) a \
				FROM user_group \
				JOIN user_group_membership \
					ON user_group.id=user_group_membership.group_id \
				WHERE user_id=?) A\
			JOIN (SELECT COUNT(*) b \
				FROM ticket \
				WHERE user_id=? AND (status='CONFIRMED' OR status='PENDING')) B;", [user_id, user_id]);	
	}
}
