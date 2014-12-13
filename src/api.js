/*jshint unused:true, bitwise:true, eqeqeq:true, undef:true, latedef:true, eqnull:true, multistr:true */
/* global require, module, console */

var mysql = require("mysql");
var config = require("./config");

function getConnection() {
	var conn = mysql.createConnection({
		host: config.db_host,
		user: config.db_user,
		password: config.db_password,
		database: config.db_db
	});
	conn.connect();
	return conn;
}

function getBookingFormData(user, event_id, callback) {

	var conn = getConnection();

	var userSQL = "SELECT * FROM user WHERE id=?";
	conn.query(userSQL, [user.id], function(err, rows) {
		if (err || rows.length === 0) {
			return callback({
				error: err || "User doesn't exist"
			});
		} else {
			var userData = rows[0];

			var ticketSQL = "SELECT DISTINCT(ticket_type.id) AS ticket_type_id,\
					ticket_type.name AS name, \
					ticket_type.price AS price \
				FROM group_access_right \
				JOIN user_group \
					ON user_group.id = group_access_right.id \
				JOIN ticket_type \
					ON ticket_type.id = group_access_right.ticket_type_id \
				WHERE ticket_type.event_id=? AND (";
			if (user.groups.length < 1) {
				return callback({
					error: "The user is not a member of any groups!"
				});
			} else {
				var sep = "";
				for (var i=0; i<user.groups.length; i++) {
					ticketSQL += sep + "user_group.id = ?";
					sep = " OR ";
				}
				ticketSQL += ");";
				conn.query(ticketSQL, [event_id].concat(user.groups), function(err, ticketRows) {
					if (err) {
						return callback({
							error: err
						});
					}
					var paymentSQL = "SELECT id, name, description FROM payment_method WHERE event_id=?;";
					conn.query(paymentSQL, [event_id], function(err, paymentRows) {
						if (err) {
							return callback({
								error: err
							});
						}
						return callback({
							availableTickets: ticketRows,
							user: userData,
							payment_methods: paymentRows
						});
					});
					conn.end();
				});
			}
		}
	});

}


module.exports = {
	getConnection: getConnection,
	getBookingFormData: getBookingFormData
};
