
var express = module.parent.exports.express;

var router = express.Router();
var __ = require("./assets/strings.js");


router.get("/", function(req, res) {
	res.json({"Welcome" : __("welcome to the api")});
});

module.exports = router;
