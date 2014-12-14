angular.module('mabel.shared')
	.factory('APICaller', APICaller);

function APICaller($http, $cookies) {
	var apiRoot = '/api/';
	var token = $cookies.mabelAuthToken;
	if (!token) {
		console.error("No auth token found!"); // TODO: scream louder than this
		return {};
	}

	return {
		get: get,
		post: post
	};

	function call(config, callback, error) {
		$http(config)
			.success(function(data) {
				if (data.error && error) return error(data.error);
				callback(data);
			})
			.error(function(err) {
				// TODO: handle some API errors centrally?
				if (error) return error(err);
			});
	}
	function get(method, data, callback, error) {
		data = data || {};
		data.access_token = token;
		call({method:'get', url:apiRoot + method, params:data}, callback, error);
	}
	function post(method, params, data, callback, error) {
		params = params || {};
		data = data || {};
		params.access_token = token;
		call({method:'post', url:apiRoot + method, params:params, data:data}, callback, error);
	}
}