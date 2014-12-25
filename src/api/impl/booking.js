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
	leaveQueue: leaveQueue
};

// TODO: Increase number of people allowed through at a time from 1
var bookQueue = new Queue(1);

// TODO: Do something with event_id	
function joinQueue(user_id, event_id) {
	return bookQueue.joinQueue(user_id);
}

function getStatus(user_id, event_id) {
	return bookQueue.getStatus(user_id);
}

function leaveQueue(user_id, event_id) {
	console.log("Leaving");
	return bookQueue.leaveQueue(user_id);
}

function canBook(user, event_id, callback) {
	// check if the event booking start date is in the past
	var eventSql = "SELECT * FROM event WHERE id=?";
	runSql(eventSql, [event_id], function(err, eventDetails) {
		if (err) return callback(err);
		if (eventDetails.length < 1) return callback(__("No such event"));

		var now = new Date();
		
		if (now < eventDetails[0].launch_time) {
			return callback(null, {open:false, reason:__("Booking is not yet open")});
		}
		
		if (now > eventDetails[0].modification_stop_time) {
			return callback(null, {open:false, reason:__("Booking has closed")});
		}

		// check if the user is at the front of the queue
		var status = getStatus(user.id);
		if (!status.ready) {
			if (!status.queueing) {
				return callback(null, {open: false, reason:__("User is not in the queue")});
			} else {
				return callback(null, {open:false, reason:__("User is not at the head of queue (%s/%s)", status.position, status.of)});
			}
		}

		// TODO: check if there are any ticket types available to this user's groups
		
		return(null, {open:true});
	});
}