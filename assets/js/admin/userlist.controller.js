angular.module('mabel.admin')
	.controller("UserListController", UserListController);

function UserListController(User, ngTableParams) {
	var vm = this;
	vm.newUser = new User();
	vm.showTip = function(id) {
		$('#badge-' + id).tooltip('show');
	};
	vm.hideTip = function(id) {
		$('#badge-' + id).tooltip('hide');
	};
	vm.submitNew = function(id) {
		vm.newUser.saveWithStatus(function(user) {
			vm.newUser = new User();
			vm.tableParams.reload();
			vm.newUser._status = "success";
			vm.newUser._error = "Successfully added " + user.name;
		});
	};

	userList = vm;
	vm.tableParams = new ngTableParams({
		page: 1, // show first page
		count: 5, // count per page
		sorting: {
			id: 'asc'
		}
	}, {
		total: 0, // length of data
		getData: function($defer, params) {
			var pageNumber = params.page();
			var pageSize = params.count();
			var filter = params.filter();
  			var sorting = params.sorting();

			User.query({
				from: (pageNumber-1) * pageSize,
				size: pageSize,
				order: sorting,
				filter: filter
			}, function(data) {
				if (data.length > 0) {
					params.total(data[0].count);
					$defer.resolve(data);
				} else {
					params.total(0);
					$defer.resolve([]);
				}
				$('[data-toggle="tooltip"]').tooltip();
				
			});
		}
	});
}