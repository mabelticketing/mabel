var connection = require("./connection.js");
var runSql = connection.runSql;

module.exports = {
	get: get,
	getAll: getAll
};

function get(user_id, callback) {
	var sql = "SELECT * FROM user WHERE id=?;";
	runSql(sql, [user_id], function(err, rows) {
		if (err) return callback(err);
		if (rows.length !== 1) return callback({error:rows.length + " users match"});
		callback(null, rows[0]);
	});
}
function getAll(callback) {
	runSql("SELECT * FROM user;", callback);
}