/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

angular.module('mabel.shared')
	.factory('Ticket', ticketResource);

function ticketResource($resource, MabelToken) {
	return $resource('/api/ticket/:id',  {
		access_token: MabelToken.token
	}, {
		'get': {
			method: 'GET'
		},
		'save': {
			method: 'POST'
		},
		'query': {
			url: '/api/ticket',
			method: 'GET',
			isArray: true
		},
		'delete': {
			url: '/api/ticket',
			method: 'DELETE',
			isArray: true
		},
		'update': {
			method: 'PUT'
		}
	});
}
