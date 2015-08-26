/**
 * Copyright (C) 2015  Mabel Ticketing 
 * GNU General Public License v2.0
 * https://github.com/mabelticketing/mabel/blob/master/LICENSE.txt
 */

// Responsibility of the router is for authentication and
// marshalling for HTTP.

// imports
var express    = require('express');
var passport   = require('passport');
var bodyParser = require('body-parser');
var api        = require('./api.js');
/*jshint -W079 */
var $          = require('./helpers.js');
var auth       = require('./auth.js');
var io         = require('../../app.js').io;

var router = express.Router();

module.exports = router;


/****************************
* Authentication            *
****************************/

// All API routes should be authenticated with an access_token

router
	.use(
		passport.authenticate('bearer', {
			session: false
		})
	)
	.use(
		bodyParser.json()
	);


/****************************
* Group                     *
****************************/
 
router.route('/group/:id')
	.get(
		auth.admin(),
		function(req, res) {
			$.marshallPromise(res, api.group.id(req.params.id).get() );
		}
	)
	.put(
		auth.admin(),
		function(req, res) {
			$.marshallPromise(res, api.group.id(req.params.id).put($.stripMeta(req.body)) );
		}
	)
	.delete(
		auth.admin(),
		function(req, res) {
			$.marshallPromise(res, api.group.id(req.params.id).del() );
		}
	);

router.route('/group')
	.post(
		auth.admin(),
		function(req, res) {
			$.marshallPromise(res, api.group.post($.stripMeta(req.body)) );
		}
	);

/****************************
* Groups                    *
****************************/

router.route('/groups')
	.get(
		auth.admin(),
		function(req, res) {

			var opts = {};
			if (req.query.from !== undefined) opts.from = parseInt(req.query.from);
			if (req.query.size !== undefined) opts.size = parseInt(req.query.size);
			if (req.query.order !== undefined) opts.order = JSON.parse(req.query.order);
			if (req.query.filter !== undefined) opts.filter = JSON.parse(req.query.filter);
		
			$.marshallPromise(res, api.groups.get(opts));
		}
	);


/****************************
* Payment method            *
****************************/
 
router.route("/payment_method/:id")
	.get(
		auth.admin(),
		function(req, res) {
			$.marshallPromise(res, api.payment_method.id(req.params.id).get());
		}
	);

/****************************
* Payment methods           *
****************************/

router.route("/payment_methods")
	.get(
		auth.admin(),
		function(req, res) {
			$.marshallPromise(res, api.payment_methods.get());
		}
	);


/****************************
* Ticket                    *
****************************/

router.route("/ticket/:id")
	.get(
		auth.admin(),
		function(req, res) {
			$.marshallPromise(res, api.ticket.id(req.params.id).get());
		}
	)
	.put(
		auth.admin(),
		function(req, res) {
			$.marshallPromise(res, api.ticket.id(req.params.id).put($.stripMeta(req.body)));
		}
	);

router.route("/ticket")
	.post(
		auth.admin(),
		function(req, res) {
			$.marshallPromise(res, api.ticket.post($.stripMeta(req.body)));
		}
	);

/****************************
* Tickets                   *
****************************/

router.route('/tickets')
	.get(
		auth.admin(),
		function(req, res) {

			var opts = {};
			if (req.query.from !== undefined) opts.from = parseInt(req.query.from);
			if (req.query.size !== undefined) opts.size = parseInt(req.query.size);
			if (req.query.order !== undefined) opts.order = JSON.parse(req.query.order);
			if (req.query.filter !== undefined) opts.filter = JSON.parse(req.query.filter);
		
			$.marshallPromise(res, api.tickets.get(opts));
		}
	)
	.delete(
		auth.admin(),
		function(req, res) {
			$.marshallPromise(res, api.tickets.del($.stripMeta(req.body)));
		}
	);


/****************************
* Type                      *
****************************/

router.route("/type/:id")
	.get(
		auth.admin(),
		function(req, res) {
			$.marshallPromise(res, api.type.id(req.params.id).get());
		}
	)
	.put(
		auth.admin(),
		function(req, res) {
			$.marshallPromise(res, api.type.id(req.params.id).put($.stripMeta(req.body)));
		}
	)
	.delete(
		auth.admin(),
		function(req, res) {
			$.marshallPromise(res, api.type.id(req.params.id).del());
		}
	);

router.route("/type")
	.post(
		auth.admin(),
		function(req, res) {
			$.marshallPromise(res, api.type.id(req.params.id).put($.stripMeta(req.body)));
		}
	);

/****************************
* Types                     *
****************************/

router.route("/types")
	.get(
		auth.admin(),
		function(req, res) {

			var opts = {};
			if (req.query.from !== undefined) opts.from = parseInt(req.query.from);
			if (req.query.size !== undefined) opts.size = parseInt(req.query.size);
			if (req.query.order !== undefined) opts.order = JSON.parse(req.query.order);
			if (req.query.filter !== undefined) opts.filter = JSON.parse(req.query.filter);
		
			$.marshallPromise(res, api.types.get(opts));
		}
	);

io.of('/types/open')
	.on('connection', function(socket) {
		function emitOpenTypes() {
			api.types.open().then(function(rows) {
				socket.emit('types', rows);
			});
		}

		// Emit open ticket types at intervals of 5 seconds
		setInterval(emitOpenTypes, 5000);
	});


/****************************
* User                      *
****************************/

router.route("/user/:id")
	.get(
		function(req, res, next) {
			if (parseInt(req.params.id) === req.user.id) {
				// Authorised because I can see my own details
				next();
			} else {
				// Requesting someone else's details, so only allowed if admin
				return (auth.admin())(req, res, next);
			} 
		},
		function(req, res) {
			$.marshallPromise(res, api.user.id(req.params.id).get());
		}
	)
	.put(
		function(req, res, next) {
			if (parseInt(req.params.id) === req.user.id) {
				// Authorised because I can update my own details
				next();
			} else {
				// Requesting to update someone else's details, so only allowed if admin
				return (auth.admin())(req, res, next);
			} 
		},
		function(req, res) {
			$.marshallPromise(res, api.user.id(req.params.id).put($.stripMeta(req.body)));
		}
	)
	.delete(
		auth.admin(),
		function(req, res) {
			var id = parseInt(req.params.id);
			if (req.user.id !== id) {
				$.marshallPromise(res, api.user.id(id).del());
			} else {
				res.status(500).send({
					error: 'An admin cannot delete themself.'
				});
			}
		}
	);

router.route("/user/:id/allowance")
	.get(
		function(req, res) {
			$.marshallPromise(res, api.user(req.params.id).allowance.get());
		}
	);

router.route("/user/:id/payment_methods")
	.get(
		function(req, res) {
			$.marshallPromise(res, api.user.id(req.params.id).payment_methods.get());
		}
	);

router.route("/user/:id/types")
	.get(
		function(req, res) {
			$.marshallPromise(res, api.user.id(req.params.id).types.get());
		}
	);

router.route("/user/:id/tickets")
	.get(
		function(req, res, next) {
			if (parseInt(req.params.id) === req.user.id) {
				// Authorised because I can get my own tickets
				next();
			} else {
				// Requesting to get someone else's tickets, so only allowed if admin
				return (auth.admin())(req, res, next);
			}
		},
		function(req, res) {
			$.marshallPromise(res, api.user.id(req.params.id).tickets.get());
		}
	)
	.post(
		function(req, res) {
			$.marshallPromise(res, api.user.id(req.params.id).tickets.post($.stripMeta(req.body)));
		}
	);

router.route("/user")
	.post(
		function(req, res) {
			$.marshallPromise( res, api.user.post($.stripMeta(req.body)));
		}
	);

/****************************
* Users                     *
****************************/

router.route("/users")
	.get(
		auth.admin(),
		function(req, res) {

			var opts = {};
			if (req.query.from !== undefined) opts.from = parseInt(req.query.from);
			if (req.query.size !== undefined) opts.size = parseInt(req.query.size);
			if (req.query.order !== undefined) opts.order = JSON.parse(req.query.order);
			if (req.query.filter !== undefined) opts.filter = JSON.parse(req.query.filter);
			
			$.marshallPromise(res, api.users.get(opts));
		}
	);
