/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

/* global _ */
angular.module('mabel.booking')
	.controller("BookingController", BookingController);

// TODO Maybe: I feel like BookingController is trying to do too much, but maybe that doesn't matter
// e.g. the call to user/me should perhaps be the responsibility of some other controller
function BookingController($scope, User, Type, PaymentMethod, Socket) {
	var vm = this;

	e = vm; // TODO: get rid

	/*** DECLARATION ***/
	// initialise scope vars 
	vm.user = User.current();
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
	vm.limitRanges = {};
	// function on submission
	vm.submitBooking = submitBooking;

	// get all ticket types first, so we know what we're talking about
	var all_ticket_types = Type.query();

	// get all payment methods
	vm.payment_methods = PaymentMethod.query();

	vm.user.$promise.then(function() {
		var a = vm.user.allowance().get();
		a.$promise.then(function() {
			vm.meta.ticketAllowance = a.allowance;
		});
	});

	// TODO: look up ticket types with an open time in the future to warn the user what they will eventually have access to.

    Socket.on('open_types', function(data) {
    	// console.log(data);
    	// work out whether any of these are applicable to me
    	data = _.chain(data)
	    	.filter(function(d) {
	    		return _.contains(vm.user.groups, d.group_id);
	    	})
	    	.pluck('ticket_type_id')
	    	.uniq()
	    	.value();

	    vm.available_tickets = _.chain(all_ticket_types)
	    	.filter(function(t) {
	    		return _.contains(data, t.id);
	    	})
	    	.value();

	    for (var i=0; i<vm.available_tickets.length; i++) {
	    	var lim = 20;  // limit to 20 for rendering speed;
	    	Math.min(vm.meta.ticketAllowance, lim); // can't buy more than your remaining allowance
	    	Math.min(vm.available_tickets[i].ticket_limit, lim); // can't buy more tickets than we have for sale
	    	Math.min(vm.available_tickets[i].per_user_limit, lim); // can't buy more tickets than an individual is allowed
	    	if (vm.limitRanges[vm.available_tickets[i].id] === undefined || 
	    		vm.limitRanges[vm.available_tickets[i].id].length !== lim) 
	    		vm.limitRanges[vm.available_tickets[i].id] = _.range(0, lim + 1); // +1 because we're counting 0
	   //  	if () 
				// // add each ticket, quantity 0 to vm.booking
				// // this is possibly a stupid idea, gives lots of undefineds in array
				// vm.booking.tickets.push({
				// 	ticket_type_id: vm.available_tickets[i].id,
				// 	max_tickets: new Array(Math.min(vm.available_tickets[i].per_user_limit, vm.available_tickets[i].ticket_limit, vm.meta.ticketAllowance, 20)), // limit to 20 for rendering speed
				// 	max_available: available_tickets[i].ticket_limit,
				// 	quantity: 0,
				// 	price: available_tickets[i].price,
				// 	name: available_tickets[i].name,
				// 	payment_methods: []
				// });
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

	// function updateMeta() {
	// 	var bookingSum = 0;
	// 	var ticketQuantity = 0;
	// 	var tickets = vm.booking.tickets;
	// 	for (var i = 0; i < tickets.length; i++) {
	// 		bookingSum += parseInt(tickets[i].quantity) * tickets[i].price;
	// 		ticketQuantity += parseInt(tickets[i].quantity);
	// 		tickets[i].payment_methods = resizeArray(tickets[i].payment_methods, parseInt(tickets[i].quantity), vm.payment_methods[0].id);

	// 		// TODO: £2 should be parameterised
	// 		if (vm.booking.donate === true) bookingSum += 2*parseInt(tickets[i].quantity);
	// 	}
	// 	vm.meta.bookingSum = bookingSum;
	// 	vm.meta.ticketQuantity = ticketQuantity;
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
