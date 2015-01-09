/* global moment */
angular.module('mabel.admin')
	.controller("UserListController", UserListController);

function UserListController(User, ngTableParams, $rootScope) {
	var vm = this;
	vm.newUser = new User();
	vm.newUser.registration_time = moment();
	vm.selectUser = function(user) {
		$rootScope.$emit('mabel.userList.userSelected', user);
	};
	vm.showTip = function(id) {
		$('#badge-' + id).tooltip('show');
	};
	vm.hideTip = function(id) {
		$('#badge-' + id).tooltip('hide');
	};
	vm.submitNew = function() {
		var promise = vm.newUser.save();

		promise.then(function(user) {
			// reset the new user for next entry
			vm.newUser = new User();
			vm.newUser.registration_time = moment();
			vm.tableParams.reload();
			vm.newUser._status = "success";
			vm.newUser._error = "Successfully added " + user.name;
		});
	};
	vm.save = function(user) {
		user.save();
	};
	vm.delete = function(user) {
		user.$delete(function(){
			vm.tableParams.reload();
		}, function(result) {
			user._status = "error";
			user._error = result.data;
		});
	};

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

  			// clear previous watches
  			for (var i=0; i<params.data.length; i++) {
  				if (params.data[i].clearWatch !== undefined) params.data[i].clearWatch();
  			}

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