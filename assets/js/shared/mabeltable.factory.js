angular.module('mabel.shared')
	.directive('mabelTable', MabelTable);

function MabelTable(ngTableParams, $rootScope) {
	var headerTemplate = "<script id=\"sample_ng_header\" type=\"text/ng-template\"> \
  <tr> \
    <th> </th> \
    <th ng-repeat=\"column in columns\" ng-class=\"{ 'sortable': column.sortable, 'sort-asc': tableParams.isSortBy(column.sortable, 'asc'), 'sort-desc': tableParams.isSortBy(column.sortable, 'desc') }\" ng-click=\"tableParams.sorting(column.sortable, tableParams.isSortBy(column.sortable, 'asc') ? 'desc' : 'asc')\" class=\"header\">{{column.title}}</th> \
    <th>Actions </th> \
  </tr> \
  <tr ng-show=\"show_filter\" class=\"ng-table-filters\"> \
    <th></th> \
    <th ng-repeat=\"column in columns\" class=\"filter\"> \
      <div ng-repeat=\"(name, filter) in column.filter\"> \
        <input type=\"text\" name=\"{{name}}\" ng-model=\"tableParams.filter()[name]\" ng-if=\"filter==='text'\" class=\"input-filter form-control\"/> \
      </div> \
    </th> \
  </tr> \
</script>";
	return {
		restrict: 'AE',
		templateUrl: '/views/admin/boxes/mabeltable',
		scope: {
			initialisor: '=',
			Resource: '=resource',
			columns: '=',
			clickEvent: '='
		},
		link: function($scope, element) {
			var vm = $scope;

			vm.headerTemplate = headerTemplate;
			evm = vm;

			vm.showTip = function(id) {
				element.find('.badge-' + id).tooltip('show');
			};
			vm.hideTip = function(id) {
				element.find('.badge-' + id).tooltip('hide');
			};

			if ($scope.clickEvent !== undefined) {
				vm.selectItem = function(item) {
					console.log("Dispatching event", $scope.clickEvent);
					$rootScope.$emit($scope.clickEvent, item);
				};
			}

			vm.newItem = vm.initialisor();
			vm.newItem.defineMeta();
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

					vm.Resource.query({
						from: (pageNumber - 1) * pageSize,
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
	};
}