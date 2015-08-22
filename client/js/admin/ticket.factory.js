/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

/* global moment */
angular.module('mabel.admin')
	.factory('Ticket', Ticket);

function Ticket(MabelToken, MabelResource) {
	return MabelResource('/api/ticket/:id', 
		{
			access_token: MabelToken,
			id: '@id'
		}, 
		{
			// add a custom action to retrieve a summary of tickets sold
			'summary': {
				method: 'GET',
				url: '/api/ticket/summary',
				isArray: true,
				mabelSerialize: true
			},
			'summary_byuser': {
				method: 'GET',
				url: '/api/ticket/summary/byuser',
				isArray: true,
				mabelSerialize: true
			}
		},
		{
			serialize: serialize,
			unserialize: unserialize
		}
	);

	function unserialize(ticket) {

		// time will always be a timestamp for transport, but we want a moment object
		function unserializeTime(dateString) {
			if (dateString !== undefined) return moment.unix(dateString);
		}
		
		if (ticket === undefined) return ticket;
		
		// we make a copy rather than modifying directly because otherwise
		// unserializing time will trigger the watch on ticket
		var _ticket = angular.copy(ticket);
		_ticket.book_time = unserializeTime(_ticket.book_time);
		
		return _ticket;
	}

	function serialize(ticket) {

		// time must always be a timestamp for transport, but we have a moment object
		function serializeTime(date) {
			if (date !== undefined) return date.unix();
		}

		if (ticket === undefined) return ticket;

		// we make a copy rather than modifying directly because otherwise
		// serializing time will trigger the watch on ticket
		var _ticket = angular.copy(ticket);
		_ticket.book_time = serializeTime(ticket.book_time);

		return _ticket;
	}

}