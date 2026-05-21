<?php
require_once __DIR__ . '/../vendor/autoload.php';
use phpseclib3\Net\SSH2;
$sessionFile = glob(__DIR__ . '/../temp_ssh/*.json');
if (!$sessionFile) {
    echo "No session json file found. Please connect via UI first.\n";
    exit(1);
}
$session = json_decode(file_get_contents($sessionFile[0]), true);
$ssh = new SSH2($session['host'], (int)$session['port']);
$ssh->setTimeout(10);
if (!$ssh->login($session['user'], $session['password'])) {
    echo "Auth failed\n";
    exit(1);
}
$ssh->setWindowSize(220, 50);
$output = $ssh->read('', SSH2::READ_NEXT);
var_dump($output);
$ssh->setTimeout(0.05);
$output2 = $ssh->read('', SSH2::READ_NEXT);
var_dump($output2);
$output3 = $ssh->read('', SSH2::READ_NEXT);
var_dump($output3);
