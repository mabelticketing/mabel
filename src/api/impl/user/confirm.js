/**
 * Copyright (C) 2015  Mabel Ticketing
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("../../connection.js");
var emailer = require("../../../emailer");
var config = require("../../../config");
var unidecode = require('unidecode');
var api = require("../../api");


module.exports = types;

function types(user_id) {

    return {
        get: get,
        post: post
    };

    function post(data) {
        var confirmation_code = data.code;
        console.log("Confirming code: " + confirmation_code);

        return connection.runSql("UPDATE user SET is_verified=1 WHERE id=? AND verification_code=?", [user_id, confirmation_code])
            .then(function(rows) {
                if (rows.affectedRows < 1) {
                    var e = new Error("Invalid verification code");
                    e.code = 401;
                    throw e;
                }
                return {
                    success: true
                };
            });
    }

    function get() {
       return  api.user(user_id).get()
            .then(function(u) {

                if (u.is_verified === false && u.verification_code !== null && u.verification_code !== undefined) {
                    emailer.send("'" + unidecode(u.name) + "' <" + u.email + ">", "Registration Confirmation",
                        "regConf.jade", {
                            name: u.name,
                            link: config.base_url + "/confirm/" + u.verification_code
                        });
                }   
                return {
                    success: true
                };
            });
    }
}

 