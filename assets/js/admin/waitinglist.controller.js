angular.module('mabel.admin')
	.controller("WaitingListController", WaitingListController);

function WaitingListController(WaitingList) {
	var vm = this;
	vm.resource = WaitingList;
	vm.initialisor = function() {
		return new WaitingList();
	};
	vm.clickEvent = 'mabel.waitinglist.selected';
	// TODO: Get more readable columns than all these IDs
	vm.columns = [
		{
			title: 'ID',
			name: 'id',
			sortable: 'id',
			filter: {id:'text'}
		}, {
			title: 'User ID',
			name: 'user_id',
			type: 'text',
			sortable: 'user_id',
			filter: {user_id:'text'}
		}, {
			title: 'Ticket Type ID',
			name: 'ticket_type_id',
			type: 'text',
			sortable: 'ticket_type_id',
			filter: {ticket_type_id:'text'}
		}, {
			title: 'Booking Time',
			name: 'book_time',
			type: 'date',
			sortable: 'book_time'
		}, {
			title: 'Payment Method ID',
			name: 'payment_method_id',
			type: 'text',
			sortable: 'payment_method_id',
			filter: {payment_method_id:'text'}
		}
	];
}