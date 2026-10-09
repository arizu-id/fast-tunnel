<?php
namespace App;
use Exception;
use phpseclib3\Net\SFTP;

/**
 * SFTP adapter with the same public API as FtpClient. Paths are virtual: "/" is the
 * login (home) directory, and ".." can't climb above it, mirroring a chrooted FTP account.
 */
class SftpClient {
    use RemoteFsTools;

    private string $host;
    private int $port;
    private string $user;
    private string $password;
    private $sftp = null;
    private string $home = '';

    public function __construct(string $host, int $port, string $user, string $password) {
        $this->host = $host;
        $this->port = $port ?: 22;
        $this->user = $user;
        $this->password = $password;
    }

    public function connect(): void {
        $this->sftp = new SFTP($this->host, $this->port, 10);
        if (!$this->sftp->login($this->user, $this->password)) {
            $this->sftp = null;
            throw new Exception("Authentication failed for user {$this->user}");
        }
        $this->home = rtrim((string)$this->sftp->pwd(), '/');
    }

    public function disconnect(): void {
        if ($this->sftp) {
            $this->sftp->disconnect();
            $this->sftp = null;
        }
    }

    public function __destruct() {
        $this->disconnect();
    }

    /** Virtual path -> normalized virtual path ("/a/b"), '..' clamped at the root. */
    private function norm(string $path): string {
        $out = [];
        foreach (explode('/', $path) as $seg) {
            if ($seg === '' || $seg === '.') continue;
            if ($seg === '..') { array_pop($out); continue; }
            $out[] = $seg;
        }
        return '/' . implode('/', $out);
    }

    /** Virtual path -> real server path. */
    private function abs(string $path): string {
        $n = $this->norm($path);
        $real = $this->home . ($n === '/' ? '' : $n);
        return $real === '' ? '/' : $real;
    }

    private function fail(string $what): void {
        $err = $this->sftp ? trim((string)$this->sftp->getLastSFTPError()) : '';
        throw new Exception($what . ($err !== '' ? " ($err)" : ''));
    }

    private function conn(): SFTP {
        if (!$this->sftp) throw new Exception("Not connected.");
        return $this->sftp;
    }

    public function listDirectory(string $directory = '.'): array {
        $base = $this->norm($directory);
        $list = $this->conn()->rawlist($this->abs($base));
        if ($list === false) {
            $this->fail("Failed to list directory: $directory");
        }
        $items = [];
        foreach ($list as $name => $attr) {
            if ($name === '.' || $name === '..') continue;
            $type = $attr['type'] ?? 1;
            $path = rtrim($base, '/') . '/' . $name;
            $isDir = $type === 2;
            if ($type === 3) { // symlink: follow it to know whether it is a directory
                $isDir = (bool)$this->conn()->is_dir($this->abs($path));
            }
            $items[] = [
                'name' => (string)$name,
                'path' => $path,
                'isDir' => $isDir,
                'size' => $isDir ? 0 : (int)($attr['size'] ?? 0),
                'modify' => isset($attr['mtime']) ? gmdate('YmdHis', (int)$attr['mtime']) : '',
            ];
        }
        usort($items, function ($a, $b) {
            if ($a['isDir'] === $b['isDir']) return strcasecmp($a['name'], $b['name']);
            return $a['isDir'] ? -1 : 1;
        });
        return $items;
    }

    public function readFile(string $remoteFile): string {
        $data = $this->conn()->get($this->abs($remoteFile));
        if ($data === false) $this->fail("Failed to download file: $remoteFile");
        return $data;
    }

    public function writeFile(string $remoteFile, string $content): bool {
        if (!$this->conn()->put($this->abs($remoteFile), $content)) $this->fail("Failed to upload file: $remoteFile");
        return true;
    }

    public function uploadFile(string $localFile, string $remoteFile): bool {
        if (!$this->conn()->put($this->abs($remoteFile), $localFile, SFTP::SOURCE_LOCAL_FILE)) $this->fail("Failed to upload file: $remoteFile");
        return true;
    }

    public function downloadToFile(string $remoteFile, string $localFile): void {
        if (!$this->conn()->get($this->abs($remoteFile), $localFile)) $this->fail("Failed to download file: $remoteFile");
    }

    public function createDirectory(string $directory): bool {
        if (!$this->conn()->mkdir($this->abs($directory))) $this->fail("Failed to create directory: $directory");
        return true;
    }

    public function rename(string $oldName, string $newName): bool {
        if (!$this->conn()->rename($this->abs($oldName), $this->abs($newName))) $this->fail("Failed to rename $oldName to $newName");
        return true;
    }

    public function deleteFile(string $file): bool {
        if (!$this->conn()->delete($this->abs($file), false)) $this->fail("Failed to delete file: $file");
        return true;
    }

    public function deleteDirectory(string $dir): bool {
        if (!$this->conn()->rmdir($this->abs($dir))) $this->fail("Failed to delete directory: $dir");
        return true;
    }
}
