<?php
require_once __DIR__ . '/../vendor/autoload.php';
use phpseclib3\Net\SSH2;
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE & ~E_WARNING);
if ($argc < 2 || !file_exists($argv[1])) {
    exit(1);
}
$session = json_decode(file_get_contents($argv[1]), true);
if (!$session) exit(1);
$inputFile = $session['input_file'];
$outputFile = $session['output_file'];
$killFile = $session['kill_file'];
$pidFile = $session['pid_file'];
$resizeFile = $session['resize_file'] ?? '';
$cols = (int)($session['cols'] ?? 80);
$rows = (int)($session['rows'] ?? 24);
file_put_contents($pidFile, getmypid());
set_time_limit(0);
ini_set('max_execution_time', 0);
try {
    $ssh = new SSH2($session['host'], (int)$session['port']);
    $ssh->setTimeout(15);
    if (!$ssh->login($session['user'], $session['password'])) {
        file_put_contents($outputFile, "\r\n\x1b[1;31mAuthentication failed.\x1b[0m\r\n", FILE_APPEND);
        exit(1);
    }
    $ssh->enablePTY();
    $ssh->setWindowSize($cols, $rows);
    $ssh->exec('bash --login');
    $ssh->setTimeout(5);
    $initial = $ssh->read('');
    if (is_string($initial) && $initial !== '') {
        file_put_contents($outputFile, $initial, FILE_APPEND);
    }
    $ssh->setTimeout(0.05);
    $inputPos = 0;
    $idleStart = time();
    $maxIdleSeconds = 3600;
    while (!file_exists($killFile)) {
        if ($resizeFile && file_exists($resizeFile)) {
            $rz = @file_get_contents($resizeFile);
            @unlink($resizeFile);
            if ($rz) {
                $dims = json_decode($rz, true);
                if ($dims && isset($dims['cols'], $dims['rows'])) {
                    $ssh->setWindowSize((int)$dims['cols'], (int)$dims['rows']);
                }
            }
        }
        $output = $ssh->read('');
        if ($output === false) {
            break;
        }
        if (is_string($output) && $output !== '') {
            file_put_contents($outputFile, $output, FILE_APPEND);
            $idleStart = time();
        }
        clearstatcache(true, $inputFile);
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
        if (!$ssh->isConnected()) {
            file_put_contents($outputFile, "\r\n\x1b[1;31mSSH connection lost.\x1b[0m\r\n", FILE_APPEND);
            break;
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
    if ($resizeFile) @unlink($resizeFile);
}
