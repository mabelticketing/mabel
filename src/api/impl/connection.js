var mysql = require("mysql");
var config = require("../../config");

module.exports = {
	getConnection: getConnection,
	runSql: runSql
};
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
function runSql(sql, a, b) {
	var callback;
	if (typeof b==="function") {
		callback = b;
		sql = mysql.format(sql, a);
	} else {
		callback = a;
	}
	var conn = getConnection();
	conn.query(sql, function(err, rows) {
		if (err) return callback(err);
		callback(null, rows);
	});
	conn.end();
}