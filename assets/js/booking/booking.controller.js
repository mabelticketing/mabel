angular.module('mabel.booking')
	.controller("BookingController", BookingController);

function BookingController($scope, APICaller) {
	/*
	 * Needs polishing. I'll tidy this up later.
	 * Hopefully has desired effects
	 * Currently doesn't submit.
	 */

	// stores page data
	$scope.data = {};
	$scope.booking = {
		sum: 0,
		tickets: [],
		donate: true
	};

	// method to poll api
	$scope.pollApi = function pollApi() {
		console.log("Polling @ " + (new Date()));
		APICaller.get("book", {event_id:1}, function(data) {
			// stop polling if booking info returned
			$scope.data = data;
			if (data.status === 'booking'){
				clearInterval(poller);
				console.log($scope.booking);
				for (var i=0; i<data.data.availableTickets.length; i++) {
					// add each ticket, quantity 0 to $scope.booking
					// this is possibly a stupid idea, gives lots of undefineds in array
					$scope.booking.tickets.push({
						ticket_type_id: data.data.availableTickets[i].ticket_type_id,
						quantity: 0,
						price: data.data.availableTickets[i].price,
						name: data.data.availableTickets[i].name
					});
				}
				console.log($scope.booking);
			}
		});
	};

	// i'm not sure this is the best way to achieve this
	$scope.sum = function sum() {
		var total = 0;
		for (var i=0; i<$scope.booking.tickets.length; i++) {
			total += parseInt($scope.booking.tickets[i].quantity) * $scope.booking.tickets[i].price;
			if ($scope.booking.donate === true) total += parseInt($scope.booking.tickets[i].quantity);
		}
		$scope.booking.sum = total;
	};

	// set up polling at intervals
	var poller = setInterval($scope.pollApi(), 30000);

	$scope.submitBooking = function submitBooking() {
		apiCaller.submit($scope.booking, function(err, result) {
			if (err) console.log("err"); // error handling
			// TODO: DO SOMETHING WITH RESULT
		});
	};


}