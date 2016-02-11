/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

/* global moment */
/* global _ */
angular.module('mabel.dash')
	.controller("DashController", DashController);

function DashController($scope, $timeout, APICaller, User) {
	var vm = this;
	e=vm;


	/*** DECLARATION ***/

	// display dots when loading (maybe could be more consistent than this)
	vm.user = {name: "..."};

	// initialise scope vars
	vm.ticketsAvailable = [];
	vm.ticketsBooked    = [];
	vm.waitingListTickets = [];
	vm.changedTickets   = [];

	vm.totalValue     = 0;
	vm.confirmedValue = 0;
	vm.pendingValue   = 0;

	vm.waitingListLoading      = true;
	vm.ticketsBookedLoading    = true;
	vm.billingLoading          = true;
	vm.ticketsAvailableLoading = true;

	vm.cancelTicket        = cancelTicket;
	vm.cancelWaitingTicket = cancelWaitingTicket;
	
	vm.nameChange = nameChange;
	
	vm.ticketAccessList = [];
	vm.overallAllowance = 0;
	vm.remainingAllowance = 0;
	vm.nowTime = (new Date()).getTime();
	vm.greaterThan = greaterThan;


	/*** INITIAL ACTION ***/

	vm.user = User.current();
	// initialise properties
	vm.user.init();
	vm.user.$promise.then(function() {

		// tickets

		vm.user.tickets().get().$promise.then(function(tickets) {
			
			// sort tickets associated with user
			for (var i=0; i<tickets.length; i++) {
				if (tickets[i].status === 'PENDING_WL') {
					vm.waitingListTickets.push(tickets[i]);
				} else if (tickets[i].status === 'CANCELLED' ||
					tickets[i].status === 'CANCELLED_WL' ||
					tickets[i].status === 'INVALID') {
					continue;
				} else {
					vm.ticketsBooked.push(tickets[i]);
				}
			}
			vm.ticketsBooked = _.sortBy(vm.ticketsBooked, 'id');
			vm.waitingListTickets = _.sortBy(vm.waitingListTickets, 'id');

			vm.ticketsBookedLoading = false;
			vm.waitingListLoading = false;

			updateTotal();

		}, function(err) {
			console.log(err);
		});

		// allowance

		vm.user.allowance.get().$promise.then(function(allowance) {
			// how many tickets are left for the user to purchase
			vm.remainingAllowance = allowance.remaining_allowance;
			vm.overallAllowance = allowance.overall_allowance;

			// add formatted times to result
			vm.ticketAccessList = _.forEach(allowance.access, function(v) {
				v['opening'] = moment(v.open_time*1000).format('MMM Do [at] hh:mm');
				v['closing'] = moment(v.close_time*1000).format('MMM Do [at] hh:mm');
			});

			vm.ticketsAvailableLoading = false;
		}, function(err) {
			console.log(err);
		});


	});
	

	/*** FUNCTION DEFINITIONS ***/

	function nameChange(ticket) {
		ticket.guest_name_status = "";
		// check if non-empty string
		if(ticket.guest_name && typeof ticket.guest_name === 'string' && ticket.guest_name.length > 0) {
			
			if (nameChange.timeout !== undefined) $timeout.cancel(nameChange.timeout);

			nameChange.timeout = $timeout(function() {
				vm.user.ticket(ticket.id).update({
					guest_name: ticket.guest_name
				}).$promise.then(function() {
					ticket.guest_name_status = "submitted";
				}, function(err) {
					ticket.guest_name_status = "error";
				});
			}, 500);
		} else {
			ticket.guest_name_status = "error";
		}
	}

	function cancelTicket(ticket) {
		if (window.confirm("Do you really want to cancel this ticket?")) {

			vm.user.ticket(ticket.id).delete().$promise.then(function() {
				for (var i=0; i<vm.ticketsBooked.length; i++) {
					if (vm.ticketsBooked[i] === ticket) {
						// removes deleted ticket from array
						vm.ticketsBooked.splice(i, 1);
						break;
					}
				}
				updateTotal();

			}, function(err) {
				console.log(err);
			});

		}
	}

	function cancelWaitingTicket(ticket) {
		if (window.confirm("Do you really want to leave the waiting list?")) {

			vm.user.ticket(ticket.id).delete().$promise.then(function() {
				for (var i=0; i<vm.waitingListTickets.length; i++) {
					if (vm.waitingListTickets[i] === ticket) {
						// removes deleted ticket from array
						vm.waitingListTickets.splice(i, 1);
						break;
					}
				}
			}, function(err) {
				console.log(err);
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

	function greaterThan(prop, val){
	    return function(item){
	      return item[prop] > val;
	    };
	}

}
