
/* API Structure
	api
		event
			get (GET)
			update (PUT)
		user
			get (GET)
			update (PUT)
		payment_method
			get
		ticket
			available
				get
*/

module.exports = {
	event          : require("./impl/event.js"),
	user           : require("./impl/user.js"),
	ticket_type    : require("./impl/ticket_type.js"),
	payment_method : require("./impl/payment_method.js")
};

function getBookingFormData(user, event_id, callback) {

	var conn = getConnection();

	var userSQL = "SELECT * FROM user WHERE id=?";
	conn.query(userSQL, [user.id], function(err, rows) {
		if (err || rows.length === 0) {
			conn.end();
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
					ON user_group.id = group_access_right.group_id \
				JOIN ticket_type \
					ON ticket_type.id = group_access_right.ticket_type_id \
				WHERE ticket_type.event_id=? AND (";
			if (user.groups.length < 1) {
				conn.end();
				return callback({
					error: "The user is not a member of any groups!"
				});
			} else {
				var sep = "";
				for (var i = 0; i < user.groups.length; i++) {
					ticketSQL += sep + "user_group.id = ?";
					sep = " OR ";
				}
				ticketSQL += ");";
				conn.query(ticketSQL, [event_id].concat(user.groups), function(err, ticketRows) {
					if (err) {

						conn.end();
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