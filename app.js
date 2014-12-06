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

app.get("/", function(req,res) {
	res.send(__("You have joined the queue."));
});


// listen on port 2000
app.listen(2000);