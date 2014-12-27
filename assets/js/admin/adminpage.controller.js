
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

	if (MabelToken !== null) {
		vm.user = User.current(function(data) {
			// success
			vm.pageStatus = (data.groups.indexOf(1) < 0 ? 
								pageStatus.unauthorised : pageStatus.authorised);

		}, function(err) {
			// error
			vm.pageStatus = pageStatus.unauthorised;
			console.log(err);
		});
	} else {
		vm.pageStatus = pageStatus.logged_out;
	}
}