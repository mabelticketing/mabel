angular.module('mabel.admin')
	.controller("WaitingListSummaryController", WaitingListSummaryController);

function WaitingListSummaryController(Ticket) {
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
		}
	];
}