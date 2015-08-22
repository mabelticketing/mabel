/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

angular.module('mabel.admin')
	.controller("EventSettingsController", EventSettingsController);

function EventSettingsController(EventSettings) {
	var vm = this;
	vm.settings = EventSettings.get({
		id: 1
	});
	vm.resetStatus = function() {
		// TODO: We shouldn't have to check for this - _status should be set on creation
		if (vm.settings._status !== undefined) {
			vm.settings._status = "";
		}
	};
}