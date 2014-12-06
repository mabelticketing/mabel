/*jshint unused:true, bitwise:true, eqeqeq:true, undef:true, latedef:true, eqnull:true */
/* global require, module, console */

// imports
var express = require("express");
var app     = express();

// make visible outside module
module.exports.express = express;
module.exports.app     = app;

// import string module
var __ = require("./assets/strings.js");


/* ROUTES */
var APPRouter = require("./assets/app-routes.js");
var APIRouter = require("./assets/api-routes.js");

app.use("/", APPRouter);
app.use("/api", APIRouter);


// listen on port 2000
app.listen(2000);