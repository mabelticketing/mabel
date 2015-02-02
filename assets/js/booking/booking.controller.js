angular.module('mabel.booking')
	.controller("BookingController", BookingController);

// TODO Maybe: I feel like BookingController is trying to do too much, but maybe that doesn't matter
// e.g. the call to user/me should perhaps be the responsibility of some other controller
function BookingController($scope, APICaller, User, $interval) {
	var vm = this;

	e = vm;

	/*** DECLARATION ***/
	// initialise scope vars 
	vm.user = User.current();
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
		ticketAllowance: 0
	};
	vm.booking = {
		tickets: [],
		donate: true
	};
	// function on submission
	vm.submitBooking = submitBooking;

	// result of booking (for confirmation)
	vm.ticketResult = {};

	// for storing the interval ID of the poller
	var poller;

	/*** INITIAL ACTION ***/


	// join the queue
	// TODO: Parameterise event id
	APICaller.get("booking/open/1", function(err, data) {
		if (err) return console.log(err); // error handling
		
		// set up polling at intervals
		poller = $interval(pollApi, 30000);
		processStatus(data);

	});	



	/*** FUNCTION DEFINITIONS ***/

	function resizeArray(array, size, default_obj) {
		if (array.length > size) {
			return array.slice(0, size);
		} 
		if (array.length < size) {
			var arr = array.slice(0);
			var obj = arr[0] || default_obj;
			for (var i=array.length; i<size; i++) {
				arr[i] = angular.copy(obj);
			}
			return arr;
		}
		return array;
	}

	function processStatus(status) {
		console.log(status);
		if (status.open) {
			// show the booking page and stuff

			// get available ticket types
			// TODO: parameterise event id
			APICaller.get("ticket_type/available/1", function(err, available_tickets) {
				if (err) return console.log(err);

				// get the user's ticket allowance
				APICaller.get("user/ticket_allowance", function(err, data) {
					if (err) return console.log(err);
					if (data[0].allowance < 1) return;

					vm.meta.ticketAllowance = data[0].allowance;
					// generate an empty array to get ng-repeat to work (it only works for arrays, not up to a range)
					// get available payment methods
					APICaller.get("payment_method", function(err, payment_method) {
						if (err) return console.log(err);

						vm.payment_methods = payment_method;
								
						vm.available_tickets = available_tickets;
						for (var i=0; i<available_tickets.length; i++) {
							// add each ticket, quantity 0 to vm.booking
							// this is possibly a stupid idea, gives lots of undefineds in array
							vm.booking.tickets.push({
								ticket_type_id: available_tickets[i].id,
								max_tickets: new Array(Math.min(vm.meta.ticketAllowance, available_tickets[i].ticket_limit, 20)),
								quantity: 0,
								price: available_tickets[i].price,
								name: available_tickets[i].name,
								payment_methods: []
							});
						}

						// we will watch for changes to the tickets array or donations boolean and update summaries when the array changes
						$scope.$watch(function() {
							return vm.booking.tickets;
						}, updateMeta, true); // the true argument causes 'deep' watching the array

						$scope.$watch(function() {
							return vm.booking.donate;
						}, updateMeta);
					});
				});
			});

			// don't need to keep polling now we're ready to book
			if (poller !== undefined) {
				$interval.cancel(poller);
			}
			vm.status = "booking";
			document.title = "Mabel Ticketing | Book Your Tickets";

		} else if (status.queueing) {
			// show the loading page
			console.log("Show loading page");
			vm.queue.position = status.position;
			vm.queue.of = status.of;
			vm.status = "queueing";
			document.title = "Mabel Ticketing | Queueing...";

		} else {
			// show some kind of error message or rejoin the queue
			console.log("Not in the queue!");
			vm.status = "unavailable";
			document.title = "Mabel Ticketing | Booking Unavailable";
			vm.reason = status.reason;
		}
	}

	function updateMeta() {
		var bookingSum = 0;
		var ticketQuantity = 0;
		var tickets = vm.booking.tickets;
		for (var i = 0; i < tickets.length; i++) {
			bookingSum += parseInt(tickets[i].quantity) * tickets[i].price;
			ticketQuantity += parseInt(tickets[i].quantity);
			tickets[i].payment_methods = resizeArray(tickets[i].payment_methods, parseInt(tickets[i].quantity), vm.payment_methods[0].id);

			// TODO: £2 should be parameterised
			if (vm.booking.donate === true) bookingSum += 2*parseInt(tickets[i].quantity);
		}
		vm.meta.bookingSum = bookingSum;
		vm.meta.ticketQuantity = ticketQuantity;
	}

	// booking submission method
	function submitBooking() {
		vm.meta.errorMsg = "";
		APICaller.post("booking/1", vm.booking, function(err, result) {
			if (err) {
				vm.meta.errorMsg = err;
				return console.log(err); // error handling
			}
			// need to do more with booking stuff
			if (result.success) {
				vm.status = "done";
				vm.ticketResult = result.tickets;
				return;
			}
			// weird, no error but success is false;
			console.log(err, result);
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