/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

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
	vm.clickEvent = 'mabel.userList.userSelected';
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
			title: 'Registration Time',
			name: 'registration_time',
			type: 'date',
			sortable: 'registration_time',
			filter: {registration_time:'text'}
		}, {
			title: 'CRSID',
			name: 'crsid',
			type: 'text',
			sortable: 'crsid',
			filter: {crsid:'text'}
		}
	];
}