/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

angular.module('mabel.admin')
	.controller("UserTicketSummaryController", UserTicketSummaryController);

function UserTicketSummaryController(Ticket) {
	var vm = this;
	vm.resource = Ticket;
	vm.columns = [
		{
			title: 'User ID',
			name: 'user_id',
			sortable: 'user_id',
			filter: {user_id:'text'}
		}, {
			title: 'User Name',
			name: 'name',
			sortable: 'name',
			filter: {name:'text'}
		}, {
			title: 'Ticket IDs',
			name: 'tickets',
			sortable: 'tickets',
			filter: {tickets:'text'}
		}
	];
}