/* global moment */
angular.module('mabel.shared')
	.factory('User', User);

function User(MabelToken, MabelResource) {
	return MabelResource('/api/user/:id', 
		{
			access_token: MabelToken,
			id: '@id',
		}, 
		{
			// add a custom action to retrieve the current user
			'current': {
				method: 'GET',
				url: 'api/user/me',
				mabelSerialize: true
			}
		},
		{
			serialize: serialize,
			unserialize: unserialize
		}
	);

	function unserialize(user) {

		// time will always be a timestamp for transport, but we want a moment object
		function unserializeTime(dateString) {
			if (dateString !== undefined) return moment.unix(dateString);
		}
		
		if (user === undefined) return user;
		
		// we make a copy rather than modifying directly because otherwise
		// unserializing time will trigger the watch on user
		var _user = angular.copy(user);
		_user.registration_time = unserializeTime(user.registration_time);
		
		return _user;
	}

	function serialize(user) {

		// time must always be a timestamp for transport, but we have a moment object
		function serializeTime(date) {
			if (date !== undefined) return date.unix();
		}

		if (user === undefined) return user;

		// we make a copy rather than modifying directly because otherwise
		// serializing time will trigger the watch on user
		var _user = angular.copy(user);
		_user.registration_time = serializeTime(user.registration_time);

		return _user;
	}
}