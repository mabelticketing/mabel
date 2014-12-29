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
function MabelResource($http, $resource, $rootScope, $timeout, $q) {

	// this is the function which will be injected to our resource factories
	return function(url, params, actions, config) {

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

		// our MabelResource overrides the default set of $resource actions
		actions = getActions(actions, serialize, unserialize);
		var Resource = $resource(url, params, actions);

		for (var action in actions) {
			var originalMethod = Resource[action];
			Resource[action] = getWrapper(Resource, actions[action], originalMethod);
		}
		var methods = getWrapperMethods(Resource, areEqual);

		// override get and query methods
		Resource.get = methods.get;
		Resource.query = methods.query;
		Resource.prototype.remove = methods.remove;
		Resource.prototype.delete = methods.delete;
		Resource.prototype.save = methods.save;

		return Resource;
	};

	// generate some wrappers for some of the default resource methods
	function getWrapperMethods(Resource, areEqual) {
		return {
			save: save,
			remove: remove,
			delete: remove,
			query: query,
			get: get
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
			return promise.then(function() {
				resource._status = "success";
			}, function(response) {
				if (response === "aborted") {
					// we don't need to notify the user of aborted requests
					return;
				}
				resource._status = "error";
				resource._error = response.data;
			});
		}
		// this wrapper for delete just removes the watch before deleting (if
		// one has been set)
		function remove() {
			// remove is called as an instance method
			var resource = this;
			if (typeof resource._clearWatch === "function") resource._clearWatch();
			resource.$delete.apply(resource, arguments);
		}

		// Our wrapper for query sets up a watch on each of the new resources when they arrive
		function query() {
			// query is called as a class method, so we use Resource
			var resource = Resource._query.apply(this, arguments);
			var promise = resource.$promise;
			promise.then(function(value) {
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
					var clearWatch = $rootScope.$watch(getValue(i), change(areEqual), true);

					// define non-enumerable properties so they won't show up in the DB
					defineMeta(value[i]);
					value[i]._clearWatch = clearWatch;
				}
				return value;
			});
			return resource;
		}

		// Our wrapper for query sets up a watch on each of the new resources when they arrive
		function get() {
			// query is called as a class method, so we use Resource
			var resource = Resource._get.apply(this, arguments);
			var promise = resource.$promise;
			promise.then(function(value) {

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

				var clearWatch = $rootScope.$watch(getValue, change(areEqual), true);

				// define non-enumerable properties so they won't show up in the DB
				defineMeta(value);
				value._clearWatch = clearWatch;
				return value;
			});
			return resource;
		}
	}


	// constructs a de-bouncing change watcher, using areEqual to
	// determine if an object has changed
	function change(areEqual) {

		var stopTimer;

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

			// if there is a pending request - cancel it! If we don't cancel,
			// we might send the save request and then receive updated data,
			// which will trigger another save, which might arrive before the
			// first save has returned, and loop...
			if (newValue._abort !== undefined) {
				newValue._abort();
			}

			// changes have not yet been persisted, so show this
			newValue._status = "pending";
			newValue._error = "";

			// only update server periodically else we'll make too many calls
			if (stopTimer !== undefined) $timeout.cancel(stopTimer);
			stopTimer = $timeout(function() {
				var promise = newValue.save();
				promise.then(function() {
						console.log("success at changing");
					},
					function() {
						console.log("fail");
					});
			}, 500);
		};
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

	// return set of actions combining default actions with the given extras,
	// augmented with the given (un)serialize methods which will be called for
	// each of the requests made through this resource
	function getActions(extras, serialize, unserialize) {

		// _get does what $resource.get would normally do, but we are
		// going to over-write .get with our own method later.
		// Also set up serialization here
		var actions = {
			'_get': {
				method: 'GET',
				mabelSerialize: true,
			},
			'_query': {
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

	// creates a wrapper around a resource action method which augments the
	// returned promise with an abort() method to cancel the action	
	function getWrapper(Resource, action, originalMethod) {
		return function() {

			// interpret arguments as angular does itself
			var args = getActionParams(arguments,
				/^(POST|PUT|PATCH)$/i.test(action.method));

			// only pass on the params and data to the original method
			// (we will take charge of calling callbacks ourselves)
			var newArguments = [];
			if (args.params !== undefined) newArguments.push(args.params);
			if (args.data !== undefined) newArguments.push(args.data);

			// create a new promise which we can control via deferred. 
			var deferred = $q.defer();

			var value, // the current resource
				innerPromise, // the promise of the inner action method
				returnValue; // the value this method will return

			// A static method call returns a resource, but an instance call just
			// returns the promise
			var result = originalMethod.apply(this, newArguments);
			if (this instanceof Resource) {

				// the easy case - don't need to create a new resource
				innerPromise = result;
				value = args.data;

				// instance call returns the promise
				returnValue = deferred.promise;
			} else {

				// Create a new resource to return.
				// We make a copy rather than modifying innerRes directly
				// because innerRes will be 'filled in' when innerRes.$promise
				// resolves. This is undesirable - if we've aborted the
				// request then we don't expect the resource to change in the
				// future
				value = angular.copy(result);
				innerPromise = result.$promise;

				// static call returns the new resource itself
				returnValue = value;
			}

			// deferred.promise should resolve as soon as innerRes.$promise
			// does, but we can also cancel it via deferred.reject() manually.
			innerPromise.then(function(newResource) {

				// We would like the resource we prepared earlier to get
				// 'filled in', so we copy the contents of innerRes into it,
				// before triggering the promise resolutions with it
				angular.extend(value, newResource);
				deferred.resolve(value);
			}, function() {
				deferred.reject.apply(deferred, arguments);
			});

			// attach the callbacks to our promise, and augment the returned
			// promise with our hallowed abort method.
			deferred.promise.then(args.success, args.error);
			deferred.promise.abort = function() {
				deferred.reject('aborted');
				delete value.abort;
			};
			Object.defineProperty(value, '_abort', {
				value: deferred.promise.abort,
				enumerable: false,
				writable: true
			});
			value.$promise = deferred.promise;

			return returnValue;
		};
	}
	
	// extracts arguments in the same way angular-resource.js does
	function getActionParams(args, hasBody) {
		var a1 = args[0],
			a2 = args[1],
			a3 = args[2],
			a4 = args[3];
		// (v1.3.8 ~line 523)				
		var params, data, error, success;
		/* jshint -W086 */
		/* (purposefully fall through case statements) */
		switch (arguments.length) {
			case 4:
				error = a4;
				success = a3;
				//fallthrough
			case 3:
			case 2:
				if (typeof a2 === "function") {
					if (typeof a1 === "function") {
						success = a1;
						error = a2;
						break;
					}

					success = a2;
					error = a3;
					//fallthrough
				} else {
					params = a1;
					data = a2;
					success = a3;
					break;
				}
			case 1:
				if (typeof a1 === "function") success = a1;
				else if (hasBody) data = a1;
				else params = a1;
				break;
			case 0:
				break;
		}
		/* jshint +W086 */
		/* (purposefully fall through case statements) */
		return {
			params: params,
			data: data,
			error: error,
			success: success
		};
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