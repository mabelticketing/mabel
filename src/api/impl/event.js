/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("./connection.js");
var runSql = connection.runSql;

module.exports = {
	get: get,
	update: update
};

function get(event_id, callback) {
	var sql = "SELECT * FROM event WHERE id=?;";
	runSql(sql, [event_id], function(err, rows) {
		if (err) return callback(err);
		if (rows.length !== 1) return callback({error:rows.length + " events match"});
		callback(null, rows[0]);
	});
}

function update(event_id, data, callback) {
	var sql = "UPDATE event SET ? WHERE id=?;";
	// return the upated object if the update was successful
	runSql(sql, [data, event_id], function(err) {
		if (err) return callback(err);
		get(event_id, callback);
	});
}