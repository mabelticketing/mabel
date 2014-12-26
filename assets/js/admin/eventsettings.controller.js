angular.module('mabel.admin')
	.controller("EventSettingsController", EventSettingsController);

function EventSettingsController(EventSettings) {
	var vm = this;
	vm.status = "primary";
	vm.settings = EventSettings.get({
		id: 1
	}, {
		success: function() {
			vm.status = "success";
			vm.subtitle = "Updated";
		},
		error: function() {
			vm.status = "danger";
			vm.subtitle = "Error saving";
		},
		loading: function() {
			vm.status = "info";
			vm.subtitle = "Saving...";
		}
	});
	vm.resetStatus = function() {
		vm.status = "primary";
		vm.subtitle = "";
	};
}