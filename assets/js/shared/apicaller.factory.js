angular.module('mabel.shared')
	.factory('APICaller', APICaller);

function APICaller($http, $cookies) {
	var apiRoot = '/api/';
	var token = $cookies.mabelAuthToken;
	if (token === undefined || token === null || token.length < 1) {
		console.error("No auth token found!"); // TODO: scream louder than this
		// break the call function
		call = function(method, resource, params, data, callback) {
			callback("Can't call without auth token!");
		};
	}
	
	return {
		get: get,
		put: put,
		post: post,
		hasToken: !(token === undefined || token === null || token.length < 1) 
	};
	
	function call(method, resource, params, data, callback) {
		data = data || {};
		params = params || {};
		params.access_token = token;
		var config = {
			method: method,
			url: apiRoot + resource,
			params: params,
			data: data
		};
		$http(config)
			.success(function(data) {
				if (data.error && callback) return callback(data.error);
				callback(null, data);
			})
			.error(function(err) {
				// TODO: handle some API errors centrally?
				if (callback) return callback(err);
			});
	}

	function get(resource, data, callback) {
		call('get', resource, data, {}, callback);
	}

	function put(resource, params, data, callback) {
		call('put', resource, params, data, callback);
	}

	function post(resource, params, data, callback) {
		call('post', resource, params, data, callback);
	}
}