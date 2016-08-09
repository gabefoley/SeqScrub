<?php
	session_start();
	include 'database_info.php';
	// Create connection
	$conn = new mysqli($servername, $username, $password, $dbname);

	$stmt = $conn->prepare("SELECT * FROM records WHERE id = ?");	// 
	$dataID = $_POST["id"];
	// print_r($_POST["id"]);

	$stmt->bind_param("s", $dataID);
	$stmt->execute();

	$result = $stmt->get_result();
	
	$json_result=array();

	while($row = $result->fetch_assoc()) {
		array_push($json_result, $row);
	}
	echo json_encode($json_result); 
	mysqli_close($conn);
?>

