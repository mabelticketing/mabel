module.exports = {
	event          : require("./impl/event.js"),
	user           : require("./impl/user.js"),
	ticket         : require("./impl/ticket.js"),
	ticket_type    : require("./impl/ticket_type.js"),
	payment_method : require("./impl/payment_method.js"),
	booking        : require("./impl/booking.js"),
	transaction    : require("./impl/transaction.js"),
	waitingList	   : require("./impl/waiting_list.js"),
	schema		   : require("./impl/schema.js")
};