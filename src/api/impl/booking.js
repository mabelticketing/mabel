var connection = require("./connection.js");
var __ = require("../../strings.js");
var Queue = require("../../queue.js");
var runSql = connection.runSql;

module.exports = {
	canBook: canBook,

	// NB: Both joinQueue and getStatus will get the position in the queue, but
	// joinQueue will update the queue while getStatus will not
	joinQueue: joinQueue,
	getStatus: getStatus,
	leaveQueue: leaveQueue,
	makeBooking: makeBooking,
	makeTransaction: makeTransaction
};

// TODO: Increase number of people allowed through at a time from 1
var bookQueue = new Queue(1);

// TODO: Do something with event_id	
function joinQueue(user_id, event_id) {
	return bookQueue.joinQueue(user_id);
}

// TODO: Do something with event_id	
function getStatus(user_id, event_id) {
	return bookQueue.getStatus(user_id);
}

// TODO: Do something with event_id	
function leaveQueue(user_id, event_id) {
	return bookQueue.leaveQueue(user_id);
}

function canBook(user_id, event_id, callback) {
	// check if the event booking start date is in the past
	var eventSql = "SELECT * FROM event WHERE id=?";
	runSql(eventSql, [event_id], function(err, eventDetails) {
		if (err) return callback(err);
		if (eventDetails.length < 1) return callback(__("No such event"));

		var now = new Date().getTime()/1000;
		
		if (now < eventDetails[0].launch_time) {
			return callback(null, {open:false, reason:__("Booking is not yet open")});
		}
		
		if (now > eventDetails[0].close_time) {
			return callback(null, {open:false, reason:__("Booking has closed")});
		}

		// check if the user is at the front of the queue (join if not in queue)
		var status = joinQueue(user_id, event_id);
		if (!status.ready) {
			if (!status.queueing) {
				return callback(null, {open: false, reason:__("User is not in the queue")});
			} else {
				return callback(null, {
					open: false,
					queueing: true,
					position: status.position,
					of: status.of,
					reason: __("User is not at the head of queue (%s/%s)", status.position, status.of)
				});
			}
		}

		// TODO: check if there are any ticket types available to this user's groups
		
		return callback(null, {open:true});
	});
}

function makeBooking(user_id, event_id, booking, callback) {
	// have ticketsAllocated object so user isn't over charged if all tickets not available
	var ticketsAllocated = [];

	var countSql = "SELECT * FROM (SELECT ticket_type_id,COUNT(*) AS ticket_num FROM ticket GROUP BY ticket_type_id) AS t1 \
	RIGHT JOIN (SELECT id,ticket_limit FROM ticket_type) AS t2 ON t1.ticket_type_id=t2.id";
	var promise1 = runSql(countSql);

	return promise1.then(function(countResult) {
		// create array of count information
		var counts = []; // again, undefineds in this array. there is probably a better way, but this is A WAY
		for(var i=0; i<countResult.length; i++) {
			counts[countResult[i].id] = {
				"count" : (countResult[i].ticket_num == null) ? 0 : countResult[i].ticket_num, // if null, 0 tickets sold
				"limit" : countResult[i].ticket_limit
			};
		}
		// generate queries
		insertSqlStatements = [];
		var tickets = booking.tickets;
		for(var j=0; j<tickets.length; j++) {
			var ticketsLeft = counts[tickets[j].ticket_type_id].limit - counts[tickets[j].ticket_type_id].count;
			if (tickets[j].quantity > 0 && ticketsLeft > 0) { // if we WANT tickets AND there are TICKETS LEFT
				var toBuy = Math.min(tickets[j].quantity, ticketsLeft); // make sure we aren't over selling
				ticketsAllocated.push({
					"ticket_type_id": tickets[j].ticket_type_id,
					"quantity": toBuy
				});
				var query = "INSERT INTO ticket (booking_user_id,ticket_type_id,status_id,book_time) VALUES ";
				var spacer = "";
				for (var k=0; k<toBuy; k++) {
					query += spacer;
					query += "("+user_id+","+tickets[j].ticket_type_id+",1,UNIX_TIMESTAMP())";
					spacer = ",";
				}
				insertSqlStatements.push(query);
			}
		}
		// join queries
		insertSql = insertSqlStatements.join("; ");

		// run insert query
		var promise2 = runSql(insertSql);

		return promise2.then(function () {
			return {
				"ticketsAllocated": ticketsAllocated
			};
		}, true);
	});


}

function makeTransaction(user_id, event_id, booking, ticketsAllocated, callback) {
	ticketTypeSql = "SELECT * FROM ticket_type WHERE event_id=?";
	runSql(ticketTypeSql, [event_id], function(err, types) {
		if (err) return callback(err);
		var value = 0;
		var totalQty = 0;

		var sortedTypes = [];
		for (var i=0; i<types.length; i++) sortedTypes[types[i].id] = types[i];

		// generate value
		for (var j=0; j<ticketsAllocated.length; j++) {
			var price = sortedTypes[ticketsAllocated[j].ticket_type_id].price;
			var qty = ticketsAllocated[j].quantity;
			totalQty += qty;
			value += price * qty;
		}

		// add charitable donation if nesc.
		value += booking.donate ? (2*totalQty) : 0; // ASSUMES booking donation = £2.00 which it IS FOR EMB2015

		transactionSql = "INSERT INTO transaction (user_id,value,payment_method_id,transaction_time) VALUES(?,?,?,UNIX_TIMESTAMP())";
		runSql(transactionSql, [user_id,value,booking.payment_method], function(err) {
			if (err) return callback(err);
			else callback(null,{}); // TODO: something more interesting here?
		})

	});
}
