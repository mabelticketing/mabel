angular.module('mabel.admin')
	.controller("TransactionController", TransactionController);

function TransactionController(Transaction) {
	var vm = this;
	vm.resource = Transaction;
	vm.initialisor = function() {
		return new Transaction();
	};
	vm.clickEvent = 'mabel.transaction.selected';
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
			title: 'Value',
			name: 'value',
			type: 'text',
			sortable: 'value',
			filter: {value:'text'}
		}, {
			title: 'Notes',
			name: 'notes',
			type: 'text',
			sortable: 'notes',
			filter: {notes:'text'}
		}, {
			title: 'Payment Method ID',
			name: 'payment_method_id',
			type: 'text',
			sortable: 'payment_method_id',
			filter: {payment_method_id:'text'}
		}, {
			title: 'Time Processed',
			name: 'transaction_time',
			sortable: 'transaction_time'
		}	];
}