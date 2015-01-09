angular.module('mabel.shared')
	.factory('UserGroup', UserGroup);

function UserGroup(MabelToken, MabelResource) {
	return MabelResource('/api/user/group/:id', 
		{
			access_token: MabelToken,
			id: '@id',
		}, 
		{}, // no custom actions for this resource
		{} // no special serialization needed
	);

}