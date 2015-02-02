angular.module('mabel.admin')
	.factory('Ticket', Ticket);

function Ticket(MabelToken, MabelResource) {
	return MabelResource('/api/ticket/:id', 
		{
			access_token: MabelToken,
			id: '@id'
		}, 
		{
		},
		{} // no special serialization needed
	);

}