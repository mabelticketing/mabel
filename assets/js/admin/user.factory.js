angular.module('mabel.admin')
	.factory('User', User);

function User($resource, $timeout, $rootScope, MabelToken, $http) {

	var UserResource = $resource('/api/user/:id', {
		access_token: MabelToken,
		id: '@id',
	}, 
	// custom actions
	{
		// this is replacing query for us
		'getAll': {
			method: 'GET',
			isArray: true
		}
		// TODO: overr-ride get to add change watch
		// TODO: Add new current user method
	});
	
	// replace query with a function that sets up watches on the resources for us
	UserResource.query = function(parameters, success, error) {
		UserResource.getAll(parameters, function(value, responseHeaders) {
			// set up a watch on new resources
			function getValue(i) {
				return function() {
					return value[i];
				};
			}
			for (var i=0; i<value.length; i++) {
				var stopTimer;
				value[i].clearWatch = $rootScope.$watch(getValue(i), userChange(stopTimer), true);
			}
			success(value, responseHeaders);
		}, error);
	};
	UserResource.prototype.save = function(success, error) {
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
	};
	UserResource.prototype.delete = function(success, error) {
		if (typeof this.clearWatch === "function") this.clearWatch();
		this.$delete(success, error);
	};
	return UserResource;

	function userChange(stopTimer) {
		return function(user, old) {
			// I'm only interested in saving on actual changes
			if (old === user) return;

			// need to check properties as well, because === just compares refs
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
