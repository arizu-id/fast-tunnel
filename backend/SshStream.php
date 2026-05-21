<?php
require_once __DIR__ . '/../vendor/autoload.php';
use phpseclib3\Net\SSH2;
if ($argc < 2 || !file_exists($argv[1])) {
    exit(1);
}
$session = json_decode(file_get_contents($argv[1]), true);
if (!$session) exit(1);
$inputFile = $session['input_file'];
$outputFile = $session['output_file'];
$killFile = $session['kill_file'];
$pidFile = $session['pid_file'];
file_put_contents($pidFile, getmypid());
set_time_limit(0);
ini_set('max_execution_time', 0);
try {
    $ssh = new SSH2($session['host'], (int)$session['port']);
    $ssh->setTimeout(10);
    if (!$ssh->login($session['user'], $session['password'])) {
        file_put_contents($outputFile, "\r\n\x1b[1;31mAuthentication failed.\x1b[0m\r\n", FILE_APPEND);
        exit(1);
    }
    $ssh->setWindowSize(220, 50);
    $output = $ssh->read('', SSH2::READ_NEXT);
    if (is_string($output) && $output !== '') {
        file_put_contents($outputFile, $output, FILE_APPEND);
    }
    $ssh->setTimeout(0.05);
    $inputPos = 0;
    $idleStart = time();
    $maxIdleSeconds = 3600;
    while (!file_exists($killFile)) {
        $output = $ssh->read('', SSH2::READ_NEXT);
        if ($output === false) {
            break;
        }
        if ($output === true && !$ssh->isTimeout()) {
            break;
        }
        if (is_string($output) && $output !== '') {
            file_put_contents($outputFile, $output, FILE_APPEND);
            $idleStart = time();
        }
        clearstatcache(true, $inputFile);
        if (file_exists($inputFile)) {
            $fileSize = @filesize($inputFile);
            if ($fileSize && $fileSize > $inputPos) {
                $fh = fopen($inputFile, 'rb');
                if ($fh) {
                    fseek($fh, $inputPos);
                    $data = fread($fh, $fileSize - $inputPos);
                    fclose($fh);
                    $inputPos = $fileSize;
                    if ($data !== false && $data !== '') {
                        $ssh->write($data);
                        $idleStart = time();
                    }
                }
            }
        }
        if ((time() - $idleStart) > $maxIdleSeconds) {
            file_put_contents($outputFile, "\r\n\x1b[1;33mSession timed out after inactivity.\x1b[0m\r\n", FILE_APPEND);
            break;
        }
    }
} catch (\Throwable $e) {
    file_put_contents($outputFile, "\r\n\x1b[1;31mSSH Error: " . $e->getMessage() . "\x1b[0m\r\n", FILE_APPEND);
} finally {
    @unlink($pidFile);
    @unlink($killFile);
}
