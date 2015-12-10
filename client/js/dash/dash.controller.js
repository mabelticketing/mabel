/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

angular.module('mabel.dash')
	.controller("DashController", DashController);

function DashController($scope, APICaller, User) {
	var vm = this;

	/*** DECLARATION ***/

	// display dots when loading
	vm.user = {name: "..."};

	// initialise scope vars
	vm.ticketsAvailable = [];
	vm.ticketsBooked    = [];
	vm.waitingListTickets = [];
	// vm.donationTickets  = [];
	// vm.transactions     = [];
	// vm.changedTickets   = [];

	// vm.totalValue        = 0;
	// vm.totalTransactions = 0;

	vm.waitingListLoading      = true;
	vm.ticketsBookedLoading    = true;
	// vm.transactionsLoading     = true;
	// vm.ticketsAvailableLoading = true;

	vm.cancelTicket        = cancelTicket;
	vm.cancelWaitingTicket = cancelWaitingTicket;
	// vm.saveTicket          = saveTicket;
	// vm.saveTickets         = saveTickets;
	// vm.setChanged          = setChanged;
	// vm.clearStatus         = clearStatus;

	vm.saveBtnClass = "primary";

	/*** INITIAL ACTION ***/

	// TODO: do we need to show available tickets?
	// APICaller.get('type', function(err, data) {
	// 	if (err) return console.log(err);
	// 	// assign response to tickets array
	// 	vm.ticketsAvailable = data;
	// 	vm.ticketsAvailableLoading = false;
	// });

	var userPromise = User.current();
	userPromise.$promise.then(function(user) {
		
		vm.user = user;
		
		APICaller.get('user/' + user.id + '/ticket', function(err, data) {
			if (err !== undefined && err !== null) return console.log(err);
			console.log(data);

			// sort tickets associated with user
			for (var i=0; i<data.length; i++) {
				if (data[i].status === 'PENDING_WL') {
					vm.waitingListTickets.push(data[i]);
				} else if (data[i].status === 'CANCELLED'
					|| data[i].status === 'CANCELLED_WL'
					|| data[i].status === 'INVALID') {
					continue;
				} else {
					vm.ticketsBooked.push(data[i]);
				}
			}

			vm.ticketsBookedLoading = false;
			vm.waitingListLoading = false;

			updateTotal();
		});

	});
	

	/*** FUNCTION DEFINITIONS ***/

	// function saveTicket(ticket) {
	// 	ticket._status = "warning";
	// 	// TODO: This kind of get/save/delete thing is literally what $resources are for
	// 	APICaller.post('ticket/' + ticket.id, ticket, function(err) {
	// 			if (err!==undefined && err!==null) {
	// 				ticket._status = "danger";
	// 				alert(err);
	// 				return console.log(err);
	// 			}
	// 			ticket._status = "success";
	// 	});

	// }

	// function setChanged(ticket) {
	// 	if (vm.changedTickets.indexOf(ticket) < 0) 
	// 		vm.changedTickets.push(ticket);
	// }

	// function saveTickets() {
	// 	vm.saveBtnClass = "warning";
		
	// 	APICaller.post('ticket/multi/', vm.changedTickets, function(err) {
	// 			if (err!==undefined && err!==null) {
	// 				vm.saveBtnClass = "danger";
	// 				alert(err);
	// 				return console.log(err);
	// 			}
	// 			alert("Thank you, your changes have been saved.");
	// 			vm.saveBtnClass = "success";
	// 	});
	// }

	// function clearStatus(ticket) {
	// 	ticket._status = "";
	// }

	function cancelTicket(ticket) {
		if (window.confirm("Do you really want to cancel this ticket?")) { 
			APICaller.del('user/' + vm.user.id + '/ticket/' + ticket.id, function(err) {
				if (err!==undefined && err!==null) return console.log(err);
				
				for (var i=0; i<vm.ticketsBooked.length; i++) {
					if (vm.ticketsBooked[i] === ticket) {
						// removes deleted ticket from array
						vm.ticketsBooked.splice(i, 1);
						break;
					}
				}
				updateTotal();
			});
		}
	}

	function cancelWaitingTicket(ticket) {
		if (window.confirm("Do you really want to leave the waiting list?")) {
			APICaller.del('user/' + vm.user.id + '/ticket/' + ticket.id, function(err) {
				if (err!==undefined && err!==null) return console.log(err);
				
				for (var i=0; i<vm.waitingListTickets.length; i++) {
					if (vm.waitingListTickets[i] === ticket) {
						// removes deleted ticket from array
						vm.waitingListTickets.splice(i, 1);
						break;
					}
				}

			});
		}
	}

	function updateTotal() {
		// updates total ticket price

		vm.totalValue = 0;
		for (var i = 0; i<vm.ticketsBooked.length; i++) {
			vm.totalValue += vm.ticketsBooked[i].transaction_value;
		}

	}

	
}