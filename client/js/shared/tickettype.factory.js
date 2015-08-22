angular.module('mabel.shared')
	.factory('TicketType', TicketType);

function TicketType(MabelToken, MabelResource) {
	return MabelResource('/api/ticket_type/:event_id/:id', 
		{
			access_token: MabelToken,
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