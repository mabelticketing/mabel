
/* API Structure
	api
		event
			get (GET)
			update (PUT)
		user
			get (GET)
			update (PUT)
		payment_method
			get
		ticket
			available
				get
*/

module.exports = {
	event          : require("./impl/event.js"),
	user           : require("./impl/user.js"),
	ticket_type    : require("./impl/ticket_type.js"),
	payment_method : require("./impl/payment_method.js"),
	booking        : require("./impl/booking.js")
};