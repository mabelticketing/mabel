/*global moment*/
angular.module('mabel.admin')
	.controller("EventSettingsController", ["APICaller", EventSettingsController]);
	
function EventSettingsController(APICaller) {
	var vm = this;
	vm.save = save;
	
	function isEqual(a, b) {
		if (typeof a === "object" && typeof b === "object") {
			if (moment.isMoment(a)) {
				return a.isSame(b, 'minute');
			}
		} else {
			return(a === b);
		}
	}
	function save(property, $event) {
		var formGroup = $($event.target).closest(".form-group");
		formGroup.removeClass('has-info has-warning has-error has-success');
		if (!isEqual(vm[property], vm["_" + property])) {
			formGroup.addClass('has-info');
			var data = {event_id:1, toSave:{}};

			data.toSave[property] = vm[property];
			APICaller.post('event-data', data, function(data){
				vm["_" + property] = vm[property];
				console.log(data);
				formGroup.removeClass('has-info has-warning has-error has-success').addClass('has-success');
			}, function(err) {
				formGroup.removeClass('has-info has-warning has-error has-success').addClass('has-error');
				console.log(err);
				alert(err);
			});
			console.log(property + " is being saved to value " + vm[property]);
		}
	}

	APICaller.get('event-data', {event_id:1}, function(data){
		vm.name = data.name;
		vm.launch_time = new moment(data.launch_time);
		vm.modification_stop_time = new moment(data.modification_stop_time);
		vm._name = vm.name;
		vm._launch_time = vm.launch_time;
		vm._modification_stop_time = vm.modification_stop_time;
	});
}