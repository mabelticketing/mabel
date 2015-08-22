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

	APICaller.get("ticket/admit", {}, 
		function(err, data) {
			if (err) return alert("ERROR " + err);
			if (!data.success) return alert("ERROR: " + data.error);
			vm.admitted = data.result.admitted;
		});

	APICaller.get("ticket/getAllDetailed", {},
		function(err, data) {
			if (err) return alert(err);
			if (data.length < 1) return alert("No tickets found");
			vm.allTickets = _.sortBy(data, function(t) { return t.id;});
			$scope.$watch(function(){return vm.searchTerm;}, _.debounce(
				function() {
					// This code will be invoked after 1 second from the last time 'id' has changed.
					$scope.$apply(search);
				},
				 500)
			);
		}
	);

	function admit(ticket) {
		APICaller.post("ticket/admit/" + ticket.id, {}, function(err, data) {
			if (data && !data.success) err = data.error;
			if (err) {
				alert("ERROR: " + err);
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