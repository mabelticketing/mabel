/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

angular.module('mabel.shared')
	.factory('PaymentMethod', PaymentMethod);

function PaymentMethod($resource, MabelToken) {
	return $resource('/api/payment-method/:id', {
		access_token: MabelToken.token
	}, {
		'get': {
			method: 'GET'
		},
		'query': {
			url: '/api/payment-method',
			method: 'GET',
			isArray: true
		},
	});
}
