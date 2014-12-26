angular.module('mabel.admin')
	.factory('User', User);

function User($resource, $timeout, $rootScope, MabelToken) {

	var UserResource = $resource('/api/user/:id', {
		access_token: MabelToken,
		id: '@id'
	});

	return {
		query: query
	};

	function query(params, callback) {
		params = params || {};

		var users = UserResource.query(params, function() {
			callback(users);

			// start watching every item so we can update the server
			for (var i = 0; i < users.length; i++) {
				var stopTimer;
				$rootScope.$watch(getUser(i), userChange, true);
			}
			callback(users);

			function userChange(user, old) {
				// I'm only interested in saving on actual changes
				if (old === user) return;
				// need to check individual properties too because the above just checks object references
				if (false) return;

				if (stopTimer !== undefined) $timeout.cancel(stopTimer);

				// only update server periodically else we'll make too many calls
				stopTimer = $timeout(function() {
					user.$save();
				}, 500);
			}

			function getUser(i) {
				return function() {
					return users[i];
				};
			}
		});
		return users;
	}
}

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