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

function MabelResource($http, $resource, $rootScope, $timeout) {
	
	// this is the function which will be injected to our resource factories
	return function (url, params, actions, config) {

		// setup some sensible defaults for the config in case they're ommitted
		var areEqual = config.areEqual || function(A, B) {
			return true;
		};
		var serialize = config.serialize || function(obj) {
			return obj;
		};
		var unserialize = config.unserialize || function(obj) {
			return obj;
		};


		return wrap(
			$resource(
				url, params,
				// our MabelResource overrides the default set of $resource actions
				getActions(serialize, unserialize, actions)
			),
			areEqual);
	};

	function wrap(Resource, areEqual) {
		Resource.get = get;
		Resource.query = query;
		Resource.prototype.delete = deleteIt;
		Resource.prototype.save = save;

		return Resource;

		function get(parameters, success, error) {
			return Resource._get(parameters, function(value, responseHeaders) {

				// start watching so we can update the server
				// $rootScope.$watch can take a string or a function as the
				// first argument. If it's a string, it will watch the
				// property within the scope, which isn't what we want here.
				// If it's a function, it will check the return value of the
				// function after each update cycle, to see if that has
				// changed. That's what we want here, so we end up with this
				// trivial function.
				function getValue() {
					return value;
				}

				var stopTimer;
				var clearWatch = $rootScope.$watch(getValue, change(stopTimer), true);

				// define non-enumerable properties so they won't show up in the DB
				defineMeta(value);
				value._clearWatch = clearWatch;

				if (success !== undefined) success(value, responseHeaders);
			}, error);
		}

		// Our wrapper for query sets up a watch on each of the new resources when they arrive
		function query(parameters, success, error) {
			return Resource._query(parameters, function(value, responseHeaders) {
				
				// We here have to wrap our trivial function (see big comment
				// in get wrapper above) because otherwise we will have a
				// problem with i. By the time the callback is actually
				// called, the loop below  will have finished and the value of
				// i will be fixed to the last value for every single call
				// (not what we want). Instead we fix the value of i at each
				// iteration by copying it to a new scope in the closure of
				// the returned function foo below
				function getValue(i) {
					return function foo() {
						return value[i];
					};
				}
				
				for (var i = 0; i < value.length; i++) {
					var stopTimer;
					var clearWatch = $rootScope.$watch(getValue(i), change(stopTimer), true);

					// define non-enumerable properties so they won't show up in the DB
					defineMeta(value[i]);
					value[i]._clearWatch = clearWatch;
				}
				if (success !== undefined) success(value, responseHeaders);
			}, error);
		}

		// this wrapper for delete just removes the watch before deleting (if
		// one has been set)
		function deleteIt(success, error) {
			if (typeof this._clearWatch === "function") this._clearWatch();
			this.$delete(success, error);
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
			Object.defineProperty(obj, '_clearWatch', {
				value: null,
				enumerable: false,
				writable: true
			});
		}

		// our save wrapper updates _status and _error as appropriate, before
		// calling the normal callback as well.
		function save(success, error) {
			var resource = this;

			if (!resource.hasOwnProperty('_status')) {
				// this object doesn't have '_status' set yet for some reason
				// (probably it was created via new Resource() rather than
				// through .get() or .query())
				defineMeta(resource);
			}

			resource._save(function() {
				resource._status = "success";
				if (success !== undefined) success(resource);
			}, function(response) {
				resource._status = "error";
				resource._error = response.data;
				if (error !== undefined) error(response.data);
			});
		}

		// `change` constructs a de-bouncing change watcher
		function change(stopTimer) {

			// called when $watch indicates a change. This function checks
			// whether the change is actually meaningful, and if so, prepares
			// to save the resource via the API. We use $timeout to bunch
			// changes together (debouncing) in order to avoid sending loads
			// of requests
			return function(newValue, oldValue) {
				// I'm only interested in saving on actual changes
				if (oldValue === newValue) return;

				// need to check details as well, because === just compares refs
				if (areEqual(oldValue, newValue)) return;

				if (!newValue.hasOwnProperty('_status')) {
					// this object doesn't have '_status' set yet for some reason
					// (probably it was created via new Resource() rather than
					// through .get() or .query())
					defineMeta(newValue);
				}

				// changes have not yet been persisted, so show this
				newValue._status = "pending";
				newValue._error = "";

				// only update server periodically else we'll make too many calls
				if (stopTimer !== undefined) $timeout.cancel(stopTimer);
				stopTimer = $timeout(function() {
					newValue.save();
				}, 500);
			};
		}
	}

	function getActions(serialize, unserialize, extras) {

		// _get does what $resource.get would normally do, but we are
		// going to over-write .get with our own method later.
		// Also set up serialization here

		var actions = {
			'_get': {
				method: 'GET',
				mabelSerialize: true
			},
			'_query': {
				method: 'GET',
				isArray: true,
				mabelSerialize: true
			},
			'_save': {
				method: 'POST',
				mabelSerialize: true
			}
		};
		if (extras !== undefined) {
			for (var i in extras) {
				actions[i] = extras[i];
			}
		}

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
			for (var i=0; i<objs.length; i++) {
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
			for (var i=0; i<objs.length; i++) {
				_objs[i] = unserialize(objs[i]);
			}
			return _objs;
		};
	}
}