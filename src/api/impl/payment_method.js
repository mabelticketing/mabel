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
function getAll(callback) {
	runSql("SELECT * FROM payment_method;", callback);
}