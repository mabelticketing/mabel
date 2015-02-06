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