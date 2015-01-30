var connection = require("./connection.js");
var runSql     = connection.runSql;
var Q 		   = require("q");

var api = {
	getByUser: getByUser,
	getByBookings: getByBookings,
	insert: insertTransactions
};

module.exports = api;

function getByUser(user_id) {
	var sql = "SELECT * FROM transaction WHERE user_id = ?";
	return runSql(sql, [user_id]);
}


function getByBookings(ticketsAllocated) {

	// have to prepare a callback here to avoid defining a function inside a loop
	function callback(ticket) {
		return function(result) {
			if (result.length !== 1) throw "Unexpected number of tickets";
			return {
				user_id: result[0].booking_user_id,
				value: result[0].price,
				payment_method_id: ticket.request.payment_method
			};
		};
	}
	var promises = [];
	for (var i=0; i<ticketsAllocated.length; i++ ) {
		promises.push(
			runSql("SELECT booking_user_id, price \
					FROM ticket \
					JOIN ticket_type \
					ON ticket.ticket_type_id=ticket_type.id \
					WHERE ticket.id=?",[ticketsAllocated[i].rowId])
				.then(callback(ticketsAllocated[i]))
		);	
	}
	return Q.all(promises);
}

function insertTransactions(txs) {
	var promises = [];
	for (var i=0; i<txs.length; i++) {
		promises.push(runSql("INSERT INTO transaction SET ?",[txs[0]]));
	} 
	return Q.all(promises);
}