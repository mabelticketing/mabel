/* global moment */
angular.module('mabel.admin')
	.factory('EventSettings', EventSettings);

function serializeTime(date) {
	if (date !== undefined) return date.unix();
}
function unserializeTime(dateString) {
	if (dateString !== undefined) return moment.unix(dateString);
}
function unserializeEvent(event) {
	if (event === undefined) return event;
	var ev = {};
	ev.launch_time = unserializeTime(event.launch_time);
	ev.close_time = unserializeTime(event.close_time);
	ev.name = event.name;
	ev.id = event.id;
	return ev;
}
function serializeEvent(event) {

	if (event === undefined) return event;
	var ev = {};
	ev.launch_time = serializeTime(event.launch_time);
	ev.close_time = serializeTime(event.close_time);
	ev.name = event.name;
	ev.id = event.id;
	return ev;
}

function EventSettings($resource, $timeout, $rootScope, MabelToken, $http) {
	
	var EventSettingsResource = $resource('/api/event/:id', {
		access_token: MabelToken,
		id: '@id'
	},
	{
		'_get': {
			method: 'GET',
			transformRequest: [serializeEvent].concat($http.defaults.transformRequest),
			transformResponse: $http.defaults.transformResponse.concat([unserializeEvent])
		},
		'save': {
			method: 'POST',
			transformRequest: [serializeEvent].concat($http.defaults.transformRequest),
			transformResponse: $http.defaults.transformResponse.concat([unserializeEvent])
		}
	}
	);

	EventSettingsResource.get = get;
	EventSettingsResource.prototype.delete = deleteIt;
	EventSettingsResource.prototype.save = save;

	return EventSettingsResource;

	function get(parameters, success, error) {
		return EventSettingsResource._get(parameters, function(value, responseHeaders) {

			// start watching so we can update the server
			var stopTimer;
			function compare(A, B) {
				return A.name === B.name &&
					((A.launch_time.isSame !== undefined && A.launch_time.isSame(B.launch_time, 'minutes')) ||
					(B.launch_time.isSame !== undefined && B.launch_time.isSame(A.launch_time, 'minutes')));
			}
			
			function getValue() {
				return value;
			}
			$rootScope.$watch(getValue, change(stopTimer, compare), true);

			// define non-enumerable properties so it doesn't show up in the DB
			Object.defineProperty(value, '_status', { value: '', enumerable: false, writable: true });
			Object.defineProperty(value, '_error', { value: '', enumerable: false, writable: true });

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
	function change(stopTimer, areEqual) {
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