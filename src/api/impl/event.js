/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("./connection.js");
var runSql     = connection.runSql;

module.exports = {
	get: get,
	update: update
};

function get(event_id) {
	var sql = "SELECT * FROM event WHERE id=?;";
	return runSql(sql, [event_id]);
}

function update(event_id, data) {
	var sql = "UPDATE event SET ? WHERE id=?;";
	// return the updated object if the update was successful
	return runSql(sql, [data, event_id]).then(function() {
		return get(event_id);
	});
}