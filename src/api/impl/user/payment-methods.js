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

    // gets the tickets available to this user by first working out which groups they're a member of,
    // then seeing what access that groups give them (and then stripping duplicate methods out).
    // We also adjust the ticket limit by subtracting the number of tickets this user has bought
    // using this payment method.
    function get() {
        var sql = "SELECT id, name, description, ticket_limit - IFNULL(bought) AS ticket_limit \
        FROM payment_method 
            JOIN \
                (SELECT DISTINCT(payment_method_id) FROM \
                    (SELECT * FROM user_group_membership WHERE user_id=?) A \
                        JOIN group_payment_method_access \
                        ON A.group_id=group_payment_method_access.group_id) B \
            ON B.payment_method_id=id;
            LEFT JOIN \
                (SELECT payment_method_id AS id, COUNT(*) AS bought FROM \
                    ticket WHERE user_id=? \
                    GROUP BY payment_method_id) C \
            ON C.id=payment_method.id;";
        return runSql(sql, [user_id, user_id]);
    }
}
