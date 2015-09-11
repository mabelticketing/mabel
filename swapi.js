var config = require("./src/config.js");
var passport = require('passport');
var express = require('express');
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
					e.code = "AUTH";
					return next(e);	
				}
				passport.authenticate('bearer', function(err, user, info) {
					if (err) {
						return next(err);
					}
					if (!user) {
						e = new Error("Unauthorised token.");
						console.log(info);
						e.code = "AUTH";
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
			controllers: 'src/api/impl'
		}));

		// over-ride a few paths that swagger ui is serving so that we can make customisations
		app.use('/docs', express.static(__dirname + '/docs'));

		// Serve the Swagger documents and Swagger UI
		app.use(middleware.swaggerUi());

		// finally wrap all error responses for consistency
		app.use(function(err, req, res, next) {
			console.error(err);
			switch(err.code) {
				case "AUTH":
					res.status(401);
					break;
				case "INVALID_TYPE":
					res.status(400);
					break;
				default:
					res.status(500);
					break;
			}

			res.json({success:false, error: err, message: err.message});
			next();
		});
	});
	return done();
};