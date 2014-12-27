angular.module('mabel.shared')
	.factory('MabelToken', function($cookies) {
		var token = $cookies.mabelAuthToken;
		if (token === null || token === undefined) {
			alert("Not logged in");
			return null;
		}
		return token;
	});