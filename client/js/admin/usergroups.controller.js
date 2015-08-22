/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

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