/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

angular.module('mabel.shared')
	.directive('mabelTable', MabelTable);

function MabelTable(NgTableParams, $rootScope) {
	return {
		restrict: 'AE',
		templateUrl: '/admin/boxes/mabeltable',
		scope: {
			initialisor: '=',
			Resource: '=resource',
			columns: '=',
			clickEvent: '=',
			filename: '@',
			query: '@',
			readOnly: '@readonly'
		},
		link: function($scope, element) {
			var vm = $scope;

			if (vm.initialisor !== undefined) {
				vm.newItem = vm.initialisor();

				defineMeta(vm.newItem);
			}

			vm.tableParams = new NgTableParams({
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
							return $defer.resolve(data);
						} else {
							params.total(0);
							return $defer.resolve([]);
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

			if (vm.clickEvent !== undefined) {
				vm.selectItem = function(item) {
					$rootScope.$emit($scope.clickEvent, item);
				};
			}
			vm.submitNew = function() {
				var promise = saveResource(vm.newItem);

				promise.then(function() {
					// reset the new item for next entry
					vm.newItem = vm.initialisor();
					defineMeta(vm.newItem);
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
				var promise = updateResource(item);
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
			vm.save = updateResource;
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

function defineMeta(obj) {
	Object.defineProperty(obj, '_status', {
		value: '',
		enumerable: false,
		writable: true
	});
	Object.defineProperty(obj, '$edit', {
		value: '',
		enumerable: false,
		writable: true
	});
	Object.defineProperty(obj, '$count', {
		value: '',
		enumerable: false,
		writable: true
	});
	Object.defineProperty(obj, '$backup', {
		value: '',
		enumerable: false,
		writable: true
	});
	Object.defineProperty(obj, '_error', {
		value: '',
		enumerable: false,
		writable: true
	});
}

function updateResource(resource) {

	if (!resource.hasOwnProperty('_status')) {
		// this object doesn't have '_status' set yet for some reason
		// (probably it was created via new Resource() rather than
		// through .get() or .query())
		defineMeta(resource);
	}

	var promise = resource.$update({id: resource.id});
	promise.then(function() {
		resource._status = "success";
		resource._error = "";
	}, function(response) {
		resource._status = "error";
		resource._error = response.data;
		console.log(response.data);
	});
	return promise;
}
function saveResource(resource) {

	if (!resource.hasOwnProperty('_status')) {
		// this object doesn't have '_status' set yet for some reason
		// (probably it was created via new Resource() rather than
		// through .get() or .query())
		defineMeta(resource);
	}

	var promise = resource.$save.apply(resource, arguments);
	promise.then(function() {
		resource._status = "success";
		resource._error = "";
	}, function(response) {
		resource._status = "error";
		resource._error = response.data;
		console.log(response.data);
	});
	return promise;
}