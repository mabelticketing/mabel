
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