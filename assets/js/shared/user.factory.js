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
			'current': {
				method: 'GET',
				url: 'api/user/me',
				mabelSerialize: true
			}
		},
		{
			areEqual: areEqual,
			serialize: serialize,
			unserialize: unserialize
		}
	);

	function unserialize(user) {
		function unserializeTime(dateString) {
			if (dateString !== undefined) return moment.unix(dateString);
		}
		if (user === undefined) return user;
		var _user = angular.copy(user);
		_user.registration_time = unserializeTime(user.registration_time);
		return _user;
	}

	function serialize(user) {

		function serializeTime(date) {
			if (date !== undefined) return date.unix();
		}
		if (user === undefined) return user;
		var _user = angular.copy(user);
		_user.registration_time = serializeTime(user.registration_time);
		return _user;
	}

	function areEqual(A, B) {
		return A.crsid === B.crsid &&
			A.email === B.email &&
			A.name === B.name &&
			A.id === B.id &&
			A.registration_time.isSame(B.registration_time, 'minutes');
	}
}