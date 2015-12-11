/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

angular.module('mabel.shared')
	.factory('User', userResource);

function userResource($resource, MabelToken) {
	var User = $resource('/api/user/:id', {
		access_token: MabelToken.token
	}, {
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
		},
		
		// add a custom action to retrieve the current user
		'current': {
			method: 'GET',
			url: '/api/user/' + MabelToken.id,
			mabelSerialize: true
		}
	});

	User.prototype.init = function() {
		this.$promise.then(function(u) {
			var subpaths = ['allowance', 'payment-method', 'type'];

			for (var i=0; i<subpaths.length; i++) {
				var path = subpaths[i];
				u[path] = $resource('/api/user/:id/' + path, { access_token: MabelToken.token, id: u.id });
			}
		});
	};

	User.prototype.tickets = function() {
		return $resource('/api/user/:id/tickets', { id: this.id,  access_token: MabelToken.token }, {
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

	// User.prototype.tickets = function() {
	// 	return $resource('/api/user/:id/allowance', { id: this.id, access_token: MabelToken.token }, {
	// 		'get': {
	// 			method: 'GET'
	// 		}
	// 	});
	// };

	return User;
}
