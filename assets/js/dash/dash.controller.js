angular.module('mabel.dash')
	.controller("DashController", DashController);

function DashController($scope, APICaller) {
	var vm = this;

	/*** DECLARATION ***/
	//TODO: stop exposing vm on every controller!
	//e = vm;

	// initialise scope vars 
	vm.groups = [];

	/*** INITIAL ACTION ***/

	APICaller.get('user/group', function(err, data) {
		if (err) return console.log(err);
		// assign response to groups array
		vm.groups = data;
	});
	
	// NOT SURE THIS IS NESC.
	// $scope.$watch(function() {
	// 	return vm.groups;
	// }, (function(){
	// 	console.log(vm.groups);
	// }), true); // the true argument causes 'deep' watching the array
	

	/*** FUNCTION DEFINITIONS ***/


	
}