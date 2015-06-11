angular.module('mabel.shared')
	.factory('MabelToken', function($cookies) {
		var token = $cookies.mabelAuthToken;
		if (token === null || token === undefined) {
			alert("Please log in before proceeding.");
			window.location = "/login/raven";
			return null;
		}
		return token;
	});