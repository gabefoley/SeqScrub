<?php



$target_dir = "uploads/";
$target_file = $target_dir . basename($_FILES["file"]["name"]);

$returnArray = array();
$headerPattern = "/^>.*/";
$seq = '';
$seqCount = 0;

if (move_uploaded_file($_FILES["file"]["tmp_name"], $target_file)) {
	// echo "<br>The file " . basename($_FILES["fileToUpload"]["name"]) . " has been uploaded<br>";
}
else {
	echo "Sorry there was an issue uploading your file";
	exit;

}

if (isset($_POST['cleanID'])) {
	echo 'We have cleanID<br>';
}

if (isset($_POST['illegalChars'])){
	// echo 'We have illegalChars<br>';
}



$fp = fopen($target_file, 'rb');
while (($line = fgets($fp)) !== false){
	// Clean up any instances of repeating pipe symbols
	$line = str_replace("||", "|", $line);
	if (preg_match($headerPattern, $line)){
		if ($seq != ''){
			$returnArray[$seqCount]['seq'] = $seq;
			// $seqArray = array('seq' => $seq);
			// print_r($returnArray);
			// $returnArray = $returnArray + $seqArray;
			
			// $returnArray = array_merge($returnArray, $seqArray);
			$seq = '';
			$seqCount +=1;
		}
		// echo $line . "<br/>" ;
		// $returnArray['originalHeader'] = $line;

		$lineArray = preg_split("/\/|\|/", $line);
		if ($lineArray[0] == ">gi"){
			// $returnValue = "$lineArray[3]";

			// echo "$lineArray[3]"  . "<br/>"  ;
			$returnArray[] = array('originalHeader' => $line,'trimmedHeader' => $lineArray[3], 'seqtype' => $lineArray[0]);
			// $returnArray['trimmedHeader'] = $lineArray[3];
		}
		else {
		// echo "$lineArray[1]"  . "<br/>" ;
		// $returnValue = "$lineArray[1]";
		// $returnArray.push("$lineArray[1]");
		// echo "$lineArray[1]";
		$returnArray[] = array('originalHeader' => $line,'trimmedHeader' => $lineArray[1], 'seqtype' => $lineArray[0]);
		}


		// echo "$line<br>";
			// array_push($returnArray, $returnValue);

	}

	else {


	// Add all of the lines of the sequence to the sequence object
	$seq .= str_replace(array("\r\n", "\n\r", "\n", "\r"), '', $line);

	}


}

$returnArray[$seqCount]['seq'] = $seq;

$jsonData = json_encode($returnArray);
echo $jsonData;





?>