var connection = require("./connection.js");
var runSql = connection.runSql;

module.exports = {
	get: get,
	getAll: getAll
};

function get(user_id, callback) {
	var sql = "SELECT * FROM user WHERE id=?;";
	runSql(sql, [user_id], function(err, users) {
		if (err) return callback(err);
		if (users.length !== 1) return callback({error:users.length + " users match"});
		var groupSql = "SELECT * FROM user_group_membership WHERE user_id=?;";
		runSql(groupSql, [user_id], function(err, groups) {
			if (err) return callback(err);
			users[0].groups = [];
			for (var i=0; i<groups.length; i++) {
				users[0].groups.push(groups[i].group_id);
			}
			callback(null, users[0]);
		});
	});
}
function getAll(callback) {
	runSql("SELECT * FROM user;", callback);
}