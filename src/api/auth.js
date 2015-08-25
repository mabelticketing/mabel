/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

// API authentication

var api = require('./api.js');

module.exports = {
	admin: admin
};

function admin() {
	// check user_id is assigned to the admin group (admin_id)

	return function(req, res, next) {
		// fetch ids
		var admin_id = require('../../mabel.json').admin_id;
		var user_id  = req.user.id;

		api.user.id(user_id).groups.get().then(function(rows) {
			var isAdmin = false;
			for (var i=0; i<rows.length; i++) {
				if (rows[i].id === admin_id) isAdmin = true;
				break;
			}
			next(isAdmin ? 'You do not have permission to access this user.' : null);
		});

	};
}
