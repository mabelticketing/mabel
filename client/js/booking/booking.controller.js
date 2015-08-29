/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

/* global moment */
angular.module('mabel.booking')
	.controller("BookingController", BookingController);

// TODO Maybe: I feel like BookingController is trying to do too much, but maybe that doesn't matter
// e.g. the call to user/me should perhaps be the responsibility of some other controller
function BookingController($scope, APICaller, User, $interval) {
	var vm = this;

	e = vm; // TODO: get rid

	/*** DECLARATION ***/
	// initialise scope vars 
	vm.user = User.current();
	vm.available_tickets = [];
	vm.payment_methods = [];
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
		if (status.open) {
			// show the booking page and stuff

			// get available ticket types
			// TODO: parameterise event id
			APICaller.get("ticket_type/available/1", function(err, available_tickets) {
				if (err) return console.log(err);

				// get the user's ticket allowance
				APICaller.get("user/ticket_limit", function(err, data) {
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
								max_tickets: new Array(Math.min(vm.meta.ticketAllowance, 20)), // limit to 20 for rendering speed
								max_available: available_tickets[i].ticket_limit,
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

		} else {
			vm.status = "unavailable";
			document.title = "Mabel Ticketing | Booking Unavailable";
			var reason = status.reason;
			var niceStart = moment.unix(status.startTime).calendar();
			niceStart = niceStart.toLowerCase();
			niceStart = niceStart.replace(/am/g,'AM').replace(/pm/g, 'PM');
			reason = reason.replace("$$$startTime$$$", niceStart);
			vm.reason = reason;
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
			if (result.success) {
				vm.status = "done";
				vm.ticketResult = result;
				return;
			}
			// weird, no error but success is false;
			console.log(err, result);
		});
	}

	function pollApi() {
		
		APICaller.get("booking/open/1", function(err, data) {
			if (err) console.log("err", err); // error handling

			// stop polling if booking info returned
			processStatus(data);
		});
	}
}
