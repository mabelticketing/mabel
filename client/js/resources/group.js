/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

angular.module('mabel.shared')
	.factory('Group', groupResource);

function groupResource($resource, MabelToken) {
	return $resource('/api/group/:id',  {
		access_token: MabelToken.token
	}, {
		'get': {
			method: 'GET'
		},
		'save': {
			method: 'POST'
		},
		'query': {
			url: '/api/groups',
			method: 'GET',
			isArray: true
		},
		'update': {
			method: 'PUT'
		},
		'delete': { method: 'DELETE' }
	});
}
