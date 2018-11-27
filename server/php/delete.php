<?php

error_log("delete.php called: ".$_GET["imageName"]);
$filename = $_GET["imageName"];

if ($filename != null) {
	$base = "/data/www/default/dreams";

	$explodedFilename = explode("/", $filename);
	$filename = $explodedFilename[count($explodedFilename)-1];

	error_log("delete image: ".$base."/".$filename);

	unlink($base."/".$filename);
}

?>