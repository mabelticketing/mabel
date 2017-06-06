/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var mysql = require("mysql");
var Q = require("q");
var config = require("../config");

module.exports = {
	getConnection: getConnection,
	runSql: runSql,
	getFilteredSQL:getFilteredSQL,
	doQuery: doQuery
};

var pool  = mysql.createPool({
  connectionLimit : 20,
  host            : config.db_host,
  user            : config.db_user,
  password        : config.db_password,
  database        : config.db_db,
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

// this is slightly hacky - values should be parsed at a higher level (e.g. swagger)
function parseDataTableOpts(opts) {
	// opts.columns is just a string
	// opts.where is just a string
	if (opts.filter !== undefined) {
		opts.filter = JSON.parse(opts.filter);
	}
	if (opts.order !== undefined) {
		opts.order = JSON.parse(opts.order);
	}
	
	if (opts.size !== undefined) {
		opts.size = parseInt(opts.size);
	}
	if (opts.from !== undefined) {
		opts.from = parseInt(opts.from);
	}

	return opts;
}

function getFilteredSQL(table, opts) {
	opts = parseDataTableOpts(opts);
	var sql = "SELECT ";

	// columns
	if (opts.columns !== undefined) 
		sql += mysql.escapeId(opts.columns);
	else 
		sql += "*";

	// table
	sql += " FROM " + mysql.escapeId(table);

	// prepare where clause
	var whereClause = "";
	var wheres = [];
	var hasWhere = false;
	// predefined where
	if (opts.where !== undefined) {
		hasWhere = true;
		wheres.push(opts.where);	
	}
	
	// automatic where
	if (opts.filter !== undefined) {
		for (var i in opts.filter) {
			if (opts.filter[i].length < 1) continue;
			hasWhere = true;
			wheres.push(mysql.escapeId(i) + " LIKE " +  mysql.escape(opts.filter[i]));
		}
	}

	// actually append the where clause
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

// runSql(sql, data)
// runSql(sql);
function runSql(sql, data) {
	if (data === undefined) data = {};
	sql = mysql.format(arguments[0].replace(/(\t|\n)/g," ").replace(/\s+/g," "), data);
	var p = doQuery(sql)
		.then(function (r) {
			r.queryData = data;
			r.querySql = sql;
			return r;
		});
	return p;
}


function doQuery(sqlOrOptions) {
	// create a promise which will be resolved when the query returns
	// for backwards-compatibility, add the given callback to the promise 
	var d = Q.defer();

	pool.getConnection(function(err, conn) {
		if (err) {
			return d.reject(err);
		} 
		conn.query(sqlOrOptions, function(err, rows) {
			conn.release();
			if (err) {
				// if we get a deadlock, just try again
				// http://stackoverflow.com/questions/643122/how-to-detect-deadlocks-in-mysql-innodb
				if (err.errno === 1213) {
					return d.resolve(doQuery(sqlOrOptions));
				} else {
					return d.reject(err);
				}
			}
			d.resolve(rows);
		});
		
	});

	return d.promise;
}
