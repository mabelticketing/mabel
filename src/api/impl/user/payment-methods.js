/**
 * Copyright (C) 2015  Mabel Ticketing
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("../../connection.js");
var runSql = connection.runSql;

module.exports = payment_method;

function payment_method(user_id) {
    return {
        get: get
    };

    function get() {
        var sql = "select\
			payment_method.id id,\
			name,\
			description,\
			bought\
		FROM payment_method_status\
		JOIN payment_method\
			ON payment_method_status.payment_method_id=payment_method.id\
		WHERE user_id=?;";
        return runSql(sql, [user_id])
        	// .spread(function(result, stuff) {
        		// return result;
        	// });
    }
}
