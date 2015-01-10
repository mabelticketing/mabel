/* global moment */
angular.module('mabel.admin')
	.controller("UserListController", UserListController);

function UserListController(User) {
	var vm = this;

	vm.resource = User;
	vm.initialisor = function() {
		var u = new User();
		u.registration_time = moment();
		return u;
	};
	vm.columns = [
		{
			title: 'ID',
			name: 'id',
			sortable: 'id',
			filter: {id:'text'}
		}, {
			title: 'Name',
			name: 'name',
			type: 'text',
			sortable: 'name',
			filter: {name:'text'}
		}, {
			title: 'Email',
			name: 'email',
			type: 'text',
			sortable: 'email',
			filter: {email:'text'}
		}, {
			title: 'CRSID',
			name: 'crsid',
			type: 'text',
			sortable: 'crsid',
			filter: {crsid:'text'}
		}
	];
}