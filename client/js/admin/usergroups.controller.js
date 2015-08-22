angular.module('mabel.admin')
	.controller("UserGroupsController", UserGroupsController);

function UserGroupsController(UserGroup) {
	var vm = this;
	vm.resource = UserGroup;
	vm.initialisor = function() {
		return new UserGroup();
	};
	vm.columns = [
		{
			title: 'ID',
			name: 'id',
			sortable: 'id',
			filter: {id:'text'}
		}, {
			title: 'Description',
			name: 'description',
			type: 'text',
			sortable: 'description',
			filter: {description:'text'}
		}, {
			title: 'Name',
			name: 'name',
			type: 'text',
			sortable: 'name',
			filter: {name:'text'}
		}
	];
}