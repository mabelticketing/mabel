var pass_conf = require("./passport-config.js");
var verifyToken = pass_conf.verifyToken;
var __ = require("./strings.js");

var api = {
	getBookingPageData: function() {
		return {
			"status": "booking",
			"content": __("This is the booking content")
		};
	}
};


module.exports = api;
