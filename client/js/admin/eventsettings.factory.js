/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

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
}