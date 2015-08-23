/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("./connection.js");
var runSql = connection.runSql;
var config = require("../../config.js");

module.exports = {
	get: get
};

function get(user_id) {
	// TODO: Parameterise this
	var donation_ticket_type_id = config.donation_ticket_type_id;
	return runSql("SELECT a-b AS allowance FROM \
		(SELECT MAX(ticket_allowance) a \
			FROM user_group \
			JOIN user_group_membership \
				ON user_group.id=user_group_membership.group_id \
			WHERE user_id=?) A\
		JOIN (SELECT COUNT(*) b \
			FROM ticket \
			WHERE user_id=? AND ticket_type_id<>?) B;", [user_id, user_id, donation_ticket_type_id]);
}
