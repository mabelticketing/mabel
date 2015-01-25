angular.module('mabel.dash')
	.controller("DashController", DashController);

function DashController($scope, APICaller, User) {
	var vm = this;

	/*** DECLARATION ***/
	//TODO: stop exposing vm on every controller!
	//e = vm;

	// initialise scope vars 
	vm.ticketsAvailable = [];
	vm.ticketsBooked = [];
	console.log(User.current());
	/*** INITIAL ACTION ***/

	APICaller.get('ticket_type/available/1', function(err, data) {
		if (err) return console.log(err);
		// assign response to tickets array
		vm.ticketsAvailable = data;
	});

	var userPromise = User.current();
	userPromise.$promise.then(function(user) {
		APICaller.get('ticket/getByUser/' + user.id, function(err, data) {
			if (err) return console.log(err);
			vm.ticketsBooked = data;
			console.log(data);
		})
	});
	

	/*** FUNCTION DEFINITIONS ***/


	
}