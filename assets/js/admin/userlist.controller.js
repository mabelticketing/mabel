
angular.module('mabel.admin')
	.controller("UserListController", UserListController);


function UserListController(APICaller, ngTableParams) {
	var vm = this;
	var data = [{name: "Moroni", email:'cl554@cam.ac.uk', id: 50},
				{name: "Tiancum", email:'cl554@cam.ac.uk', id: 43},
				{name: "Jacob", email:'cl554@cam.ac.uk', id: 27},
				{name: "Nephi", email:'cl554@cam.ac.uk', id: 29},
				{name: "Enos", email:'cl554@cam.ac.uk', id: 34},
				{name: "Tiancum", email:'cl554@cam.ac.uk', id: 43},
				{name: "Jacob", email:'cl554@cam.ac.uk', id: 27},
				{name: "Nephi", email:'cl554@cam.ac.uk', id: 29},
				{name: "Enos", email:'cl554@cam.ac.uk', id: 34},
				{name: "Tiancum", email:'cl554@cam.ac.uk', id: 43},
				{name: "Jacob", email:'cl554@cam.ac.uk', id: 27},
				{name: "Nephi", email:'cl554@cam.ac.uk', id: 29},
				{name: "Enos", email:'cl554@cam.ac.uk', id: 34},
				{name: "Tiancum", email:'cl554@cam.ac.uk', id: 43},
				{name: "Jacob", email:'cl554@cam.ac.uk', id: 27},
				{name: "Nephi", email:'cl554@cam.ac.uk', id: 29},
				{name: "Enos", email:'cl554@cam.ac.uk', id: 34}];

	vm.tableParams = new ngTableParams({
		page: 1,            // show first page
		count: 10,           // count per page
		sorting: {
			id:'asc'
		}
	}, {
		total: data.length, // length of data
		getData: function($defer, params) {
			$defer.resolve(data.slice((params.page() - 1) * params.count(), params.page() * params.count()));
		}
	});
}