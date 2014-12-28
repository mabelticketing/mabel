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

		// time will always be a timestamp for transport, but we want a moment object
		function unserializeTime(dateString) {
			if (dateString !== undefined) return moment.unix(dateString);
		}
		
		if (event === undefined) return event;
		
		// we make a copy rather than modifying directly because otherwise
		// unserializing time will trigger the watch on the event
		var ev = angular.copy(event);
		ev.launch_time = unserializeTime(event.launch_time);
		ev.close_time = unserializeTime(event.close_time);

		return ev;
	}

	function serialize(event) {

		// time must always be a timestamp for transport, but we have a moment object
		function serializeTime(date) {
			if (date !== undefined) return date.unix();
		}

		if (event === undefined) return event;
		
		// we make a copy rather than modifying directly because otherwise
		// serializing time will trigger the watch on user
		var ev = angular.copy(event);
		ev.launch_time = serializeTime(event.launch_time);
		ev.close_time = serializeTime(event.close_time);

		return ev;
	}

	function areEqual(A, B) {
		return A.name === B.name &&
			// consider two times equivalent if they're within a minute of
			// each other.
			// we can't use === because they might be different
			// objects representing the same time
			A.launch_time.isSame(B.launch_time, 'minutes') &&
			A.close_time.isSame(B.close_time, 'minutes');
	}
}