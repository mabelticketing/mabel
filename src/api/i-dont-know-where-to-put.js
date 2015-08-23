
function setGroups(user, groups) {
	// we expect this to be a full specification of user groups
	// i.e. any groups not mentioned should be removed
	var sql = "DELETE FROM user_group_membership WHERE user_id=?;";
	var data = [user.id];
	var insql = "INSERT INTO user_group_membership SET ?;";

	// prepare a statement for each group membership
	for (var i = 0; i < groups.length; i++) {
		sql += insql;
		data.push({
			user_id: user.id,
			group_id: parseInt(groups[i])
		});
	}
	// make sure to enable multi-statement
	return runSql(sql, data);
}


function summary(opts) {
	var sql = connection.getFilteredSQL("ticket_summary", opts);

	return runSql(sql);
}

function summary_byuser(opts) {
	var sql = connection.getFilteredSQL("tickets_grouped_by_user", opts);

	return runSql(sql);
}