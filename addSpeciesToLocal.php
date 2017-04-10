<?php
	session_start();
	include 'database_info.php';

	// Create connection
	$conn = new mysqli($servername, $username, $password, $dbname);
	$stmt = $conn->prepare("INSERT INTO records(id, seqType, speciesName, seq) 
		VALUES(?, ?, ?, ?)");
	$stmt->bind_param("ssss", $id, $seqType, $speciesName, $seq);

	// Get information to add to database
	$id = $_POST['id'];
	$seqType = $_POST['seqType'];
	$speciesName = $_POST['speciesName'];
	$seq = $_POST['seq'];

	// Execute statement
	$stmt->execute();

	$stmt->close();
	mysqli_close($conn);


	
?>