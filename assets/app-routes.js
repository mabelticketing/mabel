
var express = module.parent.exports.express;

var router = express.Router();

router.get("/", function(req, res) {
	res.render("index.html");
});

module.exports = router;
