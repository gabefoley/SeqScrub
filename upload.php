
<?php
// header("access-control-allow-origin: http://eutils.ncbi.nlm.nih.gov");
// header("access-control-allow-origin: http://uniprot.org");
// header("access-control-allow-origin: *");


// $http_origin = $_SERVER['HTTP_ORIGIN'];

// if ($http_origin == "http://eutils.ncbi.nlm.nih.gov" || $http_origin == "http://uniprot.org")
// {  
//     header("Access-Control-Allow-Origin: $http_origin");
// }

function cors() {

    // Allow from any origin
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        // Decide if the origin in $_SERVER['HTTP_ORIGIN'] is one
        // you want to allow, and if so:
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');    // cache for 1 day
    }

}



// Setup directory to store uploads
$target_dir = "uploads/";
$target_file = $target_dir . basename($_FILES["file"]["name"]);
$tree_file = $target_dir . basename($_FILES["tree"]["name"]);

$returnArray = array();

// Pattern to check if line is a header
$headerPattern = "/^>.*/";
$seq = '';
$seqCount = 0;


function checkUpload($filename, $file) {


// Check to see if we can upload the file
if (move_uploaded_file($_FILES[$filename]["tmp_name"], $file)) {

}
else {
	echo "Sorry there was an issue uploading your file";
	exit;

}
}


checkUpload("file", $target_file);

if ($_FILES["tree"]["name"]){
	checkUpload("tree", $tree_file);
}


$file = fopen($target_file, 'rb');
while (($line = fgets($file)) !== false){
	
	// Clean up any instances of repeating pipe symbols
	$line = str_replace("||", "|", $line);
	
	// If we are at an identifier
	if (preg_match($headerPattern, $line)){
		if ($seq != ''){
			$returnArray[$seqCount]['seq'] = $seq;
			$seq = '';
			$seqCount +=1;
		}

		$lineArray = preg_split("/[\s,|_\/]+/", $line);



		$type = substr($lineArray[0], 1);
		$id = "";



		if ($type == "XP" || $type == "XM" || $type == "XR" || $type == "WP" || $type == "NP" || $type == "NC" || $type == "NG" || $type == "NM" || $type == "NR") {
			$id = $type . "_" . $lineArray[1];

		} elseif ($type == "pdb" || $type == "sp" || $type == "tr" || $type == "gi"){
			$id = $lineArray[1];
		


		} else {
			$id = $type;
			$type = "";
			

		}

			// echo $trimmedHeader;
		$returnArray[] = array('originalHeader' => $line, 'type' => $type ,'id' => $id);

		// echo '<pre>'; print_r($lineArray); echo '</pre>';

			// echo "\n And then... \n";
		// $trimmedHeader = preg_split("/\|/ ", $lineArray[0])[1];


		// }
		// else {
		// 	$trimmedHeader = substr(preg_split("/\|/ ", $lineArray[0])[0], 1);
		// // echo $trimmedHeader;
		// 	$returnArray[] = array('originalHeader' => $line, 'type' => substr($lineArray[0], 1, 2),'id' => $trimmedHeader);


		// }

		// // If ID is >gi, then try to map to Accession ID instead
		// if (substr($lineArray[0], 0, 3 ) === ">gi" && $lineArray[3]){
		// 	$trimmedHeader = preg_split("/\|/", $lineArray[0])[1];

		// 	// Create the information to return
		// 	$returnArray[] = array('originalHeader' => $line, 'type' => 'gi','id' => $trimmedHeader);
		// }

		// // If ID is >tr, then trim the EntryName information and just leave the unique identifier
		// elseif (substr($lineArray[0], 0, 3 ) === ">tr"){
		// 	$trimmedHeader = preg_split("/\|/", $lineArray[0])[1];
		// 	$returnArray[] = array('originalHeader' => $line, 'type' => 'tr', 'id' => $trimmedHeader);


		// }

		// else {

		// 	// Trim the ">" symbol from the header
		// 	$trimmedHeader = substr($lineArray[0], 1);

		// 	// Create the information to return
		// 	$returnArray[] = array('originalHeader' => $line, 'type' => substr($lineArray[0], 0, 3 ),'id' => $trimmedHeader);
		// }

	}

	else {

	// Add all of the lines of the sequence to the sequence object
	$seq .= str_replace(array("\r\n", "\n\r", "\n", "\r"), '', $line);
	}
}




// Create object to return

$returnArray[$seqCount]['seq'] = $seq;

$file = fopen($tree_file, 'rb');
while (($line = fgets($file)) !== false){
	$returnArray[$seqCount + 1]['tree'] = $line;
	}



$jsonData = json_encode($returnArray);
echo $jsonData;


?>