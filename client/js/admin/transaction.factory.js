/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

/* global moment */
angular.module('mabel.admin')
	.factory('Transaction', Transaction);

function Transaction(MabelToken, MabelResource) {
	return MabelResource('/api/transaction/:id', 
		{
			access_token: MabelToken,
			id: '@id'
		}, 
		{
		},
		{
			serialize: serialize,
			unserialize: unserialize
		}
	);

	function unserialize(transaction) {

		// time will always be a timestamp for transport, but we want a moment object
		function unserializeTime(dateString) {
			if (dateString !== undefined) return moment.unix(dateString);
		}
		
		if (transaction === undefined) return transaction;
		
		// we make a copy rather than modifying directly because otherwise
		// unserializing time will trigger the watch on transaction
		var _transaction = angular.copy(transaction);
		_transaction.transaction_time = unserializeTime(_transaction.transaction_time);
		
		return _transaction;
	}

	function serialize(transaction) {

		// time must always be a timestamp for transport, but we have a moment object
		function serializeTime(date) {
			if (date !== undefined) return date.unix();
		}

		if (transaction === undefined) return transaction;

		// we make a copy rather than modifying directly because otherwise
		// serializing time will trigger the watch on transaction
		var _transaction = angular.copy(transaction);
		_transaction.transaction_time = serializeTime(transaction.transaction_time);

		return _transaction;
	}

}