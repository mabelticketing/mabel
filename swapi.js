var config = require("./src/config.js");
var helpers = require('./src/api/helpers.js');
var express = require('express');
var _ = require("lodash");
var crypto = require("crypto");
var api = require("./src/api/api.js");
// var serveStatic = require('serve-static');

module.exports = function(app, done) {
	var swaggerTools = require('swagger-tools');
	var YAML = require('yamljs');
	// The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
	var swaggerDoc = YAML.load('swagger.yml');

	// strip protocol (e.g. http://), but otherwise use the config url
	swaggerDoc.host = config.base_url.replace(/^.*:\/\//, '');

	// add a shared x-swagger-router-controller to all operations because we're going to use
	// the actual path to dispatch methods (see respond) and I cba to annotate my doc
	swaggerDoc.paths = _.mapValues(swaggerDoc.paths, function(p) {
		return _.mapValues(p, function(op) {
			op["x-swagger-router-controller"] = "respond";
			return op;
		});
	});

	swaggerTools.initializeMiddleware(swaggerDoc, function(middleware) {
		// Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
		app.use(middleware.swaggerMetadata());

		// secure endpoints according to the auth handler?
		var checkToken = function(req, token, next) {
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
			}

			if (typeof token !== "string") 
				throw new Error("Unexpected token datatype");
			
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
		};
		app.use(middleware.swaggerSecurity({
			token: function(req, authOrSecDef, token, next) {
				checkToken(req, token, next);
			},
			admin: function(req, secDef, token, next) {
				checkToken(req, token, next)
					.then(function(user) {
						if (_.intersection(user.groups, config.admin_groups).length > 0) {
							// this is an admin
							return next();
						} else {
							var e = new Error("This resource is only accessible to admins.");
							e.code = 403;
							return next(e);
						}
					});
			},
			self: function(req, secDef, token, next) {
				checkToken(req, token, next)
					.then(function(user) {
						if (user.id === req.swagger.params.id.value) {
							// we're requesting me!
							return next();
						} else {
							var e = new Error("Cannot access resources belonging to other users.");
							e.code = 403;
							return next(e);
						}
					});
			},
			mabel: function(req, secDef, token, next) {
				console.log("Requested mabel check");
				var e;

				// If they pass in a basic auth credential it'll be in a
				// header called "Authorization" (note NodeJS lowercases the
				// names of headers in its request object)
				var username, password;
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
					// auth is in base64(username:password)  so we need to decode the base64
					// Split on a space -- the original auth looks like  "Basic Y2hhcmxlczoxMjM0NQ==" and we need the 2nd part
					// create a buffer and tell it the data coming in is base64
					var buf = new Buffer(req.headers.authorization.split(' ')[1], 'base64');
					var plain_auth = buf.toString();

					// At this point plain_auth = "username:password"
					var creds = plain_auth.split(':');
					username = creds[0];
					password = creds[1];
				}
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
				
				api.user.get_by_email(username)
					.then(function(user) {
						if (user.is_verified === 0) {
							// user is not verified
							e = new Error("This email address has not been verified.");
							e.code = 403; 
							throw e;
						} else {
							var hash = crypto.createHash('md5');
							hash.update(password);
							var md5_pass = hash.digest('hex');

							if (md5_pass === user.password_md5) {
								next();
							} else {
								// incorrect password
								e = new Error("Invalid credentials.");
								e.code = 401;
								throw e;
							}
						}
					})
					.catch(function(err) {
						next(err);
					});
			}
		}));

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

			console.error(err);

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

function respond(req, res, next) {
	// NB this might be kind of fragile, I don't know what operationPath is actually used for...
	var resource = req.swagger.operationPath[1].split("/");
	var meth = _.reduce(resource,
		function(meth, pathElm) {
			if (pathElm.length < 1) return api;
			if (pathElm[0] === "{") {
				// this is a URL parameter 
				var paramName = "{id}".replace(/[{}]/g, '');
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