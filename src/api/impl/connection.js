var mysql = require("mysql");
var config = require("../../config");

module.exports = {
	getConnection: getConnection,
	runSql: runSql
};

function getConnection(opts) {
	if (opts === undefined) opts = {};
	opts.host = config.db_host;
	opts.user = config.db_user;
	opts.password = config.db_password;
	opts.database = config.db_db;
	var conn = mysql.createConnection(opts);
	conn.connect();
	return conn;
}

function runSql(sql, a, b, c) {
	var callback, multiStatements;
	if (typeof b === "function") {
		callback = b;
		sql = mysql.format(sql, a);
		multiStatements = c;
	} else {
		callback = a;
		multiStatements = b;
	}
	var conn = getConnection({
		multipleStatements: (multiStatements !== undefined && multiStatements)
	});
	conn.query(sql, function(err, rows) {
		if (err) return callback(err.message);
		callback(null, rows);
	});
	conn.end();
}