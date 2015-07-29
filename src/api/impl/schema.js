var connection = require("./connection.js");
var runSql = connection.runSql;
var mysql = require("mysql");

var api = {
	getNames: getNames,
	getSchema: getSchema,
	getSize: getSize,
	getDataFromTable: getDataFromTable,
	getData: getData
};
module.exports = api;

function getNames() {
	var sql = "SHOW TABLES";
	return runSql(sql).then(function(values) {
		return values.map(function(r) {
			// the results are currently in the form [{"Tables_in_[DBNAME]": "email"}] which is rubbish
			for (i in r) {
				return r[i];
			}
		})
	});
}

function getSize(table_name) {
	var sql = "SELECT COUNT(*) AS c FROM ??";
	return runSql(sql, [table_name]).then(function(values) {
		return values[0].c
	});
}

function getSchema(table_name) {
	var sql = "SHOW columns from ??";
	return runSql(sql, [table_name]);
}

function getDataFromTable(table_name, opts) {
	opts.tables = [table_name]
	return runSql(getDataSql(opts));
}

function getData(opts, join) {
	var sql = getDataSql(opts)
	console.log(sql);
	var opts = {
		sql: sql,
		nestTables: (join?"_":false)
	}
	return connection.doQuery(opts);
}

function getDataSql(opts) {
	var sql = "SELECT "

	// columns
	if (opts.columns !== undefined && opts.columns.length > 0) {
		if (typeof opts.columns === "string") {
			// this allows me to select COUNT(*)
			sql += opts.columns;
		} else {
			sql += mysql.escapeId(opts.columns);
		} 
	} else {
		sql += "*"
	}

	// table
	sql += " from " + mysql.escapeId(opts.tables);

	// prepare where clause
	var whereClause = "";
	var wheres = opts.wheres || [];

	// 'join' wheres
	if (opts.joins !== undefined) {
		for (var j = 0; j<opts.joins.length; j++) {
			wheres.push(mysql.escapeId(opts.joins[j].left) + "=" + mysql.escapeId(opts.joins[j].right));
		}
	}

	// custom filters (user searches)
	// filter looks like {id: {precise:true, value:56}, ....}
	if (opts.filter !== undefined) {
		for (var i in opts.filter) {

			// check for null filters and ignore them
			if (opts.filter[i].value.length < 1) continue;

			if (opts.filter[i].precise) {
				wheres.push(mysql.escapeId(i) + "=" +  mysql.escape(opts.filter[i].value));
			} else {
				wheres.push(mysql.escapeId(i) + " LIKE " +  mysql.escape("%" + opts.filter[i].value + "%"));
			}
		}
	}

	// actually append the where clause
	if (wheres.length>0) {
		sql += " WHERE " + wheres.join(" AND ");
	}

	// sort in the right order
	if (opts.order !== undefined) {
		var orders = [];
		for (var p in opts.order) {
			var dir;
			if (opts.order[p].match(/^asc$/i) !== null) {
				dir = "ASC";
			} else if (opts.order[p].match(/^desc$/i) !== null) {
				dir = "DESC";
			}
			orders.push(mysql.escapeId(p) + " " +  dir);
		}
		if (orders.length > 0) {
			sql += " ORDER BY " + orders.join(", ");
		}
	}

	// get the page size only
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