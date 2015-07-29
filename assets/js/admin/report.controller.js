/* global _ */
angular.module('mabel.admin')
	.controller("ReportController", ReportController);

function ReportController($scope, APICaller) {
	var vm = this;
	vm.tableNames = [];
	vm.joins = []
	vm.tables = [];
	vm.schemata = [];
	vm.cols = [];
	vm.pageSize = 10;
	vm.pageNum = 0
	vm.csv = ""
	r = vm;

	APICaller.get("schema", {},
		function(err, data) {
			if (err) return alert("ERROR " + err);
			vm.tableNames = data;
		});
	vm.updateData = function() {
		var cols = vm.cols.map(function(c) {
			return c.table + "." + c.Field;
		});
		APICaller.get("schema/data", {
				from: vm.pageNum * vm.pageSize,
				size: vm.pageSize,
				columns: JSON.stringify(cols),
				tables: JSON.stringify(vm.tables),
				joins: JSON.stringify(vm.joins)
			},
			function(err, data) {
				if (err) return alert("ERROR " + err);
				console.log(data);
				vm.data = data.data;
				vm.dataSize = data.size;
			});

	}
	vm.rmCol = function(col) {
		vm.cols.splice(vm.cols.indexOf(col), 1);
	}
	vm.joinOn = function(col) {
		// TODO: Something more elegant than prompt
		var t = prompt("Which table would you like to join with? (" + vm.tableNames.join(", ") + ")");
		if (vm.tables.indexOf(t) >= 0) return alert("That table is already displayed!");
		if (vm.tableNames.indexOf(t) < 0) return alert("That table doesn't exist!");


		if (vm.schemata[t] === undefined) {
			// load schema
			APICaller.get("schema/" + t, {},
				function(err, data) {
					if (err) return alert("ERROR " + err);
					data.forEach(function(d) {
						d.table = t;
					})
					vm.schemata[t] = data;
					getField();
				});
		} else {
			getField();
		}

		function getField() {
			var fields = vm.schemata[t]
			var s_fields = fields.map(function(a) {
				return a.Field
			});
			var f = prompt("Which of the fields from '" + t + "' would you like to join '" + col.Field + "' onto? (" + s_fields.join(",") + ")");
			if (s_fields.indexOf(f) < 0) return alert("That field doesn't exist!");

			vm.tables.push(t);
			vm.joins.push({
				left: col.table + "." + col.Field,
				right: t + "." + f
			})
			for (var i = 0; i < fields.length; i++) {
				if (fields[i].Field !== f) {
					vm.cols.push(fields[i]);
				}
			}
			vm.updateData();
		}
	}
	vm.table = function(table) {
		vm.tables.push(table);
		vm.pageNum = 0
		if (vm.schemata[table] === undefined) {
			APICaller.get("schema/" + table, {},
				function(err, data) {
					if (err) return alert("ERROR " + err);
					data.forEach(function(d) {
						d.table = table;
					})
					vm.schemata[table] = data;
					vm.cols = data;
				});
		}
		vm.updateData();
	}
	vm.clearCSV = function() {
		vm.csv = "";
	}
	vm.getCSV = function() {

		// enclose a string in quotes so the comma is escaped.
		// also replace any quote-marks with escaped versions.
		function esc(s) {
			return "\"" + (""+s).replace(/"/g,"\\\"") + "\""
		}

		var cols = vm.cols.map(function(c) {
			return c.table + "." + c.Field;
		});

		// first get all data, regardless of page limits
		APICaller.get("schema/data", {
				columns: JSON.stringify(cols),
				tables: JSON.stringify(vm.tables),
				joins: JSON.stringify(vm.joins)
			},
			function(err, data) {
				if (err) return alert("ERROR " + err);
				data = data.data;
				var csv = "";
				for (var i = -1; i<data.length; i++) {
					var sep = "";
					for (var j = 0; j<vm.cols.length; j++) {
						// prepare the first row according to schema
						if (i<0) {
							csv += sep + esc(vm.cols[j].Field);
						} else {
							csv += sep + esc(data[i][vm.cols[j].table + "_" + vm.cols[j].Field]);
						}
						sep = ",";
					}
					csv += "\n";
				}
				console.log(csv);
				var a         = document.createElement('a');
				a.href        = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
				a.target      = '_blank';
				d = new Date();
				a.download    = r.tables.join("-") + "_" + d.getDate() + "-" + d.getMonth() + '.csv';

				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
			});
	}
	vm.updatePage = function(a) {
		vm.pageNum = Math.ceil(a);
		vm.updateData();
	}
	vm.alert = function(a) {
		alert(a);
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