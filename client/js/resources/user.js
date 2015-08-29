/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

/* globals app */
app.factory('user', userResource);

function userResource($resource) {
	var User = $resource('/api/user/:id', {}, {
		'get': {
			method: 'GET'
		},
		'save': {
			method: 'POST'
		},
		'query': {
			url: '/api/users',
			method: 'GET',
			isArray: true
		},
		'update': {
			method: 'PUT'
		},
		'delete': {
			method: 'DELETE'
		}
	});

	// I think I'm chris
	var subpaths = ['allowance', 'payment_methods', 'types'];
	var subpath_fn = function(path) {
		return function() {
			return $resource('/api/user/:id/' + path, { id: this.id }, {
				'get': {
					method: 'GET',
					isArray: true
				}
			});
		}
	};

	for (var i=0; i<subpaths.length; i++) {
		User.prototype[subpaths[i]] = subpath_fn(subpaths[i]);
	}

	User.prototype.tickets = function() {
		return $resource('/api/user/:id/tickets', { id: this.id }, {
			'get': {
				method: 'GET',
				isArray: true
			},
			'save': {
				url: '/api/user/:id/tickets',
				method: 'POST'
			}
		});
	};

	return User;
}
