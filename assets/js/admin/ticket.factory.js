angular.module('mabel.admin')
	.factory('Ticket', Ticket);

function Ticket(MabelToken, MabelResource) {
	return MabelResource('/api/ticket/:id', 
		{
			access_token: MabelToken,
			id: '@id'
		}, 
		{
			// add a custom action to retrieve a summary of tickets sold
			'summary': {
				method: 'GET',
				url: '/api/ticket/summary',
				isArray: true,
				mabelSerialize: true
			}
		},
		{} // no special serialization needed
	);

}