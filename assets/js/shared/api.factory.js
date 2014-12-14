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
		post: post,
		poll: poll
	};

	function poll(callback) {
		var token = $cookies.mabelAuthToken;
		if (token) {
			$http.get('/api/book?event_id=1&access_token='+token)
				.success(function(data) {
					callback(null, data);
				})
				.error(function(err) {
					callback(err);
				});
		} else console.log("error: no auth token found"); // TODO: deal with this better
	}
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
	function post(method, data, callback, error) {
		data = data || {};
		data.access_token = token;
		call({method:'post', url:apiRoot + method, data:data}, callback, error);
	}
}