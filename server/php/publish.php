<?php

$uploadPath = "/var/www/html/dreams/public";

$resCode = "FAIL";
$resMsg = "No file uploaded.";

if ($_FILES["file"] != null) {
	if (filesize($_FILES["file"]["tmp_name"]) > 4000000) {
		$resCode = "FAIL";
		$resMsg = "Filesize too big. Try a smaller file.";	
	}
	else
	{
		//print_r($_FILES);

		move_uploaded_file($_FILES["file"]["tmp_name"], $uploadPath."/".$_FILES["file"]["name"]);

		// done
		$resCode = "OK";
		$resMsg = $_FILES["file"]["name"];
	}
}

print($resCode.":".$resMsg);

?>
