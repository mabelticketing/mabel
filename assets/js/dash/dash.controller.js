angular.module('mabel.dash')
	.controller("DashController", DashController);

function DashController($scope, APICaller, User) {
	var vm = this;

	/*** DECLARATION ***/
	//TODO: stop exposing vm on every controller!
	e = vm;

	// initialise scope vars 
	vm.ticketsAvailable = [];
	vm.ticketsBooked    = [];
	vm.transactions     = [];

	vm.saveTicket = saveTicket;
	vm.cancelTicket = cancelTicket;

	/*** INITIAL ACTION ***/

	APICaller.get('ticket_type/available/1', function(err, data) {
		if (err) return console.log(err);
		// assign response to tickets array
		vm.ticketsAvailable = data;
	});

	var userPromise = User.current();
	userPromise.$promise.then(function(user) {
		
		APICaller.get('ticket/getByUser/'+user.id, function(err, data) {
			if (err) return console.log(err);

			vm.totalValue = 0;

			for (var i = 0; i<data.real.length; i++) {
				vm.totalValue += data.real[i].price;
			}
			vm.ticketsBooked = data.real;

			// I kind of want data.extra to represent a general "meta-ticket",
			// but here I'm assuming exclusively donations - not very generalised.

			vm.donationValue = 0;
			for (i = 0; i<data.extra.length; i++) {
				vm.donationValue += data.extra[i].price;
			}
			vm.totalValue += vm.donationValue;
		});


		APICaller.get('transaction/getByUser/'+user.id, function(err, data) {
			if (err) return console.log(err);
			vm.transactions = data;
		});
	});
	

	/*** FUNCTION DEFINITIONS ***/

	function saveTicket(ticket_id) {

	}

	function cancelTicket(ticket_id) {
		if (window.confirm("Do you really want to cancel this ticket?")) { 
			console.log("Sorry, can't do that just yet");
		}
	}

	
}