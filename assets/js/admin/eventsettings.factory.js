/* global moment */
angular.module('mabel.admin')
	.factory('EventSettings', EventSettings);

function EventSettings($resource, $timeout, $rootScope, MabelToken) {
	
	var Settings = $resource('/api/event/:id', {
		access_token: MabelToken,
		id: '@id'
	});

	return {
		get: get
	};

	function get(obj, callbacks) {
		var successCallback = callbacks.success || function() {};
		var loadingCallback = callbacks.loading || function() {};
		var errorCallback = callbacks.error || function() {};

		var settings = Settings.get(obj, function() {
			// start watching so we can update the server
			var stopTimer;

			settings.launch_time = moment(settings.launch_time);
			settings.modification_stop_time = moment(settings.modification_stop_time);

			$rootScope.$watch(function() {
				return settings;
			}, function(newV, old) {
				// I'm only interested in saving on actual changes
				if (old === newV) return;
				// need to check individual properties too because the above just checks object references
				if (old.name === newV.name &&
					((old.launch_time.isSame !== undefined && old.launch_time.isSame(newV.launch_time, 'minutes')) ||
					(newV.launch_time.isSame !== undefined && newV.launch_time.isSame(old.launch_time, 'minutes'))) 
					) return;

				if (stopTimer !== undefined) $timeout.cancel(stopTimer);
				// only update server periodically else we'll make too many calls
				stopTimer = $timeout(function() {
					loadingCallback();
					settings.$save(successCallback, errorCallback);
				}, 500);
			}, true);

		});
		return settings;
	}
}