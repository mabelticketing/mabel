/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

// Helpers for the API

module.exports = {
	marshallPromise: marshallPromise,
	stripMeta: stripMeta
};

function marshallPromise(res, promise) {
	promise.then(function(result) {
		// if success return result else empty object
		res.json(result || {});
	}, function(err) {
		// log & send error
		console.log(err);
		res.status(500).send(err);
	});
}

function stripMeta(obj) {
	// delete any properties which start with $ or _
	for (var i in obj) {
		if (i.indexOf("_") === 0 || i.indexOf("$") === 0) {
			delete obj[i];
		}
	}
	return obj;
}
