
angular.module('mabel.admin')
	.controller("EventSettingsController", EventSettingsController);

function EventSettingsController(EventSettings) {
	var vm = this;
	eve = vm;
	vm.status = "primary";
	vm.settings = EventSettings.get({
		id: 1
	});
	vm.resetStatus = function() {
		vm.status = "primary";
		vm.subtitle = "";
	};
}