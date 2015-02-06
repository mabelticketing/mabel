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