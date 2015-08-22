angular.module('mabel.admin')
	.controller("WaitingListController", WaitingListController);

function WaitingListController(WaitingList, APICaller) {
	var vm = this;
	vm.resource = WaitingList;
	vm.initialisor = function() {
		return new WaitingList();
	};
	vm.clickEvent = 'mabel.waitinglist.selected';
	// TODO: Get more readable columns than all these IDs
	vm.columns = [{
		title: 'ID',
		name: 'id',
		sortable: 'id',
		filter: {
			id: 'text'
		}
	}, {
		title: 'User ID',
		name: 'user_id',
		type: 'text',
		sortable: 'user_id',
		filter: {
			user_id: 'text'
		}
	}, {
		title: 'Ticket Type ID',
		name: 'ticket_type_id',
		type: 'text',
		sortable: 'ticket_type_id',
		filter: {
			ticket_type_id: 'text'
		}
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
		filter: {
			payment_method_id: 'text'
		}
	}];

	vm.transferAll = function() {
		APICaller.post("ticket/process_waiting_list", function(err, data) {
			if (err) return console.log(err); // error handling
			console.log(data);
			var ticketsNum = 0;
			for (var i in data.tickets) {
				ticketsNum += data.tickets[i].length;
			}
			if (data.success && ticketsNum > 0) {
				alert(ticketsNum + " tickets were transferred from the waiting list (some may be donations). Payment is due " + data.payment_deadline + ".");
			} else if (data.success) {
				alert("No tickets were transferred from the waiting list.");
			} else {
				alert("An unexpected error occurred. :(");
			}
		});

	};
}