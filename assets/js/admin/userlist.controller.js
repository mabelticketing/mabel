angular.module('mabel.admin')
	.controller("UserListController", UserListController);

function UserListController(User, ngTableParams) {
	var vm = this;

	vm.tableParams = new ngTableParams({
		page: 1, // show first page
		count: 2, // count per page
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
			});
		}
	});
}