var config = require("./src/config.js");
var helpers = require('./src/api/helpers.js');
var express = require('express');
var _ = require("lodash");
var crypto = require("crypto");
var api = require("./src/api/api.js");
var Q = require("q");
var jwt = require("jwt-simple");

module.exports = function(app, done) {
	var swaggerTools = require('swagger-tools');
	var YAML = require('yamljs');

	var swaggerDoc = YAML.load('swagger.yml');
	swaggerDoc.host = config.base_url.replace(/^.*:\/\//, '');

	// add a shared x-swagger-router-controller to all operations because we're going to use
	// the actual path to dispatch methods (see respond)
	swaggerDoc.paths = _.mapValues(swaggerDoc.paths, function(p) {
		return _.mapValues(p, function(op) {
			op["x-swagger-router-controller"] = "respond";
			return op;
		});
	});

	// handle $merge and $without, which are my custom extensions to the schema
	applyCustomisations(swaggerDoc);

	swaggerTools.initializeMiddleware(swaggerDoc, function(middleware) {
		// Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
		app.use(middleware.swaggerMetadata());

		// add our authentication handlers (note not using passport anymore)
		app.use(middleware.swaggerSecurity(getSwaggerAuthObj()));

		// Validate Swagger requests
		app.use(middleware.swaggerValidator());

		// Route validated requests to appropriate controller
		app.use(middleware.swaggerRouter({
			controllers: {
				respond_get: respond,
				respond_post: respond,
				respond_put: respond,
				respond_delete: respond
			}
		}));

		// override a few paths that swagger ui is serving so that we can make customisations
		app.use('/docs', express.static(__dirname + '/docs'));

		// Serve the Swagger documents and Swagger UI
		app.use(middleware.swaggerUi({
			// use the version of swagger UI we have in our dependencies (not just whatever was bundled with swagger-tools)
			// one day I'll do some customisation of the operation layout - there's too much displayed by default.
			swaggerUiDir: __dirname + "/node_modules/swagger-ui/dist"
		}));

		// finally wrap all error responses for consistency
		app.use(function(err, req, res, next) {

			// could log errors here too
			// console.error(err);

			if (typeof err.code === "number") res.status(err.code);
			else if (err.failedValidation) res.status(400);
			else res.status(520);

			res.json({
				success: false,
				error: err,
				message: err.message
			});
			next();
		});
	});
	return done();
};

function checkToken(req, token, next) {
	// TODO (maybe) also look for the access token in a cookie?

	// if we have multiple security handlers (which are ORed
	// together), swagger-ui helpfully adds access_token twice as a
	// query param. This has the effect of making 'token' an array -
	// if that happens, just ignore most of it
	if (typeof token !== "string" && typeof token === "object" && token.length > 0) {
		token = token[0];
	}

	var e;
	if (token === null || token === undefined || (typeof token === "string" && token.trim().length < 1)) {
		e = new Error("No access_token provided.");
		e.code = 401;
		next(e);
		return Q.reject(e);
	}

	if (typeof token !== "string") {
		e = new Error("Unexpected token datatype");
		return Q.reject(e);
	}

	var dec = helpers.checkToken(token);
	if (dec.auth) {
		// this is ripe for performance optimisation - encode the user rather than querying on every request
		// (may result in stale user data, but tbh users don't change very often in mabel).
		var p = api.user(dec.id).get();
		p.catch(function(err) {
			return next(err);
		});
		return p;
	}
	e = new Error("Unauthorised token.");
	e.code = 401;
	next(e);
	return Q.reject(e);
}

function getSwaggerAuthObj() {
	return {

		// simplest auth - just check there's a valid token
		token: function(req, authOrSecDef, token, next) {
			checkToken(req, token, next)
				.then(function(user) {
					req.swagger.params.user = {
						value: user
					};
					next();
				});
		},

		// check whether the user is a member of any groups with admin access
		admin: function(req, secDef, token, next) {
			checkToken(req, token, next)
				.then(function(user) {
					if (_.intersection(user.groups, config.admin_groups).length > 0) {
						// this is an admin
						req.swagger.params.user = {
							value: user
						};
						return next();
					} else {
						var e = new Error("This resource is only accessible to admins.");
						e.code = 403;
						return next(e);
					}
				});
		},

		// maybe a bit fragile - check if the {id} parameter value matches the user's token
		self: function(req, secDef, token, next) {
			checkToken(req, token, next)
				.then(function(user) {
					if (user.id === req.swagger.params.id.value) {
						// we're requesting me!
						req.swagger.params.user = {
							value: user
						};
						return next();
					} else {
						var e = new Error("Cannot access resources belonging to other users.");
						e.code = 403;
						return next(e);
					}
				});
		},

		external: function(req, secDef, token, next) {
			var keys = config.external_keys;
			// eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiQ2hyaXN0b3BoZXIgTGl0dGxlIiwiY29sbGVnZSI6IkVtbWFudWVsIiwiZW1haWwiOiJjbDU1NEBjYW0uYWMudWsifQ.CglOSqxd6TNY0sZgfn9bVtDRXBZnH-TkF9-KYgceaZw
			// decode token using the right key
			
			var key = keys[req.swagger.params.auth_id.value];

			try {
        		var user = jwt.decode(token, key);
        		// as long as decoding succeeds - we're good to go.
        		req.swagger.params.user = {
        			value: user
        		};
        		return next();
			} catch (e) {
		        var err = new Error("Invalid token/auth pair");
		        err.code = 401;
		        throw err;
		    }
		},

		// replacing passport functionality - login with username and password either in the authorization header or as query parameters
		mabel: function(req, secDef, token, next) {
			var e, username, password;

			// check headers first
			if (!("authorization" in req.headers)) {

				// maybe they passed in parameters instead
				if (req.swagger.params.email && req.swagger.params.password) {
					username = req.swagger.params.email.value;
					password = req.swagger.params.password.value;
				} else {
					e = new Error("No authorization provided.");
					e.code = 401;
					return next(e);
				}

			} else {
				// auth header looks like  "Basic Y2hhcmxlczoxMjM0NQ=="  so we need to decode
				// Split on a space, we need the 2nd part
				// create a buffer and tell it the data coming in is base64
				var buf = new Buffer(req.headers.authorization.split(' ')[1], 'base64');
				var plain_auth = buf.toString();

				// At this point plain_auth = "username:password"
				var creds = plain_auth.split(':');
				username = creds[0];
				password = creds[1];
			}

			// now we've got the username and password - actually check they're valid entries
			if (username === undefined || typeof username !== "string" || username.trim().length<1 ||
				password === undefined || typeof password !== "string" || password.trim().length<1) {
				e = new Error("Invalid credentials.");
				e.code = 400;
				return next(e);
			}

			var count = (username.match(/@/g) || []).length;
			if (count !== 1) {
				e = new Error("Invalid email address.");
				e.code = 400;
				return next(e);
			}
			
			// finally check the database and actually perform authentication
			api.user.get_by_email({user: {email: username}})
				.then(function(user) {
					if (user.is_verified === 0) {
						// user is not verified
						e = new Error("This email address has not been verified.");
						e.code = 403; 
						throw e;
					} else {

						// DB only stores md5 hashes, so hash the input to compare
						var hash = crypto.createHash('md5');
						hash.update(password);
						var md5_pass = hash.digest('hex');

						if (md5_pass === user.password_md5) {
							// we're in!
							req.swagger.params.user = {
								value: user
							};
							next();
						} else {
							// incorrect password
							e = new Error("Credentials not recognised.");
							e.code = 401;
							throw e;
						}
					}
				})
				.catch(function(err) {
					next(err);
				});
		}
	};
}

// function validate(oschema, obj) {
// 	var schema;
// 	if ('schema' in oschema) {
// 		schema = oschema.schema;
// 	} else {
// 		// this might be an oversimplification but for our validation we only care about objects anyway
// 		return;
// 	}
	
// 	// currently we only validate one thing - that objects don't have forbidden properties
// 	var i = 0;
// 	if (schema["x-forbid"] !== undefined) {
// 		for (i=0; i<schema["x-forbid"].length; i++) {
// 			if (schema["x-forbid"][i] in obj) {
// 				// TODO: More complete error in the style of swaggers'
// 				var e = new Error("Forbidden property " + schema["x-forbid"][i] + " found in object");
// 				e.code = 400;
// 				throw e;
// 			}
// 		}
// 	}
// 	if (schema.properties !== undefined) {
// 		for (var p in schema.properties) {
		
// 			// validate property schemas
// 			if (p in obj) {
// 				validate(schema.properties[p], obj[p]);
// 			}
// 		}
// 	}
// 	if (schema.allOf !== undefined) {
// 		// validate sub-schemas
// 		for (i=0; i<schema.allOf.length; i++) {
// 			validate(schema.allOf[i], obj);
// 		}
// 	}
// }

function respond(req, res, next) {
	// custom validation here?
	// for (var i = 0; i<req.swagger.operation.parameters.length; i++) {
	// 	var n = req.swagger.operation.parameters[i].name;
	// 	try {
	// 		validate(req.swagger.operation.parameters[i],
	// 				 req.swagger.params[n].value);
	// 	} catch (err) {
	// 		console.log(err);
	// 		return next(err);
	// 	}
	// }

	// NB this might be kind of fragile, I don't know what operationPath is actually used for...
	var resource = req.swagger.operationPath[1].split("/");
	var meth = _.reduce(resource,
		function(meth, pathElm) {
			if (pathElm.length < 1) return api;
			if (pathElm[0] === "{") {
				// this is a URL parameter 
				var paramName = pathElm.replace(/[{}]/g, '');
				var paramValue = req.swagger.params[paramName].value;
				// let's hope the current method is a function!
				return meth(paramValue);
			}
			// otherwise just a regular resource path component
			return meth[pathElm];
		}, null);

	// Call the final method with all the data we have (they're free to ignore it!)
	var data = _.mapValues(req.swagger.params, function(o) {
		return o.value;
	});

	// finally, this should be the right method to call.
	var promise = meth[req.swagger.operationPath[2]](data);
	promise.then(function(result) {
		// if success return result else empty object
		res.json(result || {});
	}, function(err) {
		// log & send error
		console.log(err);
		next(err);
	});
}



function applyCustomisations(globalRoot, root, spaces) {
	// shorthand to kick things off:
	if (arguments.length === 1) {
		return applyCustomisations(globalRoot, globalRoot, "");
	}

	for (var p in root) {
		if (typeof root[p] === "object") {
			root[p] = apply(globalRoot, root[p]);
			applyCustomisations(globalRoot, root[p], spaces + "   ");
		}
	}
}

function safeMerge(o1, o2) {
	if (typeof o1 === "object" && typeof o2 === "object") {
		if (o1 instanceof Array && o2 instanceof Array) {
			return o1.concat(o2);
		} else {
			var o = _.extend({}, o1);
			for (var p in o2) {
				if (p in o) {
					o[p] = safeMerge(o[p], o2[p]);
				} else {
					o[p] = o2[p];
				}
			}
			return o;
		}
	} else if (o1 === undefined) {
		return o2;
	} else if (o2 === undefined) {
		return o1;
	} else {
		if (o1 === o2) {
			return o1;
		} else {
			console.log(o1, o2);
			throw Error("Conflicting value for merge: ");
		}
	}
}

function apply(root, schema) {
	// replace a $merge node with the two subchildren, merged.
	if ('$merge' in schema) {
		// we've got things to merge!
		if (schema.$merge.length !== 2) throw Error("Unexpected number of $merge items");
		var s1 = schema.$merge[0];
		if ('$ref' in s1) s1 = getRef(root, s1.$ref);
		
		var s2 = schema.$merge[1];
		if ('$ref' in s2) s2 = getRef(root, s2.$ref);

		schema = safeMerge(s1, s2);
	}

	// replace a node containing $exclude with one excluding the given properties
	// Note that we don't do any $ref fetching here.
	if ('$exclude' in schema) {
		schema = _.omit(schema, ["$exclude"].concat(schema.$exclude));
	}

	return schema;
}

function getRef(root, ref) {
	var parts = ref.split("/");
	if (parts[0] !== "#") throw Error("Unexpected $ref format");
	parts.shift();
	return _.reduce(parts, function(current, next) {
		return current[next]; 
	}, root);
}