angular.module('mabel.shared')
	.factory('User', User);

function User($resource, $timeout, $rootScope, MabelToken) {
	var UserResource = $resource('/api/user/:id', {
		access_token: MabelToken,
		id: '@id',
	}, 
	{
		// this is what 'query' normally does, but we want to overwrite query later
		'getAll': {
			method: 'GET',
			isArray: true
		},
		'current': {
			method: 'GET',
			url: '/api/user/me'
		}
	});
	
	// replace query with a function that sets up watches on the resources for us
	// TODO: Maybe we need to wrap other sources (e.g. get) with $watch like we have for query
	UserResource.query = queryUsers;
	// wrap $delete with our own function which first clears the watchs set up in query
	UserResource.prototype.delete = deleteIt;
	// wrap $save with our own function which sets user._status for indicators
	UserResource.prototype.save = save;

	return UserResource;

	function queryUsers(parameters, success, error) {
		return UserResource.getAll(parameters, function(value, responseHeaders) {
			// set up a watch on new resources
			function getValue(i) {
				return function() {
					return value[i];
				};
			}
			for (var i=0; i<value.length; i++) {
				var stopTimer;
				value[i]._clearWatch = $rootScope.$watch(getValue(i), change(stopTimer), true);
			}
			if (success !== undefined) success(value, responseHeaders);
		}, error);
	}
	function deleteIt(success, error) {
		if (typeof this._clearWatch === "function") this._clearWatch();
		this.$delete(success, error);
	}
	function save(success, error) {
		this._status = "pending";
		this._error = "";
		var user = this;
		this.$save(function() {
			user._status = "success";
			if (success !== undefined) success(user);
		}, function(response) {
			user._status = "error";
			user._error = response.data;
			if (error !== undefined) error(response.data);
		});
	}
	function change(stopTimer) {
		return function(user, old) {
			// I'm only interested in saving on actual changes
			if (old === user) return;

			// need to check properties as well, because === just compares refs
			// TODO: I think registration_time is breaking things on the server, 
			// maybe because server time and DB timezones are not the same?
			if (old.crsid === user.crsid && 
				old.email === user.email &&
				old.name === user.name &&
				old.id === user.id &&
				old.registration_time === user.registration_time) return;

			if (stopTimer !== undefined) $timeout.cancel(stopTimer);

			// only update server periodically else we'll make too many calls
			stopTimer = $timeout(function() {
				user.save();
			}, 500);
		};
	}
}
