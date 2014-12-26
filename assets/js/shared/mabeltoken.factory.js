angular.module('mabel.shared')
	.factory('MabelToken', function($cookies) {
		return $cookies.mabelAuthToken;
	});