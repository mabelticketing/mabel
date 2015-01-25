<?php
$EMMA_GRP=2;
$ALUM_GRP=4;
$key_file = file('key.txt');
$SECRET_KEY=trim($key_file[0]);

if (count($argv) > 1) {
	// this was called from the command line
	$options = getopt("c:e:");
	$crsid = $options['c'];
	$email = $options['e'];
} else {
	if (strcasecmp($_GET['key'], $SECRET_KEY) == 0) {
		$crsid = $_GET['c'];
		$email = $_GET['e'];
	} else  {
		die("You are not authorised to access this resource.");
	}
}

$groups = array();

// first check IBIS if possible
if (! empty($crsid) ) {

	require_once "ibisclient/client/IbisClientConnection.php";
	require_once "ibisclient/methods/GroupMethods.php";
	require_once "ibisclient/methods/PersonMethods.php";

	$emm_grp_ids = array("002292", "001760", "002225");
	$conn = IbisClientConnection::createConnection();
	$pm = new PersonMethods($conn);
	$is_emma = false;
	foreach ($emm_grp_ids as $id) {
		if ( $pm->isMemberOfGroup('crsid', $crsid, $id) ) {
			array_push($groups, $EMMA_GRP);
			break;
		}
	}

	// next check the authorised members' list
	$lines = file('auth_members_crsid.txt');

	foreach ($lines as $line) {
		if (strcasecmp(trim($crsid), trim($line) ) == 0) {
			array_push($groups, $EMMA_GRP);
			break;
		}
	}
}


// finally check the authorised alumni list
if (! empty($email) ) {
	$lines = file('auth_alumn.txt');

	foreach ($lines as $line) {
		if (strcasecmp(trim($email), trim($line) ) == 0) {
			array_push($groups, $ALUM_GRP);
			break;
		}
	}
}

$groups = array_unique($groups);
$json = json_encode($groups);
echo ($json);
?>
