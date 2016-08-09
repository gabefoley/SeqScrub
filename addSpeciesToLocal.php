<?php
	session_start();
	include 'database_info.php';

	print_r($_POST);



	// Create connection
	$conn = new mysqli($servername, $username, $password, $dbname);

	$stmt = $conn->prepare("INSERT INTO history(id, dataID, mode, motif, gap, col, seqIDs, seqNames, seqChars) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)");
	$stmt->bind_param("isssiisss", $id, $dataID, $mode, $motif, $gap, $col, $seqIDs, $seqNames, $seqChars);

	$dataID = $_SESSION['dataID'];
	$mode = $_POST['mode'];
	$motif = $_POST['motif'];
	$gap = $_POST['gap'];
	$col = $_POST['col'];
	$seqIDs = $_POST['seqIDs'];
	$seqNames = $_POST['seqNames'];
	$seqChars = $_POST['seqChars'];

	
	
	$stmt->execute();

	$stmt->close();
	mysqli_close($conn);


	
?>