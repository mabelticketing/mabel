angular.module('mabel.admin')
	.controller("TicketController", TicketController);

function TicketController(Ticket) {
	var vm = this;
	vm.resource = Ticket;
	vm.initialisor = function() {
		return new Ticket();
	};
	vm.clickEvent = 'mabel.ticket.selected';
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
			title: 'Guest Name',
			name: 'guest_name',
			type: 'text',
			sortable: 'guest_name',
			filter: {guest_name:'text'}
		}, {
			title: 'Status ID',
			name: 'status_id',
			type: 'text',
			sortable: 'status_id',
			filter: {status_id:'text'}
		}, {
			title: 'Booking Time',
			name: 'book_time',
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