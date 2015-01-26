var connection = require("./connection.js");
var runSql     = connection.runSql;

var api = {
	getByUser: getByUser
};

module.exports = api;

function getByUser(user_id) {
	var sql = "SELECT * FROM transaction WHERE user_id = ?";
	return runSql(sql, [user_id]);
}