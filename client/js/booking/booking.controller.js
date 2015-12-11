/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

/* global _ */
angular.module('mabel.booking')
	.controller("BookingController", BookingController);

function BookingController($scope, User, Type, PaymentMethod, Socket) {
	var vm = this;

	function updateRanges() {
		for (var i=0; i<vm.my_ticket_types.length; i++) {
			var lim = 20;  // limit to 20 for rendering speed;
			lim = Math.min(vm.meta.overall_allowance, lim); // can't buy more than your remaining allowance

			// lim = Math.min(vm.my_ticket_types[i].available, lim); // can't buy more tickets than we have for sale
			// ACTUALLY we allow this and the rest go to waiting list
			
			lim = Math.min(vm.my_ticket_types[i].allowance, lim); // can't buy more tickets than an individual is allowed
			vm.my_ticket_types[i].range = _.range(0, lim+1); // +1 because we're counting 0
		}
	}
	vm.ticketPrice = function() {
		var price = 0;
		for (var i = 0; i<vm.my_ticket_types.length; i++) {
			price += vm.my_ticket_types[i].price * vm.my_ticket_types[i].quantity;
		}
		return price;
	};

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


	e = vm; // TODO: get rid

	/*** DECLARATION ***/
	// initialise scope vars 
	vm.user = User.current();
	vm.user.init();
	vm.user.$promise.then(function() {
		vm.my_ticket_types = vm.user.type.query();
		vm.my_ticket_types.$promise.then(updateRanges);
		vm.payment_methods =  vm.user["payment-method"].query();
		var a = vm.user.allowance.get();
		a.$promise.then(function() {
			console.log(a);
			vm.meta.overall_allowance = a.overall_allowance;
		});
	});
	vm.all_ticket_types = Type.query();
	vm.bookstate = 1;
	vm.payment_methods = PaymentMethod.query();
	vm.price = 0;
	vm.meta = {
		bookingSum: 0,
		ticketQuantity: 0,
		overall_allowance: 0
	};
	vm.booking = {
		tickets: [],
		donate: false
	};
	vm.limitRanges = {};
	// function on submission
	vm.submitBooking = submitBooking;

	// TODO: look up ticket types with an open time in the future to warn the user what they will eventually have access to.
	Socket.on('open_types', function(data) {
		var oldTypes = vm.types;
		vm.types = {};
		vm.bookstate = 2;
		var tt;

		// check access through each of my groups
		for (var i=0; i<vm.user.groups.length; i++) {
			if (data[vm.user.groups[i]] !== undefined) {

				// get availability for every ticket type I've got access to
				for (tt in data[vm.user.groups[i]]) {
					if (!(tt in vm.types)) {
						vm.showBooking = true;
						vm.bookstate = 3;
						vm.types[tt] = {
							available: data[vm.user.groups[i]][tt].available,
							type: _.findWhere(vm.all_ticket_types, {'id': parseInt(tt)}),
							quantity: 0,
							// if the allowance is unbounded, set the limit to the number of tix available
							allowance: (data[vm.user.groups[i]][tt].allowance === null ? 
											data[vm.user.groups[i]][tt].available : 
											data[vm.user.groups[i]][tt].allowance)
						};

						// preserve quantity if we've already set one
						if (oldTypes && oldTypes[tt]) {
							vm.types[tt].quantity = oldTypes[tt].quantity;
						}
					} else {
						// we have access to this type through multiple groups
						// Availability will be the same - so just make sure we get max. allowance
						vm.types[tt].allowance = Math.max(vm.types[tt].allowance, data[vm.user.groups[i]][tt].allowance);
					}
				}
			}
		}
		// angular needs arrays to use ngOptions with, so we'll make one
		for (tt in vm.types) {

			// limit to 20 even when the allowance is greater (for rendering speed)
			// vm.types[tt].allowanceRange = _.range(0,Math.min(20, vm.types[tt].allowance+1));
			vm.types[tt].allowanceRange = _.range(0,vm.types[tt].allowance+1);

			// highlight when allowance changes
			if (oldTypes && oldTypes[tt] && vm.types[tt].allowance !== oldTypes[tt].allowance) {
				// TODO:  do something to signify a change
			}
		} 

	});

	// result of booking (for confirmation)
	vm.ticketResult = {};


	// /*** FUNCTION DEFINITIONS ***/
	function submitBooking() {

	}


	// 					// we will watch for changes to the tickets array or donations boolean and update summaries when the array changes
	// 					$scope.$watch(function() {
	// 						return vm.booking.tickets;
	// 					}, updateMeta, true); // the true argument causes 'deep' watching the array

	// 					$scope.$watch(function() {
	// 						return vm.booking.donate;
	// 					}, updateMeta);
	// 				});
	// 			});
	// 		});

	// 		// don't need to keep polling now we're ready to book
	// 		if (poller !== undefined) {
	// 			$interval.cancel(poller);
	// 		}
	// 		vm.status = "booking";
	// 		document.title = "Mabel Ticketing | Book Your Tickets";

	// 	} else {
	// 		vm.status = "unavailable";
	// 		document.title = "Mabel Ticketing | Booking Unavailable";
	// 		var reason = status.reason;
	// 		var niceStart = moment.unix(status.startTime).calendar();
	// 		niceStart = niceStart.toLowerCase();
	// 		niceStart = niceStart.replace(/am/g,'AM').replace(/pm/g, 'PM');
	// 		reason = reason.replace("$$$startTime$$$", niceStart);
	// 		vm.reason = reason;
	// 	}
	// }


	// // booking submission method
	// function submitBooking() {
	// 	vm.meta.errorMsg = "";
	// 	APICaller.post("booking/1", vm.booking, function(err, result) {
	// 		if (err) {
	// 			vm.meta.errorMsg = err;
	// 			return console.log(err); // error handling
	// 		}
	// 		if (result.success) {
	// 			vm.status = "done";
	// 			vm.ticketResult = result;
	// 			return;
	// 		}
	// 		// weird, no error but success is false;
	// 		console.log(err, result);
	// 	});
	// }

	// function pollApi() {
		
	// 	APICaller.get("booking/open/1", function(err, data) {
	// 		if (err) console.log("err", err); // error handling

	// 		// stop polling if booking info returned
	// 		processStatus(data);
	// 	});
	// }

}
