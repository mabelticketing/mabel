var mysql = require("mysql");
var Q = require("q");
var config = require("../../config");

module.exports = {
	getConnection: getConnection,
	runSql: runSql,
	getFilteredSQL:getFilteredSQL
};

var pool  = mysql.createPool({
  connectionLimit : 100,
  host            : config.db_host,
  user            : config.db_user,
  password        : config.db_password,
  database        : config.db_db,
	// TODO: Don't enable this. Ideally write code that only makes one statement query at a time.
  multipleStatements: true
});


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

function getFilteredSQL(table, opts) {
	var sql = "SELECT * from " + table;

	var whereClause = "";
	var wheres = [];
	var hasWhere = false;
	if (opts.where !== undefined) {
		hasWhere = true;
		wheres.push(opts.where);	
	}
	
	if (opts.filter !== undefined) {
		for (var i in opts.filter) {
			if (opts.filter[i].length < 1) continue;
			hasWhere = true;
			wheres.push(mysql.escapeId(i) + " LIKE " +  mysql.escape('%' + opts.filter[i] + '%'));
		}
	}
	if (hasWhere) {
		whereClause = " WHERE " + wheres.join(" AND ");
	}

	// if (opts.size !== undefined) {
		sql += " JOIN (SELECT COUNT(*) AS $count FROM " + table + whereClause + ") AS c";
	// }
	sql += whereClause;

	if (opts.order !== undefined) {
		var orders = [];
		var hasOrder = false;
		for (var p in opts.order) {
			var dir;
			hasOrder = true;
			if (opts.order[p].match(/^asc$/i) !== null) {
				dir = "ASC";
			} else if (opts.order[p].match(/^desc$/i) !== null) {
				dir = "DESC";
			}
			orders.push(mysql.escapeId(p) + " " +  dir);
		}
		if (hasOrder) {
			sql += " ORDER BY " + orders.join(", ");
		}
	}

	if (opts.size !== undefined && !isNaN(opts.size) ) {
		sql += " LIMIT ";
		if (opts.from !== undefined && !isNaN(opts.from) ) {
			sql += mysql.escape(opts.from) + ",";
		}
		sql += mysql.escape(opts.size);
	}
	sql += ";";
	return sql;
}

// runSql(sql, data, callback, multiStatements)
// runSql(sql, callback, multiStatements)
// runSql(sql, data, multiStatements)
// runSql(sql, data, callback)
// runSql(sql, callback)
// runSql(sql, data)
// runSql(sql, multiStatements)
// runSql(sql);
function runSql() {
	var sql, data = {}, callback = function(){}, multiStatements = false;
	switch(arguments.length) {
		case 4:
			data = arguments[1];
			callback = arguments[2];
			multiStatements = arguments[3];
		case 3:
			switch (typeof arguments[1]) {
				case "function":
					if (typeof arguments[2] !== "boolean") {
						throw new Error("Invalid usage for runSql", arguments);
					}
					callback = arguments[1];
					multiStatements = arguments[2];
					break;
				case "object":
					data = arguments[1];
					switch (typeof arguments[2]) {
						case "boolean":
							multiStatements = arguments[2];
							break;
						case "function":
							callback = arguments[2];
							break;
						default:
							throw new Error("Invalid usage for runSql", arguments);
					}
					break;
				default:
					throw new Error("Invalid usage for runSql", arguments);
			}
			break;
		case 2:
			switch (typeof arguments[1]) {
				case "function":
					callback = arguments[1];
					break;
				case "object":
					data = arguments[1];
					break;
				case "boolean":
					multiStatements = arguments[1];
					break;
				default:
					throw new Error("Invalid usage for runSql", arguments);
			}
			break;
		case 1: break;
		default:
			throw new Error("Invalid usage for runSql", arguments);
	}
	sql = mysql.format(arguments[0].replace(/(\t|\n)/g," ").replace(/\s+/g," "), data);
	
	// create a promise which will be resolved when the query returns
	// for backwards-compatibility, add the given callback to the promise 
	var d = Q.defer();
	d.promise.then(function(value) {
		callback(null, value);
	}, function(err) {
		callback(err);
	});

	pool.getConnection(function(err, conn) {
		if (err) {
			return d.reject(err);
		} 
		conn.query(sql, function(err, rows) {
			conn.release();
			if (err) {
				// if we get a deadlock, just try again
				// http://stackoverflow.com/questions/643122/how-to-detect-deadlocks-in-mysql-innodb
				if (err.errno === 1213) {
					return d.resolve(runSql(sql));
				} else {
					return d.reject(err);
				}
			}
			rows.queryData = data;
			rows.querySql = sql;
			d.resolve(rows);
		});
		
	});

	return d.promise;
}
