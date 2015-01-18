angular.module('mabel.booking')
	.controller("BookingController", BookingController);

// TODO Maybe: I feel like BookingController is trying to do too much, but maybe that doesn't matter
// e.g. the call to user/me should perhaps be the responsibility of some other controller
function BookingController($scope, APICaller, $interval) {
	var vm = this;

	/*** DECLARATION ***/

	// initialise scope vars 
	vm.user = {};
	vm.available_tickets = [];
	vm.payment_methods = [];
	vm.status = 'queueing';
	vm.queue = {
		position:-1,
		of:-1
	};
	vm.meta = {
		bookingSum: 0,
		ticketQuantity: 0,
	};
	vm.booking = {
		tickets: [],
		donate: true,
		payment_method: -1
	};
	// function on submission
	vm.submitBooking = submitBooking;

	// for storing the interval ID of the poller
	var poller;

	/*** INITIAL ACTION ***/

	// get user data to help the user feel comfortable
	APICaller.get("user/me", function(err, data) {
		if (err) console.log("err");

		vm.user = data;
	});

	// join the queue
	APICaller.get("booking/open/1", function(err, data) {
		if (err) console.log("err"); // error handling
		
		// set up polling at intervals
		poller = $interval(pollApi, 30000);
		processStatus(data);
	});	

	// we will watch for changes to the tickets array or donations boolean and update summaries when the array changes
	$scope.$watch(function() {
		return vm.booking.tickets;
	}, updateMeta, true); // the true argument causes 'deep' watching the array

	$scope.$watch(function() {
		return vm.booking.donate;
	}, updateMeta);

	/*** FUNCTION DEFINITIONS ***/

	function processStatus(status) {
		console.log(status);
		if (status.open) {
			// show the booking page and stuff
			console.log("Show booking page");

			// get available ticket types
			APICaller.get("ticket_type/1", function(err, available_tickets) {
				if (err) return console.log(err);

				vm.available_tickets = available_tickets;
				for (var i=0; i<available_tickets.length; i++) {
					// add each ticket, quantity 0 to vm.booking
					// this is possibly a stupid idea, gives lots of undefineds in array
					vm.booking.tickets.push({
						ticket_type_id: available_tickets[i].ticket_type_id,
						quantity: 0,
						price: available_tickets[i].price,
						name: available_tickets[i].name
					});
				}
			});

			// get available payment methods
			APICaller.get("payment_method", function(err, payment_method) {
				if (err) return console.log(err);

				vm.payment_methods = payment_method;
			});

			// don't need to keep polling now we're ready to book
			if (poller !== undefined) {
				$interval.cancel(poller);
			}
			vm.status = "booking";
		} else if (status.queueing) {
			// show the loading page
			console.log("Show loading page");
			vm.queue.position = status.position;
			vm.queue.of = status.of;
			vm.status = "queueing";

		} else {
			// show some kind of error message or rejoin the queue
			console.log("Not in the queue!");
			vm.status = "unavailable";
			vm.reason = status.reason;
		}
	}

	function updateMeta() {
		var bookingSum = 0;
		var ticketQuantity = 0;
		var tickets = vm.booking.tickets;
		if (tickets !== undefined) {
			for (var i = 0; i < tickets.length; i++) {
				bookingSum += parseInt(tickets[i].quantity) * tickets[i].price;
				ticketQuantity += tickets[i].quantity;

				if (vm.booking.donate === true) bookingSum += parseInt(tickets[i].quantity);
			}
		}
		vm.meta.bookingSum = bookingSum;
		vm.meta.ticketQuantity = ticketQuantity;
	}

	// booking submission method
	function submitBooking() {
		console.log("submit!");
		APICaller.post("booking/1", vm.booking, function(err, result) {
			if (err) return console.log(err); // error handling
			// if we have success, display confirmation with link to ticket management page

			// need to do more with booking stuff
			if (result.success) vm.status = "done";
		});
	}

	function pollApi() {

		console.log("Polling @ " + (new Date()));
		
		// POST to /booking/open/:event_id joins the queue if possible and not already queueing, gives status either way
		// TODO: parameterise event_id
		APICaller.get("booking/open/1", function(err, data) {
			if (err) console.log("err"); // error handling

			// stop polling if booking info returned
			processStatus(data);
		});
	}
}