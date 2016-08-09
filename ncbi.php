<?php

echo 'here';

$url = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=protein&id=602714968&retmode=xml&rettype=full";

$xmlDoc = new DOMDocument();
$xmlDoc->load($url);
echo 'Reading';
echo $xmlDoc;


?>
