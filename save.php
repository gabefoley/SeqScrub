 <?php
$myfile = fopen('newfile2.txt', "w");
$txt = $_POST['cleanedText'];
fwrite($myfile, $txt);
header('Content-Type: text/html');
header('Content-Disposition: attachment; filename="newfile2.txt"');
fclose($myfile);
// readfile('newfile2.txt');
?> 