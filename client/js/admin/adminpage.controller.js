/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

angular.module('mabel.admin')
	.controller("AdminPageController", AdminPageController);

function AdminPageController(MabelToken, User) {
	var pageStatus = {
		loading: 0,
		logged_out: 1,
		unauthorised: 2,
		authorised: 3
	};

	var vm = this;
	vm.pageStatus = pageStatus.loading;
	vm.alert = function(thing){
		console.log(thing);
	};

	if (MabelToken !== null) {
		vm.user = User.current(function() {
			console.log("success");
		}, function() {
			console.log("fail");
		});
		var promise = vm.user.$promise;

		promise.then(
			function(data) {
				// success
				vm.pageStatus = (data.groups.indexOf(1) < 0 ? 
									pageStatus.unauthorised : pageStatus.authorised);

			},
			function(err) {
				// error
				vm.pageStatus = pageStatus.unauthorised;
				console.log(err);
			}
		);
	} else {
		vm.pageStatus = pageStatus.logged_out;
	}
}