/*jshint unused:true, bitwise:true, eqeqeq:true, undef:true, latedef:true, eqnull:true */
/* global require, module */


/* TODO: Is this actually thread-safe?
	So technically, JavaScript is single-threaded, but I know from experience that one page could
	pre-empty another if the other is waiting on a breakpoint or something. I don't know how I've 
	done it but it's definitely seen some weird concurrent behaviour in testing. So hard to find!
*/

var __ = require("./strings.js");

function Queue(maxAllowedUsers) {
	this.maxAllowedUsers = maxAllowedUsers;
	// I'm using an object as a set, with properties being members (properties are all set to true)
	this.allowedUsers = {};
	this.currentAllowedUsers = 0;
	this.queueingUsers = [];
	this.mutexLocked = false;
}
Queue.prototype.joinQueue = function joinQueue(req, res, next) {
	// wait for the mutex to become unlocked
	while (this.mutexLocked){}

	// assuming this is an atomic operation? Shaky ground here...
	this.mutexLocked = true;

	// Check if the user is in the queue already
	var queuePos = this.queueingUsers.indexOf(req.user.id);
	if (queuePos < 0) {
		queuePos = this.queueingUsers.length;
		this.queueingUsers[queuePos] = req.user.id;
	}

	// move people from waiting list to queue
	while (this.maxAllowedUsers - this.currentAllowedUsers > 0) {
		this.allowedUsers[this.queueingUsers.shift()] = true;
		this.currentAllowedUsers++;
		queuePos--;
	}

	// let the user in if he's allowed
	if (req.user.id in this.allowedUsers) {
		this.mutexLocked = false;
		return next();
	} else {
		this.mutexLocked = false;
		return res.json({
			"Welcome": __("You are in a queue to buy tickets, at position %s!", queuePos + 1)
		});
	}
};
Queue.prototype.leaveQueue = function leaveQueue(req, res, next) {
	// wait for the mutex to become unlocked
	while (this.mutexLocked){}

	// assuming this is an atomic operation? Shaky ground here...
	this.mutexLocked = true;

	// Check if the user is in the queue already
	var queuePos = this.queueingUsers.indexOf(req.user.id);
	if (queuePos >= 0) {

		// remove the user from the queue
		this.queueingUsers.splice(queuePos, 1);
	}

	// Note that the user shouldn't ever be both in the queue and in allowed users, but I'm being thorough
	if (req.user.id in this.allowedUsers) {
		delete this.allowedUsers[req.user.id];
		this.currentAllowedUsers--;
	}

	this.mutexLocked = false;
	next();
};

module.exports = Queue;