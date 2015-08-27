/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

/* globals app */
app.factory('PaymentMethod', paymentMethodResource);

function paymentMethodResource($resource) {
	return $resource('/api/payment_method/:id', {}, {
		'get': {
			method: 'GET'
		},
		'query': {
			url: '/api/payment_method',
			method: 'GET',
			isArray: true
		},
	});
}
