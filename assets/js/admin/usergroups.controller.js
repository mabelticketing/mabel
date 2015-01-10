angular.module('mabel.admin')
	.controller("UserGroupsController", UserGroupsController);

function UserGroupsController(UserGroup, ngTableParams) {
	var vm = this;
	vm.newGroup = new UserGroup();
	vm.newGroup.defineMeta();
	vm.showTip = function(id) {
		$('#usergroup-badge-' + id).tooltip('show');
	};
	vm.hideTip = function(id) {
		$('#usergroup-badge-' + id).tooltip('hide');
	};
	vm.submitNew = function() {
		var promise = vm.newGroup.save();

		promise.then(function(group) {
			// reset the new group for next entry
			vm.newGroup = new UserGroup();
			vm.newGroup.defineMeta();
			vm.tableParams.reload();
			vm.newGroup._status = "success";
			vm.newGroup._error = "Successfully added " + group.name;
		});
	};
	vm.save = function(group) {
		group.save();
	};
	vm.delete = function(group) {
		group.$delete(function(){
			vm.tableParams.reload();
		}, function(result) {
			group._status = "error";
			group._error = result.data;
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

			UserGroup.query({
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