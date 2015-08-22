/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

angular.module('mabel.admin')
	.controller("TicketTypeDetailController", TicketTypeDetailController);

function TicketTypeDetailController(TicketType, UserGroup, $scope, $rootScope) {
	var vm = this;
	vm.allGroups = UserGroup.query();
	// populateWithType(new TicketType());

	var unbindGroupWatch;
	var unbind = $rootScope.$on('mabel.ticketType.typeSelected', function(e, type){
		if (unbindGroupWatch !== undefined) unbindGroupWatch();

		populateWithType(TicketType.get({id:type.id}));
	});

	$scope.$on('$destroy', function() {
		unbind();
		unbindGroupWatch();
	});

	vm.resetStatus = function() {
		// TODO: We shouldn't have to check for this - _status should be set on creation
		if (vm.type._status !== undefined) {
			vm.type._status = "";
		}
	};

	function populateWithType(type) {
		vm.type = type;
		type.$promise.then(function() {

			// we need an object with properties to bind to group checkboxes
			Object.defineProperty(type, "groups_obj", {
				enumerable:false,
				value: {},
				writable:true
			});

			for (var i=0; i<type.groups.length; i++) {
				type.groups_obj[type.groups[i]] = true;
			}

			unbindGroupWatch = $rootScope.$watchCollection(function() {
				if (type === undefined || type.groups_obj === undefined) return null;
				return type.groups_obj;
			}, function(newValue, oldValue) {
				if (newValue === oldValue) return;
				type.groups = [];
				for (var id in newValue) {
					if (newValue[id] === true) {
						type.groups.push(id);
					}
				}
			});

		});
	}
}
