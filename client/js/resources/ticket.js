/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

/* globals app */
app.factory('Ticket', ticketResource);

function ticketResource($resource) {
	return $resource('/api/ticket/:id', {}, {
		'get': {
			method: 'GET'
		},
		'save': {
			method: 'POST'
		},
		'query': {
			url: '/api/tickets',
			method: 'GET',
			isArray: true
		},
		'exterminate': {
			url: '/api/tickets',
			method: 'DELETE',
			isArray: true
		},
		'update': {
			method: 'PUT'
		}
	});
}
