var config = require("./src/config.js");
var passport = require('passport');
var express = require('express');
var _ = require("lodash");
var api = require("./src/api/api.js");
// var serveStatic = require('serve-static');

module.exports = function(app, done) {
	var swaggerTools = require('swagger-tools');
	var YAML = require('yamljs');
	// The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
	var swaggerDoc = YAML.load('swagger.yml');

	// strip protocol (e.g. http://), but otherwise use the config url
	swaggerDoc.host = config.base_url.replace(/^.*:\/\//, '');

	swaggerTools.initializeMiddleware(swaggerDoc, function(middleware) {
		// Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
		app.use(middleware.swaggerMetadata());

		// secure endpoints according to the auth handler?
		app.use(middleware.swaggerSecurity({
			token: function (req, authOrSecDef, token, next) {
				var e;
				if (token===null || token===undefined || token.trim().length<1) {
					e = new Error("No access_token provided.");
					e.code = 401;
					return next(e);	
				}
				passport.authenticate('bearer', function(err, user, info) {
					if (err) {
						return next(err);
					}
					if (!user) {
						e = new Error("Unauthorised token.");
						console.log(info);
						e.code = 401;
						return next(e);
					}
					req.user = user;
					return next();
				})(req, null, next);
				
			}
		}));

		// Validate Swagger requests
		app.use(middleware.swaggerValidator());

		// Route validated requests to appropriate controller
		app.use(middleware.swaggerRouter({
			useStubs: true,
			controllers: {
				user_myget: function(req, res, next) {
					// NB this might be kind of fragile, I don't know what operationPath is actually used for...
					var resource = req.swagger.operationPath[1].split("/");
					var meth = _.reduce(resource,
						function(meth, pathElm) {
							if (pathElm.length<1) return api;
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
					var data = _.mapValues(req.swagger.params, function(o) {return o.value;});

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
			}
		}));

		// over-ride a few paths that swagger ui is serving so that we can make customisations
		app.use('/docs', express.static(__dirname + '/docs'));

		// Serve the Swagger documents and Swagger UI
		app.use(middleware.swaggerUi());

		// finally wrap all error responses for consistency
		app.use(function(err, req, res, next) {
			
			console.error(err);

			if (typeof err.code === "number") res.status(err.code);
			else if (err.failedValidation) res.status(400);
			else res.status(520);
			
			res.json({success:false, error: err, message: err.message});
			next();
		});
	});
	return done();
};