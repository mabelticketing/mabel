/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

module.exports = {
	checkGroup:      checkGroup,
	checkAdmin:      checkAdmin,
	marshallPromise: marshallPromise,
	stripMeta:       stripMeta,
	isAdmin:         isAdmin,
	isInGroup:       isInGroup
};

function isInGroup(user, groupId) {
	// TODO: fix
	return user.groups.indexOf(groupId) > -1;
}

function checkGroup(groupId) {
	return function(req, res, next) {
		if (!isInGroup(req.user, groupId)) {
			return next("You do not have permission to access this resource");
		}
		next();
	};
}

function isAdmin(user) {
	return isInGroup(user, 1);
}

function checkAdmin() {
	return checkGroup(1);
}

function marshallPromise(res, promise) {
	promise.then(function(value) {
		// console.log(value);
		res.json(value || {});
	}, function(err) {
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