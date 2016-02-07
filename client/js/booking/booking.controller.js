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

	vm.range = range;


	/*** DECLARATION ***/
	// initialise scope vars 
	vm.user = User.current();
	vm.all_ticket_types = Type.query();
	vm.payment_methods = PaymentMethod.query();

	// initialise the user's subresources (payment methods and allowances)
	vm.user.init();
	vm.user.$promise.then(function() {
		vm.payment_methods =  vm.user["payment-method"].query();
		var a = vm.user.allowance.get();
		a.$promise.then(function() {
			vm.allowance = a;
		});
	});
	vm.status = "loading";
	vm.price = 0;
	vm.allowance = {
		remaining_allowance: 0
	};
	vm.donate = false;

	// function on submission
	vm.submitBooking = submitBooking;

	// we will watch for changes to the number of tickets and update summaries when the array changes
	$scope.$watch(function() {
		return _.pluck(_.values(vm.tickets), 'quantity');
	}, updateMeta, true);
	$scope.$watch(function() {
		return vm.donate;
	}, updateMeta);

	Socket.on('open_types', function(data) {
		if (vm.status === "done") return;
		var oldTypes = vm.tickets;
		vm.tickets = {};
		vm.status = "notix";
		var tt;

		// check access through each of my groups
		for (var i=0; i<vm.user.groups.length; i++) {
			if (data[vm.user.groups[i]] !== undefined) {

				// get availability for every ticket type I've got access to
				for (tt in data[vm.user.groups[i]]) {
					if (!(tt in vm.tickets)) {
						vm.showBooking = true;
						vm.status = "open";
						vm.tickets[tt] = {
							available: data[vm.user.groups[i]][tt].available,
							type: _.findWhere(vm.all_ticket_types, {'id': parseInt(tt)}),
							quantity: 0,
							// if the allowance is unbounded, set the limit to the number of tix available
							allowance: (data[vm.user.groups[i]][tt].allowance === null ? 
											data[vm.user.groups[i]][tt].available : 
											data[vm.user.groups[i]][tt].allowance),
							payment_methods: [],
							errors: []
						};

						// preserve quantity if we've already set one
						if (oldTypes && oldTypes[tt]) {
							vm.tickets[tt].quantity = oldTypes[tt].quantity;
							vm.tickets[tt].payment_methods = oldTypes[tt].payment_methods;
							vm.tickets[tt].errors = oldTypes[tt].errors;
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


	/*** FUNCTION DEFINITIONS ***/
	
	// send booking to the server, and process the result in case of errors (otherwise just update the controller)
	function submitBooking() {
		vm.overall_error = "";
		// construct array of tickets
		var tickets = [];
		for (var id in vm.tickets) {

			for (var i =0; i<vm.tickets[id].payment_methods.length; i++) {
				tickets.push({
					"ticket_type_id": parseInt(id),
					"guest_name": "[Please Enter a Guest Name]",
					"payment_method_id": vm.tickets[id].payment_methods[i],
					"donation": vm.donate,
					"notes": "",
					"form_id": id + "-" + i
				});
			}

		}

		vm.user.tickets().save(tickets).$promise.then(function(result) {
			console.log(result);
			for (var j=0; j<result.failed.length; j++) {
				// find the offending tickets
				var form_id = result.failed[j].form_id.split("-");
				vm.tickets[form_id[0]].errors[form_id[1]] = result.failed[j].reason;
			}
			if (result.booked.length < 1 && result.waiting_list.length <1) { 
				// nothing's been booked - so give the user the opportunity to try to fix things.
			} else {
				vm.status = "done";
				vm.booked = result.booked;
				vm.failed = result.failed;
				vm.waiting_list = result.waiting_list;
				vm.totalPrice = result.totalPrice;
				vm.payment_deadline = result.payment_deadline;
				
				vm.sampleID = 123;
				vm.payment_instructions = {};
				vm.payment_instructions.banktransfer = false;
				vm.payment_instructions.college_bill = false;
				vm.payment_instructions.cheque = false;

				for (var i=vm.booked.length-1; i>=0; i--) {
					vm.sampleID = vm.booked[i].id;
					switch (vm.booked[i].payment_method_id) {
						case 3: 
							vm.payment_instructions.banktransfer = true;
							break;
						case 2: 
							vm.payment_instructions.cheque = true;
							break;
						case 1: 
							vm.payment_instructions.college_bill = true;
							break;
					}

				}
			}
		}, function(err) {
			// this was a connection error affecting the whole booking - I don't think anything was booked.
			if (err.status === 400) {
				// the input data was wrong; this is probably swagger complaining about something
				if (err.data.error.code === "SCHEMA_VALIDATION_FAILED" && err.data.error.paramName === "tickets") {
					// definitely swagger.
					// Literally the only thing under user control is the payment method, and 
					// even then the only thing Swagger should complain about is if we leave it blank.
					// So the only error I'm going to check for is that the payment method is missing.
					if (err.data.error.results.errors.length > 0 && err.data.error.results.errors[0].message.indexOf("payment_method_id") >= 0) {
						vm.overall_error = "You must enter a payment method for every ticket you want to book!";
						return;
					}
				}
			}
			// unpredicted error - dunno how to parse usefully.
			vm.overall_error = "An unexpected error occurred during booking - sorry! Please copy and paste this message in an email to the administrator (address at the bottom of the page) to help us fix the problem!";
			err.dt = (new Date()).getTime();
			vm.overall_error += JSON.stringify(err);
		});
	}

	// periodically update the total number of tickets booked, and their price in the controller
	function updateMeta() {
		vm.ticketPrice = 0;
		vm.ticketNumber = 0;
		for (var id in vm.tickets) {
			vm.ticketPrice += vm.tickets[id].quantity * vm.tickets[id].type.price;
			vm.ticketNumber += vm.tickets[id].quantity;
			vm.tickets[id].payment_methods = resizeArray(vm.tickets[id].payment_methods, vm.tickets[id].quantity);
			vm.tickets[id].errors = resizeArray(vm.tickets[id].errors, vm.tickets[id].quantity);

			// TODO: un-hard-code donation value
			if (vm.donate === true) vm.ticketPrice += vm.tickets[id].quantity * 2;
		}
	}

	// generic helper functions
	function range(num) {
		return new Array(num);
	}
	
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


}
