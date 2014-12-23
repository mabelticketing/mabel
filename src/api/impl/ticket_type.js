var connection = require("./connection.js");
var runSql = connection.runSql;

module.exports = {
	getAll: getAll
};

function getAll(user, event_id, callback) {
	if (user.groups.length < 1)
		return callback({error:"The user is not a member of any groups!"});
	var sql = "SELECT DISTINCT(ticket_type.id) AS ticket_type_id,\
			ticket_type.name AS name, \
			ticket_type.price AS price \
		FROM group_access_right \
		JOIN user_group \
			ON user_group.id = group_access_right.group_id \
		JOIN ticket_type \
			ON ticket_type.id = group_access_right.ticket_type_id \
		WHERE ticket_type.event_id=? AND (";

	var sep = "";
	for (var i = 0; i < user.groups.length; i++) {
		sql += sep + "user_group.id = ?";
		sep = " OR ";
	}
	sql += ");";
	runSql(sql, [event_id].concat(user.groups), callback);
}