<?php

error_reporting(E_ALL);



echo $_FILES['fileToUpload']['error'] . "<br>" ;

// print_r($_FILES);

$target_dir = "uploads/";
$target_file = $target_dir . basename($_FILES["fileToUpload"]["name"]);
$uploadOK = 1;
// echo $target_dir;
echo $target_file . "<br>" ;

var_dump($_FILES);
var_dump($_FILES[fileToUpload]);
var_dump($target_file);

if (move_uploaded_file($_FILES["fileToUpload"]["tmp_name"], $target_file)) {
	echo "The file " . basename($_FILES["fileToUpload"]["name"]) . " has been uploaded";
}
else {
	echo "Sorry there was an issue uploading your file";
	echo $_FILES['fileToUpload']['error'];

}


?>