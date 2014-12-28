/* global moment */
angular.module('mabel.admin')
	.factory('EventSettings', EventSettings);

function EventSettings(MabelToken, MabelResource) {
	return MabelResource('/api/event/:id', 
		{
			access_token: MabelToken,
			id: '@id',
		}, 
		{}, // no custom actions for this resource
		{
			areEqual: areEqual,
			serialize: serialize,
			unserialize: unserialize
		}
	);

	function unserialize(event) {
		function unserializeTime(dateString) {
			if (dateString !== undefined) return moment.unix(dateString);
		}
		if (event === undefined) return event;
		var ev = angular.copy(event);
		ev.launch_time = unserializeTime(event.launch_time);
		ev.close_time = unserializeTime(event.close_time);
		return ev;
	}

	function serialize(event) {

		function serializeTime(date) {
			if (date !== undefined) return date.unix();
		}
		if (event === undefined) return event;
		var ev = angular.copy(event);
		ev.launch_time = serializeTime(event.launch_time);
		ev.close_time = serializeTime(event.close_time);
		return ev;
	}

	function areEqual(A, B) {
		return A.name === B.name &&
			A.launch_time.isSame(B.launch_time, 'minutes') &&
			A.close_time.isSame(B.close_time, 'minutes');
	}
}