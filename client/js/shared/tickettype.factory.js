/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

angular.module('mabel.shared')
	.factory('TicketType', TicketType);

function TicketType(MabelToken, MabelResource) {
	return MabelResource('/api/ticket_type/:event_id/:id', 
		{
			access_token: MabelToken.token,
			id: '@id',
			// TODO: parameterise this
			event_id: 1,
		}, 
		{
			available: {
				method: 'GET',
				url: 'api/ticket_type/available/:event_id',
				mabelSerialize: true
			}
		},
		{} // no special serialization needed
	);

}