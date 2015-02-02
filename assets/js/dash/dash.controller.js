angular.module('mabel.dash')
	.controller("DashController", DashController);

function DashController($scope, APICaller, User) {
	var vm = this;

	/*** DECLARATION ***/
	//TODO: stop exposing vm on every controller!
	// e = vm;

	// initialise scope vars 
	vm.ticketsAvailable = [];
	vm.ticketsBooked    = [];
	vm.donationTickets  = [];
	vm.transactions     = [];

	vm.saveTicket       = saveTicket;
	vm.cancelTicket     = cancelTicket;
	vm.clearStatus      = clearStatus;
	vm.cancelWaitingTicket = cancelWaitingTicket;

	/*** INITIAL ACTION ***/

	APICaller.get('ticket_type/available/1', function(err, data) {
		if (err) return console.log(err);
		// assign response to tickets array
		vm.ticketsAvailable = data;
	});

	var userPromise = User.current();
	userPromise.$promise.then(function(user) {
		
		APICaller.get('ticket/getByUser/' + userPromise.id, function(err, data) {
			if (err!==undefined && err!==null) return console.log(err);

			vm.ticketsBooked = data.real;

			// I kind of want data.extra to represent a general "meta-ticket",
			// but here I'm assuming exclusively donations - not very generalised.
			vm.donationTickets = data.extra;

			updateTotal();
		});

		APICaller.get('waiting_list', function(err, data) {
			if (err!==undefined && err!==null) return console.log(err);

			vm.waitingListTickets = data;
		});


		APICaller.get('transaction/getByUser/'+user.id, function(err, data) {
			if (err!==undefined && err!==null) return console.log(err);
			vm.transactions = data;
		});
	});
	

	/*** FUNCTION DEFINITIONS ***/

	function saveTicket(ticket) {
		ticket._status = "warning";
		// TODO: This kind of get/save/delete thing is literally what $resources are for
		APICaller.post('/ticket/' + ticket.id, ticket, function(err) {
				if (err!==undefined && err!==null) {
					ticket._status = "danger";
					alert(err);
					return console.log(err);
				}
				ticket._status = "success";
		});

	}

	function clearStatus(ticket) {
		ticket._status = "";
	}

	function cancelTicket(ticket) {
		if (window.confirm("Do you really want to cancel this ticket?")) { 
			APICaller.del('/ticket/' + ticket.id, function(err) {
				if (err!==undefined && err!==null) return console.log(err);
				
				for (var i=0; i<vm.ticketsBooked.length; i++) {
					if (vm.ticketsBooked[i] === ticket) {
						vm.ticketsBooked.splice(i, 1);
						break;
					}
				}

				updateTotal();
			});
			if (vm.donationTickets.length > 0) {
				// TODO: this is pretty hacky
				// delete one of the donation tickets 
				var toDelete = vm.donationTickets.pop();
				APICaller.del('/ticket/' + toDelete.id, function(err) {
					if (err && err!==null) return console.log(err);

					updateTotal();
				});
			}
		}
	}
	function cancelWaitingTicket(ticket) {

		if (window.confirm("Do you really want to leave the waiting list?")) { 
			APICaller.del('/waiting_list/' + ticket.id, function(err) {
				if (err!==undefined && err!==null) return console.log(err);
				
				for (var i=0; i<vm.waitingListTickets.length; i++) {
					if (vm.waitingListTickets[i] === ticket) {
						vm.waitingListTickets.splice(i, 1);
						break;
					}
				}
			});
		}
	}
	function updateTotal() {

		vm.totalValue = 0;
		for (var i = 0; i<vm.ticketsBooked.length; i++) {
			vm.totalValue += vm.ticketsBooked[i].price;
		}
		vm.donationValue = 0;
		for (i = 0; i<vm.donationTickets.length; i++) {
			vm.donationValue += vm.donationTickets[i].price;
		}
		vm.totalValue += vm.donationValue;

	}

	
}