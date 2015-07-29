/* global _ */
angular.module('mabel.admin')
	.controller("ReportController", ReportController);

function ReportController($scope, APICaller, $modal) {
	var vm = this;
	var t = {
		tables: [],
		joins: [],
		cols: [],
		filters: [],
		pageSize: 10
	}
	vm.pageNum = 1;
	vm.tableNames = [];
	vm.schemata = {};
	vm.t = t;
	r = vm;

	APICaller.get("schema", {},
		function(err, data) {
			if (err) return alert("ERROR " + err);
			vm.tableNames = data;
		});

	function fieldify(col) {
		return col.table + "." + col.Field;
	}
	vm.fieldify = fieldify;
	vm.updateData = function updateData() {
		console.log(r.pageNum);
		// TODO: just send over t, and let the server unpick it
		APICaller.get("schema/data", {
				from: (vm.pageNum - 1) * t.pageSize,
				size: t.pageSize,
				columns: JSON.stringify(t.cols.map(fieldify)),
				tables: JSON.stringify(t.tables),
				joins: JSON.stringify(t.joins),
				filters: JSON.stringify(t.filters)
			},
			function(err, data) {
				if (err) return alert("ERROR " + err);
				console.log(data);
				vm.data = data.data;
				vm.dataSize = data.size;
			});

	}
	vm.rmCol = function(col) {
		t.cols.splice(t.cols.indexOf(col), 1);
	}

	vm.filter = function(col) {
		// TODO: Other filters as well as equals (e.g. <, <>)
		// TODO (maybe): "OR" filters (currently it's a big conjunction)
		var q = prompt("What would you like to search for the value of '" + col.Field + "'?")
		t.filters.push({
			field: fieldify(col),
			precise: true, // TODO: make this imprecise for text fields
			value: q // TODO: parseNumber for numeric fields
		})
		vm.updateData();
	}
	vm.lookUpSchema = function(table, callback) {
		if (callback === undefined) callback = function(){};
		if (vm.schemata[table] === undefined) {
			APICaller.get("schema/" + table, {},
				function(err, data) {
					if (err) return alert("ERROR " + err);
					data.forEach(function(d) {
						d.table = table;
					})
					vm.schemata[table] = data;
					callback(data);
				});
		} else {
			callback(vm.schemata[table])
		}
	}
	vm.init = function(table) {
		t.tables.push(table);
		vm.pageNum = 1
		// TODO (maybe): preload all schemata instead of on-demand?
		vm.lookUpSchema(table, function(d) {
			t.cols = d;
			vm.updateData();
		})
		
	}
	vm.getCSV = function() {

		// enclose a string in quotes so the comma is escaped.
		// also replace any quote-marks with escaped versions.
		function esc(s) {
			return "\"" + ("" + s).replace(/"/g, "\\\"") + "\""
		}

		// first get all data, regardless of page limits
		APICaller.get("schema/data", {
				columns: JSON.stringify(t.cols.map(fieldify)),
				tables: JSON.stringify(t.tables),
				joins: JSON.stringify(t.joins)
			},
			function(err, data) {
				if (err) return alert("ERROR " + err);
				data = data.data;
				var csv = "";
				for (var i = -1; i < data.length; i++) {
					var sep = "";
					for (var j = 0; j < t.cols.length; j++) {
						// prepare the first row according to schema
						if (i < 0) {
							csv += sep + esc(t.cols[j].Field);
						} else {
							csv += sep + esc(data[i][t.cols[j].table + "_" + t.cols[j].Field]);
						}
						sep = ",";
					}
					csv += "\n";
				}

				var d = new Date();
				var a = document.createElement('a');
				a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
				a.target = '_blank';
				a.download = t.tables.join("-") + "_" + d.getDate() + "-" + d.getMonth() + '.csv';

				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
			});
	}
	vm.saveTable = function() {
		alert("This doesn't work yet, but I've console.log'd the table description.")
		// TODO: reduce t down further
		// 	e.g. remove unneccessary bits of 'col'
		// 	e.g. perhaps shrink property names (too far?)
		console.log(JSON.stringify(t));
	}
	vm.updatePage = function(a) {
		vm.pageNum = Math.ceil(a);
		vm.updateData();
	}
	vm.alert = function(a) {
		alert(a);
	}
	vm.showJoin = function(col) {

		var modalInstance = $modal.open({
			templateUrl: 'join.html',
			controller: 'JoinModalController',
			size: "sm",
			resolve: {
				tables: function () {
					return vm.tableNames;
				}, 
				schemata: function () {
					return vm.schemata;
				}, 
				lookUpSchema: function () {
					return vm.lookUpSchema;
				},
				data: function() {
					return col;
				}
			}
		});

		modalInstance.result.then(function (r) {
			var field = r.field;

			t.tables.push(field.table);
			t.joins.push({
				left: fieldify(col),
				right: fieldify(field)
			});

			vm.lookUpSchema(field.table, function(fields) {
				for (var i = 0; i < fields.length; i++) {
					if (fields[i] !== field) {
						t.cols.push(fields[i]);
					}
				}
				vm.updateData();
			});
		}, function (err) {
			// do something with dismissal?
		});
	}
}

angular.module('mabel.admin').filter('floor', function() {
	return Math.floor
});
angular.module('mabel.admin').filter('ceil', function() {
	return Math.ceil
});
angular.module('mabel.admin').filter('min', function() {
	return function(a) {
		return Math.min.apply(null, a);
	}
});


angular.module('mabel.admin').controller('JoinModalController', function($scope, $modalInstance, tables, schemata, lookUpSchema, data) {
	$scope.result = {};
	$scope.tables = tables;
	$scope.schemata = schemata;
	$scope.lookUpSchema = lookUpSchema;
	$scope.data = data;

	$scope.ok = function() {
		$modalInstance.close($scope.result);
	};

	$scope.cancel = function() {
		$modalInstance.dismiss('cancel');
	};
});