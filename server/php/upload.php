<?php

$dreamMode = "";
if (isset($_POST["dreamMode"])) {
	$dreamMode = $_POST["dreamMode"];
}

$resCode = "FAIL";
$resMsg = "No file uploaded.";

$maxImageSize = 800;
$uploadPath = "/upload/new/";
$dreamingPath = "/upload/dreaming/";
$guidePath = "/upload/guides/";
if ($dreamMode != null && $dreamMode == "hires") {
	$resMsg = "HiRes option not available.";
	print($resCode.":".$resMsg);
	exit("HiRes option not available.");

	$maxImageSize = 2400;
	$uploadPath = "/upload/secondary/new/";
}

function generate_uuid() {
    return sprintf( '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ),
        mt_rand( 0, 0xffff ),
        mt_rand( 0, 0x0fff ) | 0x4000,
        mt_rand( 0, 0x3fff ) | 0x8000,
        mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff )
    );
}

if ($_FILES["file"] != null) {
	if (filesize($_FILES["file"]["tmp_name"]) > 4000000) {
		$resCode = "FAIL";
		$resMsg = "Filesize too big. Try a smaller file.";	
	}
	else
	{
		if (isset($_POST["guide"]) && $_POST["guide"] == "true") {
			$uniqid = uniqid();

			move_uploaded_file($_FILES["file"]["tmp_name"], $guidePath.$uniqid.".jpg");

			// done
			$resCode = "OK";
			$resMsg = $uniqid;			
		}
		else {
			$uniqid = generate_uuid(); //uniqid();
			//print_r($_FILES);

			//$new_image_name = $uniqid."_".$_FILES["file"]["name"].".jpg";
			if ($_POST["dreamStyle"] == "guided_") {
				$new_image_name = $_POST["dreamStyle"].$_POST["guideImage"]."_".$uniqid.".jpg";	
			}
			else {
				$new_image_name = $_POST["dreamStyle"].$uniqid.".jpg";
			}

			$tmp_image_path = "/tmp/resizing_".$new_image_name;

			move_uploaded_file($_FILES["file"]["tmp_name"], $tmp_image_path);

			// downscale img
			$rsr_org = imagecreatefromjpeg($tmp_image_path);

			$exif = exif_read_data($tmp_image_path);
			if(!empty($exif['Orientation'])) {
				switch($exif['Orientation']) {
					case 8:
					    $rsr_org = imagerotate($rsr_org,90,0);
					    break;
					case 3:
					    $rsr_org = imagerotate($rsr_org,180,0);
					    break;
					case 6:
					    $rsr_org = imagerotate($rsr_org,-90,0);
					    break;
				} 
			}

			$data = getimagesize($tmp_image_path);
			$width = ImageSx($rsr_org); //$data[0];
			$height = ImageSy($rsr_org); //$data[1];

			error_log("image size: ".$width."/".$height);

			if ($width > $maxImageSize || $height > $maxImageSize) {
				if ($width >= $height) {
					$ratio = $width/$maxImageSize;
					$rsr_scl = imagescale($rsr_org, $maxImageSize, $height/$ratio, IMG_BICUBIC_FIXED);
				}
				else {
					$ratio = $height/$maxImageSize;
					$rsr_scl = imagescale($rsr_org, $width/$ratio, $maxImageSize, IMG_BICUBIC_FIXED);	
				}
				imagejpeg($rsr_scl, $tmp_image_path, 95);
				imagedestroy($rsr_scl);		
			}
			imagedestroy($rsr_org);

			rename($tmp_image_path, $uploadPath.$new_image_name);
			
			// done
			$resCode = "OK";
			$resMsg = $new_image_name;
		}
	}
}

$fi = new FilesystemIterator($uploadPath, FilesystemIterator::SKIP_DOTS);
$count_queue = iterator_count($fi);
$fi = new FilesystemIterator($dreamingPath, FilesystemIterator::SKIP_DOTS);
$count_queue += iterator_count($fi);

print($resCode.":".$resMsg.":".$count_queue);

?>
