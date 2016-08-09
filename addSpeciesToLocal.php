<?php
	session_start();
	include 'database_info.php';

	print_r($_POST);



	// Create connection
	$conn = new mysqli($servername, $username, $password, $dbname);

	$stmt = $conn->prepare("INSERT INTO records(id, seqType, speciesName, seq) 
		VALUES(?, ?, ?, ?)");
	$stmt->bind_param("ssss", $id, $seqType, $speciesName, $seq);

	$id = $_POST['id'];
	$seqType = $_POST['seqType'];
	$speciesName = $_POST['speciesName'];
	$seq = $_POST['seq'];


	
	
	$stmt->execute();

	$stmt->close();
	mysqli_close($conn);


	
?>