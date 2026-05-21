<?php
namespace App;
use phpseclib3\Net\SSH2;
use Exception;
class SshClient {
    private $ssh;
    private $host;
    private $port;
    public function __construct($host, $port = 22) {
        $this->host = $host;
        $this->port = $port;
    }
    public function connect($user, $password) {
        $this->ssh = new SSH2($this->host, $this->port);
        if (!$this->ssh->login($user, $password)) {
            throw new Exception("Authentication failed");
        }
    }
    public function execute($command, $currentDir = '~') {
        $marker = "---FT_CWD_MARKER---";
        $cdCmd = "";
        if ($currentDir && $currentDir !== '~') {
            $cdCmd = "cd " . escapeshellarg($currentDir) . " && ";
        }
        $runCommand = $cdCmd . "(" . $command . ") ; echo '" . $marker . "' ; pwd";
        $output = $this->ssh->exec($runCommand);
        $parts = explode($marker, $output);
        $stdout = $parts[0] ?? '';
        $newDir = isset($parts[1]) ? trim($parts[1]) : $currentDir;
        return [
            'output' => $stdout,
            'cwd' => $newDir
        ];
    }
}