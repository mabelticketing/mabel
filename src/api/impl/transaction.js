var connection = require("./connection.js");
var runSql     = connection.runSql;
var Q 		   = require("q");

var api = {
	getByUser: getByUser,
	insert: insertTransactions
};

module.exports = api;

var handySQLToImplementLaterOnAdminPanel = 
"SELECT transaction.id id, value, payment_method.name payment_method, user.name name, notes, tickets, transaction_time \
FROM transaction \
JOIN payment_method \
	ON payment_method.id = payment_method_id \
JOIN user \
	ON user.id = user_id \
JOIN ( \
	SELECT user_id, GROUP_CONCAT(id ORDER BY id ASC SEPARATOR ', ') tickets \
	FROM ticket \
	GROUP BY user_id \
	) A \
	ON A.user_id = transaction.user_id;";

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