angular.module('mabel.admin')
	.controller("TicketTypesController", TicketTypesController);

function TicketTypesController(TicketType) {
	var vm = this;
	vm.resource = TicketType;
	vm.initialisor = function() {
		return new TicketType();
	};
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
			filter: {description:'text'}
		}, {
			title: 'Price',
			name: 'price',
			type: 'text',
			sortable: 'price',
			filter: {name:'text'}
		}, {
			title: 'Ticket Limit',
			name: 'ticket_limit',
			type: 'text',
			sortable: 'ticket_limit',
			filter: {name:'text'}
		}
	];
}