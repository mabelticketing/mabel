var connection = require("./connection.js");
var runSql = connection.runSql;

module.exports = {
	getAll: getAll,
	setGroups: setGroups
};

function getAll() {
	// TODO: visibility of groups for admins of different events?
	return runSql("SELECT * FROM user_group");
}

function setGroups(user, groups) {
	// we expect this to be a full specification of user groups
	// i.e. any groups not mentioned should be removed
	var sql = "DELETE FROM user_group_membership WHERE user_id=?;";
	var data = [user.id];
	var insql = "INSERT INTO user_group_membership SET ?;";

	// prepare a statement for each group membership
	for (var i=0; i<groups.length; i++) {
		sql += insql;
		data.push({user_id:user.id, group_id: parseInt(groups[i])});
	}
	// make sure to enable multi-statement
	return runSql(sql, data, true);
}

function get() {

}