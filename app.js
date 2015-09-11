/**
 * Copyright (C) 2015  Mabel Ticketing
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

// imports
var express = require("express");
var app = express();
var passport = require("passport");
var config = require('./src/config.js');
var server = require('http').Server(app);
var io = require('socket.io')(server);

// bail if it doesn't look like we've got a real config
if (!config.port) throw new Error("I don't think you've initialised the config.");

require("./src/passport-config.js");

// make visible outside module
module.exports.express = express;
module.exports.app = app;
module.exports.io = io;

// set the default directory for templated pages
app.set("views", __dirname + "/views");

// set the default template engine to jade
app.locals.pretty = true;
app.engine('jade', require('jade').__express);

// initialise passportjs
app.use(passport.initialize());

// bind routers
app.use("/", require("./src/app-routes.js"));
app.use("/api", require("./src/api/router.js"));

// try to use swagger on the temp /sapi route
var swaggerTools = require('swagger-tools');
var YAML = require('yamljs');
// The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
var swaggerDoc = YAML.load('json/swagger.yaml');


swaggerTools.initializeMiddleware(swaggerDoc, function(middleware) {
	// Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
	app.use(middleware.swaggerMetadata());

	// Validate Swagger requests
	app.use(middleware.swaggerValidator());

	// Route validated requests to appropriate controller
	app.use(middleware.swaggerRouter({
		useStubs: true,
		controllers: 'src/api/impl'
	}));

	// Serve the Swagger documents and Swagger UI
	app.use(middleware.swaggerUi());

	/*********************************************
	 * This is the regular (non-clustered) option
	 *********************************************/

	server.listen(config.port || 2000);
	console.log("running");
});

// serve content in public/ from root
app.use('/', express.static(__dirname + '/public'));

/****************************************************************************** 
 * If you want to use clustering (run as many instances as you have processors
 * and share the load between them), uncomment the following chunk. You'll
 * need to install cluster2 though -- which I had difficulty with on some
 * machines.
 *******************************************************************************/

// var Cluster   = require('cluster2');
// var c = new Cluster({
// port: config.port || 2000
// });
// c.listen(function(cb) {
// cb(app);
// });