/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

module.exports = {
    port        : 3008,
    base_url    : "http://localhost:3008",
    db_host     : "localhost",
    db_password : "LockDown1",
    db_user     : "root",
    db_db       : "mabel",
    jwt_secret  : "jwt-pass",
    mailgun_api_key: "123",
  	admin_groups: [1],
  	donation_value: 2,
    external_keys: {
        raven: "lknjf3o4fuihqfhq234pf98h23q4prndqr23rfcq43r34n"
    }
};
