var express = require("express");
var apiRouter = require("../routes.js");
var api = require("../api.js");
var router = express.Router({
	mergeParams: true
});
module.exports = router;

router.route("/:event_id")
	.post(
		function(req, res, next) {
			// check we can book (that we're at the front of the queue an' all)
			api.booking.canBook(req.user.id, req.params.event_id, function(err, result) {
				if (err) return next(err);
				if (!result.open) return next("Booking not open for this user");
				next();
			});

		},
		function(req, res) {
			// actually post the booking

		}
	);

// determine whether the current user is able to book or not
router.route("/:event_id/open")
	.get(
		function(req, res) {
			api.booking.canBook(req.user, req.params.event_id, apiRouter.marshallResult(res));
		}
	);

// determine whether the current user is able to book or not
router.route("/:event_id/queue")
	// TODO: Do something with event_id
	.post( // join the queue
		function(req, res) {
			res.json(api.booking.joinQueue(req.user.id, req.params.event_id));
		}
	)
	.get( // get queue status
		function(req, res) {
			res.json(api.booking.getStatus(req.user.id, req.params.event_id));
		}
	)
	.delete( // leave the queue
		function(req, res) {
			res.json(api.booking.leaveQueue(req.user.id, req.params.event_id));
		}
	);