/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("./connection.js");
var runSql = connection.runSql;

module.exports = {
	get: get
};

function get(user) {
	var sql = 
	"SELECT id, name, price, ticket_limit - IFNULL(C.sold,0) ticket_limit \
	FROM ticket_type \
	JOIN \
		(SELECT DISTINCT(ticket_type_id) \
		 FROM \
			 (SELECT * \
				FROM user_group_membership \
				WHERE user_id=?) A \
		 JOIN group_access_right ON A.group_id=group_access_right.group_id) B ON B.ticket_type_id=id \
	LEFT JOIN \
		(SELECT ticket_type_id, \
						COUNT(ticket_type_id) sold \
		 FROM ticket \
		 GROUP BY ticket_type_id) C ON C.ticket_type_id=id;"; 

	return runSql(sql, [user.id]);
}
