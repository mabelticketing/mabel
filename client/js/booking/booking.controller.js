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

	vm.ticketPrice = function() {
		var price = 0;
		for (var id in vm.tickets) {
			price += vm.tickets[id].type.price * vm.tickets[id].quantity;
			if (vm.donate) {
				price += vm.tickets[id].quantity * 2;
			}
		}
		return price;
	};

	vm.ticketNumber = function() {
		var n = 0;
		for (var id in vm.tickets) {
			n += vm.tickets[id].quantity;
		}
		return n;
	};

	vm.range = function(num) {
		return new Array(num);
	};

	function resizeArray(array, size, default_obj) {
		if (array.length > size) {
			return array.slice(0, size);
		} 
		if (array.length < size) {
			var arr = array.slice(0);
			var obj = arr[arr.length-1] || default_obj;
			for (var i=array.length; i<size; i++) {
				arr[i] = angular.copy(obj);
			}
			return arr;
		}
		return array;
	}

	function updateMeta() {
		vm.ticketPrice = 0;
		vm.ticketNumber = 0;
		for (var id in vm.tickets) {
			vm.ticketPrice += vm.tickets[id].quantity * vm.tickets[id].type.price;
			vm.ticketNumber += vm.tickets[id].quantity;
			vm.tickets[id].payment_methods = resizeArray(vm.tickets[id].payment_methods, vm.tickets[id].quantity);

			// TODO: un-hard-code donation value
			if (vm.donate === true) vm.ticketPrice += vm.tickets[id].quantity * 2;
		}
	}

	e = vm; // TODO: get rid

	/*** DECLARATION ***/
	// initialise scope vars 
	vm.user = User.current();
	vm.user.init();
	vm.user.$promise.then(function() {
		vm.payment_methods =  vm.user["payment-method"].query();
		var a = vm.user.allowance.get();
		a.$promise.then(function() {
			vm.overall_allowance = a.overall_allowance;
		});
	});
	vm.all_ticket_types = Type.query();
	vm.payment_methods = PaymentMethod.query();
	vm.bookstate = 1;
	vm.price = 0;
	vm.overall_allowance=  0;
	vm.donate = false;

	// function on submission
	vm.submitBooking = submitBooking;
	// we will watch for changes to the tickets array or donations boolean and update summaries when the array changes
	$scope.$watch(function() {
		return _.pluck(_.values(vm.tickets), 'quantity');
	}, updateMeta, true); // the true argument causes 'deep' watching the array

	$scope.$watch(function() {
		return vm.donate;
	}, updateMeta);

	// TODO: look up ticket types with an open time in the future to warn the user what they will eventually have access to.
	Socket.on('open_types', function(data) {
		var oldTypes = vm.tickets;
		vm.tickets = {};
		vm.bookstate = 2;
		var tt;

		// check access through each of my groups
		for (var i=0; i<vm.user.groups.length; i++) {
			if (data[vm.user.groups[i]] !== undefined) {

				// get availability for every ticket type I've got access to
				for (tt in data[vm.user.groups[i]]) {
					if (!(tt in vm.tickets)) {
						vm.showBooking = true;
						vm.bookstate = 3;
						vm.tickets[tt] = {
							available: data[vm.user.groups[i]][tt].available,
							type: _.findWhere(vm.all_ticket_types, {'id': parseInt(tt)}),
							quantity: 0,
							// if the allowance is unbounded, set the limit to the number of tix available
							allowance: (data[vm.user.groups[i]][tt].allowance === null ? 
											data[vm.user.groups[i]][tt].available : 
											data[vm.user.groups[i]][tt].allowance),
							payment_methods: []
						};

						// preserve quantity if we've already set one
						if (oldTypes && oldTypes[tt]) {
							vm.tickets[tt].quantity = oldTypes[tt].quantity;
							vm.tickets[tt].payment_methods = oldTypes[tt].payment_methods;
						}
					} else {
						// we have access to this type through multiple groups
						// Availability will be the same - so just make sure we get max. allowance
						vm.tickets[tt].allowance = Math.max(vm.tickets[tt].allowance, data[vm.user.groups[i]][tt].allowance);
					}
				}
			}
		}
		// angular needs arrays to use ngOptions with, so we'll make one
		for (tt in vm.tickets) {

			// limit to 20 even when the allowance is greater (for rendering speed)
			// vm.tickets[tt].allowanceRange = _.range(0,Math.min(20, vm.tickets[tt].allowance+1));
			vm.tickets[tt].allowanceRange = _.range(0,vm.tickets[tt].allowance+1);

			// highlight when allowance changes
			if (oldTypes && oldTypes[tt] && vm.tickets[tt].allowance !== oldTypes[tt].allowance) {
				// TODO:  do something to signify a change
			}
		} 

	});

	// result of booking (for confirmation)
	vm.ticketResult = {};


	// /*** FUNCTION DEFINITIONS ***/
	// booking submission method
	function submitBooking() {
		vm.errorMsg = "";
		// construct array of tickets
		var tickets = [];
		for (var id in vm.tickets) {

			for (var i =0; i<vm.tickets[id].payment_methods.length; i++) {
				tickets.push({
					"ticket_type_id": parseInt(id),
					"guest_name": "[Please Enter a Guest Name]",
					"payment_method_id": vm.tickets[id].payment_methods[i],
					"donation": vm.donate,
					"notes": ""
				});
			}

		}
		console.log(tickets);
		vm.user.tickets().save(tickets).$promise.then(function(result) {
			console.log(result);
		}, function(err) {
			console.error(err);
		});
		// 	if (err) {
		// 		vm.meta.errorMsg = err;
		// 		return console.log(err); // error handling
		// 	}
		// 	if (result.success) {
		// 		vm.status = "done";
		// 		vm.ticketResult = result;
		// 		return;
		// 	}
		// 	// weird, no error but success is false;
		// 	console.log(err, result);
		// });
	}

}
