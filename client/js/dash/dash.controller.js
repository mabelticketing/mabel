/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

// TODO: use resources instead of APICaller - you should be able to delete apicaller

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
	vm.changedTickets   = [];

	vm.totalValue     = 0;
	vm.confirmedValue = 0;
	vm.pendingValue   = 0;

	vm.waitingListLoading      = true;
	vm.ticketsBookedLoading    = true;
	// vm.transactionsLoading     = true;
	// vm.ticketsAvailableLoading = true;

	vm.cancelTicket        = cancelTicket;
	vm.cancelWaitingTicket = cancelWaitingTicket;
	// vm.saveTicket          = saveTicket;
	// vm.saveTickets         = saveTickets;
	// vm.setChanged          = setChanged;
	vm.nameChange = nameChange;
	// vm.clearStatus         = clearStatus;

	vm.saveBtnClass = "primary";

	/*** INITIAL ACTION ***/

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

		APICaller.get('user/' + user.id + '/allowance', function(err, data) {
			if (err !== undefined && err !== null) return console.log(err);
			console.log(data);

			// TODO: when endpoint is finished, populate the box at the top of the dashboard.

		});


	});
	

	/*** FUNCTION DEFINITIONS ***/

	function nameChange(ticket) {
		if(ticket.guest_name && typeof ticket.guest_name === 'string' && ticket.guest_name.length > 0) {

			APICaller.put('user/' + vm.user.id + '/ticket/' + ticket.id, {
				"guest_name": ticket.guest_name
			}, function(err) {
				if (err !== undefined && err !== null) {
					return console.log(err);
				}

				// else we got here and the name was changed

			});
		}
	}

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
		vm.totalValue = 0;
		vm.pendingValue = 0;
		vm.confirmedValue = 0;
		for (var i = 0; i<vm.ticketsBooked.length; i++) {
			if (vm.ticketsBooked[i].status === 'PENDING') {
				vm.pendingValue += vm.ticketsBooked[i].transaction_value;
			} else if (vm.ticketsBooked[i].status === 'CONFIRMED' || vm.ticketsBooked[i].status === 'ADMITTED') {
				vm.confirmedValue += vm.ticketsBooked[i].transaction_value;
			}
			vm.totalValue += vm.ticketsBooked[i].transaction_value;
		}
		vm.billingLoading = false;
	}
}
