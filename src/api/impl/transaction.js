var connection = require("./connection.js");
var runSql     = connection.runSql;
var Q 		   = require("q");

var api = {
	getByUser: getByUser,
	insert: insertTransactions
};

module.exports = api;

function getByUser(user_id) {
	var sql = "SELECT * FROM transaction WHERE user_id = ?";
	return runSql(sql, [user_id]);
}

function insertTransactions(txs) {
	var promises = [];
	for (var i=0; i<txs.length; i++) {
		promises.push(runSql("INSERT INTO transaction SET ?, transaction_time=UNIX_TIMESTAMP()",[txs[0]]));
	} 
	return Q.all(promises);
}