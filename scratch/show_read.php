<?php
require_once __DIR__.'/../vendor/autoload.php';
$ref = new ReflectionMethod('phpseclib3\Net\SSH2', 'isTimeout');
echo "File: ".$ref->getFileName()."\n";
echo "Start line: ".$ref->getStartLine()."\n";
echo "End line: ".$ref->getEndLine()."\n";
