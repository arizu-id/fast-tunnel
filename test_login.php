<?php
require_once __DIR__ . '/vendor/autoload.php';
use phpseclib3\Net\SSH2;
$files = glob(__DIR__ . '/temp_ssh/*.json');
if (empty($files)) {
    echo "No session files found\n";
    exit(1);
}
$sessionFile = $files[0];
echo "Using session file: $sessionFile\n";
$session = json_decode(file_get_contents($sessionFile), true);
var_dump($session);
try {
    $ssh = new SSH2($session['host'], (int)$session['port']);
    $ssh->setTimeout(10);
    echo "Connecting...\n";
    if ($ssh->login($session['user'], $session['password'])) {
        echo "Logged in successfully\n";
        $ssh->setWindowSize(220, 50);
        echo "Setting window size...\n";
        $output = $ssh->read('', SSH2::READ_NEXT);
        echo "Read output: ";
        var_dump($output);
    } else {
        echo "Login failed\n";
    }
} catch (\Throwable $e) {
    echo "Exception: " . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n";
}
