/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

/* globals app */
app.factory('Type', typeResource);

function typeResource($resource) {
	return $resource('/api/type/:id', {}, {
		'get': {
			method: 'GET'
		},
		'save': {
			method: 'POST'
		},
		'query': {
			url: '/api/types',
			method: 'GET',
			isArray: true
		},
		'update': {
			method: 'PUT'
		},
		'delete': { method: 'DELETE' }
	});
}
