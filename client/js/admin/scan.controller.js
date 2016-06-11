/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

/* global _ */
angular.module('mabel.admin')
	.controller("ScanController", ScanController);

function ScanController($scope, APICaller) {
	var vm = this;
	vm.allTickets = [];
	vm.searchResults = [];
	vm.admitted = 0;
	vm.searchTerm = "";
	vm.admit = admit;

	APICaller.get("admission", {}, 
		function(err, data) {
			if (err) return console.error("ERROR " + err);
			if (data.details.length < 1) return console.error("No tickets found");

			vm.admitted = data.admitted;
			vm.allTickets = _.sortBy(data.details, function(t) { return t.id;})

			vm.allTickets
				.forEach(function(t) {
					if (t.status_name === "ADMITTED") {
						console.log(t)
						t.status = "btn-success"
					} else if (t.status_name === "CANCELLED") {
						t.status = "btn-warning"
					}
				})

			console.log(vm.admitted);
			console.log(vm.allTickets.length)

			$scope.$watch(function(){return vm.searchTerm;}, _.debounce(
				function() {
					// This code will be invoked after 1 second from the last time 'id' has changed.
					$scope.$apply(search);
				},
				 500)
			);
		})

	// APICaller.get("ticket/admit", {}, 
	// 	function(err, data) {
	// 	});

	// APICaller.get("ticket/getAllDetailed", {},
	// 	function(err, data) {
	// 		if (err) return alert(err);
	// 	}
	// );

	function admit(ticket) {
		APICaller.post("admission/" + ticket.id, {}, function(err, data) {
			if (data && !data.success) err = data.error;
			if (err) {
				alert("ERROR: " + err);
				console.error(err);
				ticket.status = "btn-danger";
				
				return;
			} else {
				ticket.status = "btn-success";
				console.log("Admitted", data);
				// TODO: refocussing scan field like this isn't very angular
				document.getElementsByClassName("scan-input")[0].select();
				vm.admitted = data.result.admitted;
			}
		});
		ticket.status = "btn-warning";
	}

	function search() {
		var t = vm.searchTerm.toLowerCase();
		if (t.length<1) return vm.searchResults = [];
		// check every character is numeric (i.e. if it is a barcode)
		if (/^\d{10}$/.test(t.replace(/\s/g, ""))) {
			t = t.replace(/ /g, "");
			// var user_id = parseInt(t.substr(0,5));
			var ticket_id = parseInt(t.substr(5,5));

			return vm.searchResults = [_.findWhere(vm.allTickets, {id:ticket_id})];
		}
		return vm.searchResults = _.filter(vm.allTickets, function(ticket) {
			
			if (ticket.guest_name &&
				ticket.guest_name.toLowerCase().indexOf(t) > -1) {
				return true;
			}
			if (ticket.booking_user_name &&
				ticket.booking_user_name.toLowerCase().indexOf(t) > -1) {
				return true;
			}
			if (ticket.booking_user_email &&
				ticket.booking_user_email.toLowerCase().indexOf(t) > -1) {
				return true;
			}
			return false;
		});
	}
}
