/**
 * Copyright (C) 2015  Mabel Ticketing
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

// imports
var express = require("express");
var app = express();
var config = require('./src/config.js');
var server = require('http').Server(app);
var connection = require('./src/api/connection.js');
var io = require('socket.io')(server);

// bail if it doesn't look like we've got a real config
if (!config.port) throw new Error("I don't think you've initialised the config.");

// make visible outside module
module.exports.express = express;
module.exports.app = app;
module.exports.io = io;

// serve content in public/ from root
app.use('/', express.static(__dirname + '/public'));

// initalise swagger api
var swapi = require("./swapi.js");
swapi(app, listen);

// initialise socket listeners
setupSockets();

function listen() {


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

	/*********************************************
	 * This is the regular (non-clustered) option
	 *********************************************/

	 server.listen(config.port || 2000);
	 console.log("running");	
}

function setupSockets() {

	io.on('connection', function(socket){
		console.log('a user connected');
		socket.on('disconnect', function(){
			console.log('user disconnected\n');
		});

		socket.on('booking_arrival', function(data) {
			console.log("Someone arrived");
			console.log(data);
		});
	});

	setInterval(function() {
		connection
			.runSql('select distinct group_id, ticket_type_id from group_access_right where open_time < UNIX_TIMESTAMP() and close_time > UNIX_TIMESTAMP()')
			.then(function(types) {
				io.emit('open_types', types);
			});
	}, 3000);
}