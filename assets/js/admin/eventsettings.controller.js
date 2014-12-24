/* global moment */
angular.module('mabel.admin')
	.controller("EventSettingsController", EventSettingsController);

function EventSettingsController(APICaller) {
	var vm = this;
	vm.save = save;

	function isEqual(a, b) {
		if (typeof a === "object" && typeof b === "object") {
			if (moment.isMoment(a)) {
				return a.isSame(b, 'minute');
			}
		} else {
			return (a === b);
		}
	}

	function save(property, $event) {
		var formGroup = $($event.target).closest(".form-group");
		formGroup.removeClass('has-info has-warning has-error has-success');

		if (!isEqual(vm[property], vm["_" + property])) {
		
			formGroup.addClass('has-info');
			
			var data = {};
			data[property] = vm[property];
			
			APICaller.post('event/1', {}, data, function(err, result) {
				if (err) {
					formGroup.removeClass('has-info has-warning has-error has-success').addClass('has-error');
					console.log(err);
					alert(err);
				} else {
					vm["_" + property] = vm[property];
					console.log(result);
					formGroup.removeClass('has-info has-warning has-error has-success').addClass('has-success');
				}
			});
		}
	}

	APICaller.get('event/1', {}, function(err, data) {
		if (err) return;
		vm.name = data.name;
		vm.launch_time = moment(data.launch_time);
		vm.modification_stop_time = moment(data.modification_stop_time);
		vm._name = vm.name;
		vm._launch_time = vm.launch_time;
		vm._modification_stop_time = vm.modification_stop_time;
	});
}