/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

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
			title: 'Status',
			name: 'status',
			type: 'text',
			sortable: 'status',
			filter: {status:'text'}
		}, {
			title: 'Notes',
			name: 'notes',
			type: 'text'
		}, {
			title: 'Booking Time',
			name: 'book_time',
			type: 'date',
			sortable: 'book_time'
		}, {
			title: 'Payment Method ID',
			name: 'payment_method_id',
			sortable: 'payment_method_id',
			filter: {payment_method_id:'text'}
		}, {
			title: 'Donation',
			type: 'boolean',
			name: 'donation',
			sortable: 'donation',
			filter: {donation:'text'}
		}, {
			title: 'Ticket Value',
			name: 'transaction_value',
			sortable: 'transaction_value',
			filter: {transaction_value:'text'}
		}
	];
}