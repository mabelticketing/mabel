/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var connection = require("./connection.js");
var runSql     = connection.runSql;
var Q 		   = require("q");

module.exports = {
	getAll: getAll,
	insertMulti: insertTransactions
};

function getAll(opts) {
	var sql = connection.getFilteredSQL("transaction", opts);

	return runSql(sql);
}

function insertTransactions(txs) {
	var promises = [];
	for (var i=0; i<txs.length; i++) {
		promises.push(runSql("INSERT INTO transaction SET ?, transaction_time=UNIX_TIMESTAMP()",[txs[0]]));
	} 
	return Q.all(promises);
}
