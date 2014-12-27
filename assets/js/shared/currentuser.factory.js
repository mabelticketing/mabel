angular.module('mabel.shared')
	.factory("CurrentUser", CurrentUser);

function CurrentUser($resource, MabelToken) {
	var UserResource = $resource('/api/user/me', {
		access_token: MabelToken
	});
	return {
		get: get
	};
	function get(callback) {
		// this is where we would set up watches, etc
		return UserResource.get(callback); 
	}
}
