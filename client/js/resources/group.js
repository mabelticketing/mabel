/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

/* globals app */
app.factory('Group', groupResource);

function groupResource($resource) {
	return $resource('/api/group/:id', {}, {
		'get': {
			method: 'GET'
		},
		'save': {
			method: 'POST'
		},
		'query': {
			method: 'GET',
			isArray:true
		},
		'update': {
			method: 'PUT'
		},
		'delete': { method: 'DELETE' }
	});
}
