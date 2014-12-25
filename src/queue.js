
/* TODO: Is this actually thread-safe?
	So technically, JavaScript is single-threaded, but I know from experience that one page could
	pre-empty another if the other is waiting on a breakpoint or something. I don't know how I've 
	done it but it's definitely seen some weird concurrent behaviour in testing. So hard to find!
*/

function Queue(maxAllowedUsers) {
	this.maxAllowedUsers = maxAllowedUsers;
	// I'm using an object as a set, with properties being members (properties are all set to true)
	this.allowedUsers = {};
	this.currentAllowedUsers = 0;
	this.queueingUsers = [];
	this.mutexLocked = false;
}

Queue.prototype.getStatus = function getStatus(userId) {
	// NB I'm not using a mutex here but I'm only reading so that's sort of fine
	if (userId in this.allowedUsers) {
		return {
			ready: true,
			queueing: true
		};
	}

	var queuePos = this.queueingUsers.indexOf(userId);
	if (queuePos < 0) {
		return {
			ready: false,
			queueing: false
		};
	} else {
		return {
			ready: false,
			queueing: true,
			position: queuePos + 1,
			of: this.queueingUsers.length
		};
	}
};

Queue.prototype.joinQueue = function joinQueue(userId) {
	// wait for the mutex to become unlocked
	while (this.mutexLocked){}

	// assuming this is an atomic operation? Shaky ground here...
	this.mutexLocked = true;

	// Check if the user is in the queue already
	var queuePos = this.queueingUsers.indexOf(userId);
	if (queuePos < 0 && !(userId in this.allowedUsers)) {
		queuePos = this.queueingUsers.length;
		this.queueingUsers[queuePos] = userId;
	}

	// move people from waiting list to queue
	while (this.maxAllowedUsers - this.currentAllowedUsers > 0) {
		this.allowedUsers[this.queueingUsers.shift()] = true;
		this.currentAllowedUsers++;
		queuePos--;
	}

	// let the user in if he's allowed
	if (userId in this.allowedUsers) {
		this.mutexLocked = false;
		return {
			ready:true,
			queueing: true
		};
	} else {
		this.mutexLocked = false;
		// TODO: Some sort of timeout if you don't check frequently enough
		return {
			ready:false,
			queueing: true,
			position: queuePos + 1,
			of: this.queueingUsers.length
		};
	}
};
Queue.prototype.leaveQueue = function leaveQueue(user_id) {
	// wait for the mutex to become unlocked
	while (this.mutexLocked){}

	// assuming this is an atomic operation? Shaky ground here...
	this.mutexLocked = true;

	// Check if the user is in the queue already
	var queuePos = this.queueingUsers.indexOf(user_id);
	if (queuePos >= 0) {

		// remove the user from the queue
		this.queueingUsers.splice(queuePos, 1);
	}

	// Note that the user shouldn't ever be both in the queue and in allowed users, but I'm being thorough
	if (user_id in this.allowedUsers) {
		delete this.allowedUsers[user_id];
		this.currentAllowedUsers--;
	}

	this.mutexLocked = false;
	return {
		queueing: false,
		ready:false
	};
};

module.exports = Queue;