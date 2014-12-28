angular.module('mabel.shared')
	.factory('User', User);

function User($resource, $timeout, $rootScope, MabelToken, $http) {
	return wrap($resource('/api/user/:id', {
		access_token: MabelToken,
		id: '@id',
	}, getActions(serialize, unserialize, {
		'current': {
			method: 'GET',
			url: 'api/user/me'
		}
	})), areEqual);

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

	function serializeArray(objs) {
		if (objs === undefined) return objs;
		var _objs = [];
		for (var i=0; i<objs.length; i++) {
			_objs[i] = serialize(objs[i]);
		}
		return _objs;
	}
	function unserializeArray(objs) {
		if (objs === undefined) return objs;
		var _objs = [];
		for (var i=0; i<objs.length; i++) {
			_objs[i] = unserialize(objs[i]);
		}
		return _objs;
	}
	function getActions(serialize, unserialize, extra) {
		var actions = {
			'_get': {
				method: 'GET',
				transformRequest: [serialize].concat($http.defaults.transformRequest),
				transformResponse: $http.defaults.transformResponse.concat([unserialize])
			},
			'_query': {
				method: 'GET',
				isArray: true,
				transformRequest: [serializeArray].concat($http.defaults.transformRequest),
				transformResponse: $http.defaults.transformResponse.concat([unserializeArray])
			},
			'save': {
				method: 'POST',
				transformRequest: [serialize].concat($http.defaults.transformRequest),
				transformResponse: $http.defaults.transformResponse.concat([unserialize])
			}
		};
		if (extra !== undefined) {
			for (var action in extra) {
				// TODO Maybe something about default transformations as above
				actions[action] = extra[action];
			}
		}
		return actions;
	}

	function wrap(Resource, areEqual) {
		Resource.get = get;
		Resource.query = query;
		Resource.prototype.delete = deleteIt;
		Resource.prototype.save = save;

		return Resource;

		function get(parameters, success, error) {
			return Resource._get(parameters, function(value, responseHeaders) {

				// start watching so we can update the server
				function getValue() {
					return value;
				}

				var stopTimer;
				var clearWatch = $rootScope.$watch(getValue, change(stopTimer), true);

				// define non-enumerable properties so they won't show up in the DB
				defineMeta(value);
				value._clearWatch = clearWatch;

				if (success !== undefined) success(value, responseHeaders);
			}, error);
		}

		function query(parameters, success, error) {
			return Resource._query(parameters, function(value, responseHeaders) {
				// set up a watch on new resources
				function getValue(i) {
					return function() {
						return value[i];
					};
				}
				for (var i = 0; i < value.length; i++) {
					var stopTimer;
					var clearWatch = $rootScope.$watch(getValue(i), change(stopTimer), true);

					// define non-enumerable properties so they won't show up in the DB
					defineMeta(value[i]);
					value[i]._clearWatch = clearWatch;
				}
				if (success !== undefined) success(value, responseHeaders);
			}, error);
		}

		function deleteIt(success, error) {
			if (typeof this._clearWatch === "function") this._clearWatch();
			this.$delete(success, error);
		}

		function defineMeta(obj) {
			// TODO?: These properties won't be defined for 'new Resource()'s
			Object.defineProperty(obj, '_status', {
				value: '',
				enumerable: false,
				writable: true
			});
			Object.defineProperty(obj, '_error', {
				value: '',
				enumerable: false,
				writable: true
			});
			Object.defineProperty(obj, '_clearWatch', {
				value: null,
				enumerable: false,
				writable: true
			});
		}

		function save(success, error) {
			this._status = "pending";
			this._error = "";
			var resource = this;
			this.$save(function() {
				resource._status = "success";
				if (success !== undefined) success(resource);
			}, function(response) {
				resource._status = "error";
				resource._error = response.data;
				if (error !== undefined) error(response.data);
			});
		}

		function change(stopTimer) {
			return function(newValue, oldValue) {
				// I'm only interested in saving on actual changes
				if (oldValue === newValue) return;

				// need to check details as well, because === just compares refs
				if (areEqual(oldValue, newValue)) return;

				if (stopTimer !== undefined) $timeout.cancel(stopTimer);

				// only update server periodically else we'll make too many calls
				stopTimer = $timeout(function() {
					newValue.save();
				}, 500);
			};
		}
	}
}