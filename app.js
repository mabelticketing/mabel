// imports
var express   = require("express");
var app       = express();
var passport  = require("passport");
var config    = require('./src/config.js');
var Cluster   = require('cluster2');
require("./src/passport-config.js");

// make visible outside module
module.exports.express = express;
module.exports.app     = app;

// set the default directory for templated pages
app.set("views", __dirname + "/views");

// set the default template engine to ejs - for static html
app.locals.pretty = true;
app.engine('jade', require('jade').__express);

/* ROUTES */
var APPRouter = require("./src/app-routes.js");
var APIRouter = require("./src/api/routes.js");

app.use(passport.initialize());
app.use("/", APPRouter);
app.use("/api", APIRouter);

// serve static content in assets from root
app.use('/', express.static(__dirname + '/assets'));


var c = new Cluster({
	port: config.port || 2000
});
c.listen(function(cb) {
	cb(app);
});


// app.listen(config.port || 2000);
