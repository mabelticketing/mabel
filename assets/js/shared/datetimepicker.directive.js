angular.module('mabel.shared')
	.directive('datetimepicker', DateTimePickerDirective);

function DateTimePickerDirective($timeout) {
	return {
		scope: {
			date: "="
		},
		restrict: 'A',
		link: function(scope, element) {

			element.datetimepicker({
				defaultDate: scope.date
			});
			element.on('dp.change', updateModel).on('dp.error', validateError);
			scope.$watch('date', updatePicker);

			function updateModel(e) {
				scope.$apply(function() {
					scope.date = e.date;
				});
			}
			function validateError(e) {
				console.error("Error parsing.",e.date);
			}
			function updatePicker(newValue) {
				var datePicker = element.data("DateTimePicker");
				if (newValue && !newValue.isSame(datePicker.getDate())) {
					// we need to update the datepicker, but wait until the $digest cycle is finished
					$timeout(function() {
						datePicker.setDate(newValue);
					});
				}
			}
		}
	};
}
