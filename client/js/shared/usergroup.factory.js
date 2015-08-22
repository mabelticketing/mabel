/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

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