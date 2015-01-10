angular.module('mabel.shared')
	.factory('MabelResource', MabelResource);

/*
	MabelResource is a useful wrapper around $resource which does the following things:
		- auto-save resource changes to the DB (using $watch, de-bounced using $timeout)
		- custom serialization/deserialization logic for transport (useful for timestamps)
		- sets additional properties _status and _error during requests
		(- allows cancelling of currently pending requests [TODO])

	It is used like a normal resource, with an additional 'config' parameter,
	containing the following:

		- areEqual: a 2-parameter method which should return whether the two
		  resources provided should be considered equal. It's used to avoid
		  unnecessary saves on $watch.
		- serialize: a method which given some resource, returns a transport-
		  friendly version (e.g. with moment objects replaced by timestamps)
		- unserialize: a method which undoes whatever serialize did
*/
function MabelResource($http, $resource) {

	// this is the function which will be injected to our resource factories
	return function(url, params, actions, config) {

		// setup some sensible defaults for the config in case they're ommitted
		var serialize = config.serialize || function(obj) {
			return obj;
		};
		var unserialize = config.unserialize || function(obj) {
			return obj;
		};

		// our MabelResource overrides the default set of $resource actions
		actions = getActions(actions, serialize, unserialize);
		var Resource = $resource(url, params, actions);
		var methods = getWrapperMethods(Resource);

		// override get and query methods
		Resource.prototype.save = methods.save;
		Resource.prototype.defineMeta = function() {
			defineMeta(this);
		};
		return Resource;
	};

	// generate some wrappers for some of the default resource methods
	function getWrapperMethods(Resource) {
		return {
			save: save
		};

		// our save wrapper updates _status and _error as appropriate, before
		// calling the normal callback as well.
		function save() {
			// save is called as an instance method
			var resource = this;

			if (!resource.hasOwnProperty('_status')) {
				// this object doesn't have '_status' set yet for some reason
				// (probably it was created via new Resource() rather than
				// through .get() or .query())
				defineMeta(resource);
			}

			var promise = resource.$save.apply(resource, arguments);
			promise.then(function() {
				resource._status = "success";
				resource._error = "";
			}, function(response) {
				resource._status = "error";
				resource._error = response.data;
			});
			return promise;
		}
	}

	// this function defines some non-enumerable properties which will be
	// useful for us. It's important that they're non-enumerable,
	// otherwise node-mysql might naively try to save them to the database	
	function defineMeta(obj) {
		Object.defineProperty(obj, '_status', {
			value: '',
			enumerable: false,
			writable: true
		});
		Object.defineProperty(obj, '_error', {
			value: '',
			enumerable: false,
			writable: true
		});
	}

	// return set of actions combining default actions with the given extras,
	// augmented with the given (un)serialize methods which will be called for
	// each of the requests made through this resource
	function getActions(extras, serialize, unserialize) {

		// _get does what $resource.get would normally do, but we are
		// going to over-write .get with our own method later.
		// Also set up serialization here
		var actions = {
			'get': {
				method: 'GET',
				mabelSerialize: true,
			},
			'query': {
				method: 'GET',
				isArray: true,
				mabelSerialize: true
			},
			'save': {
				method: 'POST',
				mabelSerialize: true
			}
		};
		angular.extend(actions, extras);

		// for every action, if mabelSerialize has been set to true, we add
		// our serialize methods to the transformRequest/Response as
		// appropriate. We'll use (un)serializeArray where necessary.		
		for (var j in actions) {
			var action = actions[j];
			if (action.mabelSerialize !== undefined && action.mabelSerialize === true) {

				var defaultRequest = action.transformRequest || $http.defaults.transformRequest;
				var defaultResponse = action.transformResponse || $http.defaults.transformResponse;

				if (action.isArray !== undefined && action.isArray === true) {
					action.transformRequest = [serializeArray(serialize)].concat(defaultRequest);
					action.transformResponse = defaultResponse.concat([unserializeArray(unserialize)]);

				} else {
					action.transformRequest = [serialize].concat(defaultRequest);
					action.transformResponse = defaultResponse.concat([unserialize]);
				}
			}
		}
		return actions;
	}

	// generalises the given serialize method into one which will work on an array of resources
	function serializeArray(serialize) {
		return function(objs) {
			if (objs === undefined) return objs;
			var _objs = [];
			for (var i = 0; i < objs.length; i++) {
				_objs[i] = serialize(objs[i]);
			}
			return _objs;
		};
	}

	// generalises the given unserialize method into one which will work on an array of resources
	function unserializeArray(unserialize) {
		return function(objs) {
			if (objs === undefined) return objs;
			var _objs = [];
			for (var i = 0; i < objs.length; i++) {
				_objs[i] = unserialize(objs[i]);
			}
			return _objs;
		};
	}
}