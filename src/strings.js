/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

var res = {
};
var counts = {};

function getString(baseString) {
	// if it's defined, get an alternative base string
	baseString = res[baseString] || baseString;

	// for development, add the new string to the 'res' in memory so that we can dump it and see what strings are used
	if (res[baseString] === undefined) {
		res[baseString] = baseString;
	}
	if (counts[baseString] === undefined) {
		counts[baseString] = 0;
	}
	counts[baseString]++;
	// end dev section
	

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