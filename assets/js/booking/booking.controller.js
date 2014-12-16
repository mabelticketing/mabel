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
	$scope.meta = {
		bookingSum: 0,
		ticketQuantity: 0,
	};
	$scope.booking = {
		tickets: [],
		donate: true,
		payment_method: 0
	};

	// method to poll api
	$scope.pollApi = function pollApi() {

		console.log("Polling @ " + (new Date()));
		
		APICaller.get("book", {event_id:1}, function(err, data) {
			if (err) console.log("err"); // error handling
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

	// set up polling at intervals
	var poller = setInterval($scope.pollApi(), 30000);

	// booking submission method
	$scope.submitBooking = function submitBooking() {
		APICaller.submit($scope.booking, function(err, result) {
			if (err) console.log("err"); // error handling
			// TODO: DO SOMETHING WITH RESULT
		});
	};

	// update meta information method
	$scope.updateMeta = function updateMeta() {
		var bookingSum = 0;
		var ticketQuantity = 0;
		var tickets = $scope.booking.tickets;
		for (var i=0; i<tickets.length; i++) {
			bookingSum += parseInt(tickets[i].quantity) * tickets[i].price;
			ticketQuantity += tickets[i].quantity;
			if ($scope.booking.donate === true) bookingSum += parseInt(tickets[i].quantity);
		}
		$scope.meta.bookingSum = bookingSum;
		$scope.meta.ticketQuantity = ticketQuantity;
	};

	// TODO: delete this method
	$scope.help = function help() { console.log($scope.meta); };


}