var connection = require("./connection.js");
var runSql = connection.runSql;

module.exports = {
	get: get,
	getAll: getAll
};

function get(payment_method_id, callback) {
	var sql = "SELECT * FROM payment_method WHERE id=?;";
	runSql(sql, [payment_method_id],  function(err, rows) {
		if (err) return callback(err);
		if (rows.length !== 1) return callback({error:rows.length + " payment methods match"});
		callback(null, rows[0]);
	});
}
function getAll(user_id) {
	return runSql("SELECT id, name, description, event_id, ticket_limit \
	FROM payment_method JOIN \
		(SELECT payment_method_id FROM \
			(SELECT * FROM user_group_membership WHERE user_id=?) A \
				JOIN group_payment_method_access \
				ON A.group_id=group_payment_method_access.group_id) B \
		ON B.payment_method_id=id;", [ user_id]);
}