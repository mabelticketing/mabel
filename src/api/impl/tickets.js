/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("../connection.js");
var runSql = connection.runSql;
var _ = require("lodash");

// api.tickets.get(opts)
// api.tickets.get.waiting_list(opts);
module.exports = {
	get: get,
	del: del
};

function get(opts) {
	var sql = connection.getFilteredSQL("ticket", opts);

	return runSql(sql);
}

function del(ids) {
	var sql = "UPDATE ticket SET status='CANCELLED' WHERE id=?";
	var promises = _.map(ids, function(id) {
		return runSql(sql, [id]);
	})

	return Q.all(promises);;
}