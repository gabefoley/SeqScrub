<?php

$dir = dirname("handler.php");

echo $dir;

$a = is_writable($dir);

$b = is_writable("uploads/");

$c = is_writable("/var/www/htdocs/SeqScrub/handler.php");
echo 'Test begins';
echo $a;
echo $b;
echo $c;

?>