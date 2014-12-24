
angular.module('mabel.admin')
	.controller("AdminPageController", AdminPageController);

function AdminPageController(APICaller) {
	var vm = this;
	vm.user = {name:"Loading...", id:-1};
	vm.isAdmin = false;

	APICaller.get('user/me', {}, function(err, data) {
		if (err) return;
		vm.user = data;
		vm.isAdmin = !(data.groups.indexOf(1) < 0);
	});

	adminPage = this;
}