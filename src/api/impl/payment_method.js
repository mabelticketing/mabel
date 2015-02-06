var connection = require("./connection.js");
var runSql = connection.runSql;

module.exports = {
	get: get,
	getAll: getAll
};

function get(payment_method_id, callback) {
	var sql = "SELECT * FROM payment_method WHERE id=?;";
	var p = runSql(sql, [payment_method_id])
		.then(function(rows) {
			if (rows.length !== 1) throw {error:rows.length + " payment methods match"};
			return rows[0];
		});

	if (callback !== undefined) {
		p.then(function(result) {callback(null, result);}, callback);
	}
	
	return p;
}
function getAll(user_id) {
	return runSql("SELECT id, name, description, event_id, ticket_limit \
	FROM payment_method JOIN \
		(SELECT DISTINCT(payment_method_id) FROM \
			(SELECT * FROM user_group_membership WHERE user_id=?) A \
				JOIN group_payment_method_access \
				ON A.group_id=group_payment_method_access.group_id) B \
		ON B.payment_method_id=id;", [ user_id]);
}