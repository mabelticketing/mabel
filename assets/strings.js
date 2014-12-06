/*jshint unused:true, bitwise:true, eqeqeq:true, undef:true, latedef:true, eqnull:true */
/* global module */

var res = {
	"You have joined the queue.": "You have now joined the queue. dfgskjdfgkjdsfgkj"
};

function getString(baseString) {
	// if it's defined, get an alternative base string
	baseString = res[baseString] || baseString;

	if (arguments.length > 1) {
		// some parameters have been passed
		for (var i = 1; i<arguments.length; i++) {

			// replace the (i-1)th occurrence of "%s" with the given string
			baseString = baseString.replace("%s", arguments[i].toString());
		}	
	}
	return baseString;
}


module.exports = getString;