angular.module('mabel.shared')
	.directive('mabelTable', MabelTable);

function MabelTable(ngTableParams, $rootScope) {
	return {
		restrict: 'AE',
		templateUrl: '/views/admin/boxes/mabeltable',
		scope: {
			initialisor: '=',
			Resource: '=resource',
			columns: '=',
			clickEvent: '@',
			filename: '@',
			query: '@',
			readOnly: '@readonly'
		},
		link: function($scope, element) {
			var vm = $scope;

			if (vm.initialisor !== undefined) {
				vm.newItem = vm.initialisor();
				vm.newItem.defineMeta();
			}

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

					var query = "query";
					if (vm.query !== undefined) query = vm.query;

					vm.Resource[query]({
						from: (pageNumber - 1) * pageSize,
						size: pageSize,
						order: sorting,
						filter: filter
					}, function(data) {
						if (data.length > 0) {
							params.total(data[0].$count);
							$defer.resolve(data);
						} else {
							params.total(0);
							$defer.resolve([]);
						}
					});
				}
			});

			vm.getFilename = function() {
				var name = vm.filename || 'data-export';
				var d = new Date();
				var time = d.toLocaleString();
				time = time.replace(/[^a-zA-Z0-9 -_():]/g,'-');
				return name + " " + time;
			};

			vm.showTip = function(id) {
				console.log('show .badge-' + id);
				element.find('.badge-' + id).tooltip('show');
			};
			vm.hideTip = function(id) {
				console.log('hide .badge-' + id);
				element.find('.badge-' + id).tooltip('hide');
			};

			if ($scope.clickEvent !== undefined) {
				vm.selectItem = function(item) {
					$rootScope.$emit($scope.clickEvent, item);
				};
			}
			vm.submitNew = function() {
				var promise = vm.newItem.save();

				promise.then(function() {
					// reset the new item for next entry
					vm.newItem = vm.initialisor();
					vm.newItem.defineMeta();
					vm.tableParams.reload();
					vm.newItem._status = "success";
					vm.newItem._error = "Successfully added new item.";
				});
			};
			vm.startEdit = function(item) {
				item.$edit = true;
				item.$backup = angular.copy(item);
			};
			vm.saveEdit = function(item) {
				var promise = item.save();
				var original = item.$backup;

				promise.then(function() {
					delete item.$backup;
					item.$edit = false;
				}, function() {
					// the response in this case will have reset the item
					item.$backup = original;
				});
			};
			vm.cancelEdit = function(item) {
				if (item.$backup !== undefined) {
					var backup = item.$backup;
					delete item.$backup;
					angular.copy(backup, item);
				}
				item.$edit = false;
			};
			vm.save = function(item) {
				item.save();
			};
			vm.delete = function(item) {
				item.$delete(function() {
					vm.tableParams.reload();
				}, function(result) {
					item._status = "error";
					item._error = result.data;
				});
			};
		}
	};
}