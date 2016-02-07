/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

angular.module('mabel.shared')
	.factory('MabelToken', function($cookies) {
		var token = $cookies.get("mabelAuthToken");
		var id = $cookies.get("mabelUserId");

		if (token === null || token === undefined) {
			alert("Please log in before proceeding.");
			window.location = "/";
			return null;
		}
		return {
			token: token,
			id: id
		};
	});