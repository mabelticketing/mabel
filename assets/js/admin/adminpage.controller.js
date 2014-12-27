
angular.module('mabel.admin')
	.controller("AdminPageController", AdminPageController);


function AdminPageController(MabelToken, APICaller) {
	var pageStatus = {
		loading: 0,
		logged_out: 1,
		unauthorised: 2,
		authorised: 3
	};

	var vm = this;
	vm.user = {name:"Loading...", id:-1};
	vm.pageStatus = pageStatus.loading;

	if (MabelToken !== null) {
		APICaller.get('user/me', {}, function(err, data) {
			if (err) {
				vm.pageStatus = pageStatus.unauthorised;
				vm.user = {};
				return console.log(err);
			}
			vm.user = data;
			vm.pageStatus = (data.groups.indexOf(1) < 0 ? 
								pageStatus.unauthorised : pageStatus.authorised);
		});
	} else {
		vm.user = {};
		vm.pageStatus = pageStatus.logged_out;
	}

	adminPage = this;
}