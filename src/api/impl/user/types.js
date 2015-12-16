/**
 * Copyright (C) 2015  Mabel Ticketing
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("../../connection.js");
var runSql = connection.runSql;

module.exports = types;

function types(user_id) {

    return {
        get: get
    };

    // gets the ticket types available to the user, with up-to-date ticket limits and user allowances
    function get() {
        return runSql("CALL get_accessible_types(?);", [user_id])
        	.then(function(types) {
        		return types;
        	});
    }
}

 