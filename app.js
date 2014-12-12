/*jshint unused:true, bitwise:true, eqeqeq:true, undef:true, latedef:true, eqnull:true */
/* global require, module, console, __dirname */

// imports
var express   = require("express");
var app       = express();
var passport  = require("passport");
var config    = require('./assets/config.js');
require("./assets/passport-config.js");

// make visible outside module
module.exports.express = express;
module.exports.app     = app;

// import string module
var __ = require("./assets/strings.js");

// set the default directory for templated pages
app.set("views", __dirname + "/views");

// set the default template engine to ejs - for static html
app.engine('jade', require('jade').__express);

/* ROUTES */
var APPRouter = require("./assets/app-routes.js");
var APIRouter = require("./assets/api-routes.js");

app.use(passport.initialize());
// passport session relies on express session
// app.use(passport.session());
app.use("/", APPRouter);
app.use("/api", APIRouter);

// listen on port 2000
app.listen(config.port || 2000);