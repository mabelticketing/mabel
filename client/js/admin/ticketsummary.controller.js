/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

angular.module('mabel.admin')
	.controller("TicketSummaryController", TicketSummaryController);

function TicketSummaryController(Ticket) {
	var vm = this;
	vm.resource = Ticket;
	vm.columns = [
		{
			title: 'Type ID',
			name: 'id',
			sortable: 'id',
			filter: {id:'text'}
		}, {
			title: 'Type Name',
			name: 'name',
			sortable: 'name',
			filter: {name:'text'}
		}, {
			title: 'Sold',
			name: 'sold',
			sortable: 'sold',
			filter: {sold:'text'}
		}, {
			title: 'Available',
			name: 'available',
			sortable: 'available',
			filter: {available:'text'}
		}
	];
}