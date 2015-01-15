angular.module('mabel.admin')
	.controller("UserDetailController", UserDetailController);

function UserDetailController(User, UserGroup, $scope, $rootScope) {
	var vm = this;
	vm.allGroups = UserGroup.query();
	populateWithUser(User.current());

	var unbindGroupWatch;
	var unbind = $rootScope.$on('mabel.userList.userSelected', function(e, user){
		if (unbindGroupWatch !== undefined) unbindGroupWatch();

		populateWithUser(User.get({id:user.id}));
	});

	$scope.$on('$destroy', function() {
		unbind();
		unbindGroupWatch();
	});

	vm.resetStatus = function() {
		// TODO: We shouldn't have to check for this - _status should be set on creation
		if (vm.user._status !== undefined) {
			vm.user._status = "";
		}
	};

	function populateWithUser(user) {
		vm.user = user;
		user.$promise.then(function() {

			// we need an object with properties to bind to group checkboxes
			Object.defineProperty(user, "groups_obj", {
				enumerable:false,
				value: {},
				writable:true
			});

			for (var i=0; i<user.groups.length; i++) {
				user.groups_obj[user.groups[i]] = true;
			}

			unbindGroupWatch = $rootScope.$watchCollection(function() {
				if (user === undefined || user.groups_obj === undefined) return null;
				return user.groups_obj;
			}, function(newValue, oldValue) {
				if (newValue === oldValue) return;
				user.groups = [];
				for (var id in newValue) {
					if (newValue[id] === true) {
						user.groups.push(id);
					}
				}
			});

		});
	}
}
