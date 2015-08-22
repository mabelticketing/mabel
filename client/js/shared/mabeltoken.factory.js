/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

angular.module('mabel.shared')
	.factory('MabelToken', function($cookies) {
		var token = $cookies.mabelAuthToken;
		if (token === null || token === undefined) {
			alert("Please log in before proceeding.");
			window.location = "/login/raven";
			return null;
		}
		authToken = token;
		return token;
	});