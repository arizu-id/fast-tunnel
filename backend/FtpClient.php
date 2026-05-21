<?php
namespace App;
use Exception;
class FtpClient {
    private $connection;
    private string $host;
    private int $port;
    private string $user;
    private string $password;
    private bool $isPassive = true;
    private bool $useProxy = false;
    private string $proxyHost = '';
    private int $proxyPort = 0;
    private string $proxyType = '';
    private string $proxyUser = '';
    private string $proxyPassword = '';
    public function __construct(
        string $host,
        int $port,
        string $user,
        string $password,
        bool $useProxy = false,
        string $proxyHost = '',
        int $proxyPort = 0,
        string $proxyType = '',
        string $proxyUser = '',
        string $proxyPassword = ''
    ) {
        if ($useProxy) {
            if (!extension_loaded('curl')) {
                throw new Exception("PHP cURL extension is not loaded. Please enable extension=curl in your php.ini.");
            }
        } else {
            if (!extension_loaded('ftp')) {
                throw new Exception("PHP FTP extension is not loaded. Please enable extension=ftp in your php.ini.");
            }
        }
        $this->host = $host;
        $this->port = $port;
        $this->user = $user;
        $this->password = $password;
        $this->useProxy = $useProxy;
        $this->proxyHost = $proxyHost;
        $this->proxyPort = $proxyPort;
        $this->proxyType = $proxyType;
        $this->proxyUser = $proxyUser;
        $this->proxyPassword = $proxyPassword;
    }
    private function initCurl(string $url) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_USERPWD, "{$this->user}:{$this->password}");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        curl_setopt($ch, CURLOPT_FAILONERROR, true);
        curl_setopt($ch, CURLOPT_FTP_USE_EPRT, false);
        curl_setopt($ch, CURLOPT_FTP_USE_EPSV, true);
        if ($this->useProxy) {
            $proxyUrl = $this->proxyHost . ($this->proxyPort ? ":{$this->proxyPort}" : '');
            curl_setopt($ch, CURLOPT_PROXY, $proxyUrl);
            switch (strtolower($this->proxyType)) {
                case 'socks4':
                    curl_setopt($ch, CURLOPT_PROXYTYPE, CURLPROXY_SOCKS4);
                    break;
                case 'socks5':
                    curl_setopt($ch, CURLOPT_PROXYTYPE, CURLPROXY_SOCKS5);
                    break;
                case 'http':
                default:
                    curl_setopt($ch, CURLOPT_PROXYTYPE, CURLPROXY_HTTP);
                    break;
            }
            if ($this->proxyUser) {
                curl_setopt($ch, CURLOPT_PROXYUSERPWD, "{$this->proxyUser}:{$this->proxyPassword}");
            }
        }
        return $ch;
    }
    public function connect(): void {
        if ($this->useProxy) {
            $url = "ftp://{$this->host}:{$this->port}/";
            $ch = $this->initCurl($url);
            curl_setopt($ch, CURLOPT_FTPLISTONLY, true);
            $res = curl_exec($ch);
            if ($res === false) {
                $err = curl_error($ch);
                curl_close($ch);
                throw new Exception("Proxy connection failed: $err");
            }
            curl_close($ch);
            return;
        }
        $this->connection = ftp_connect($this->host, $this->port, 10);
        if (!$this->connection) {
            throw new Exception("Could not connect to {$this->host}:{$this->port}");
        }
        $login = @ftp_login($this->connection, $this->user, $this->password);
        if (!$login) {
            throw new Exception("Authentication failed for user {$this->user}");
        }
        if ($this->isPassive) {
            ftp_pasv($this->connection, true);
        }
    }
    public function disconnect(): void {
        if ($this->connection) {
            ftp_close($this->connection);
            $this->connection = null;
        }
    }
    public function __destruct() {
        $this->disconnect();
    }
    public function listDirectory(string $directory = '.'): array {
        if ($this->useProxy) {
            $dir = '/' . ltrim($directory, '/');
            if (substr($dir, -1) !== '/') {
                $dir .= '/';
            }
            $url = "ftp://{$this->host}:{$this->port}" . $dir;
            $ch = $this->initCurl($url);
            $res = curl_exec($ch);
            if ($res === false) {
                $err = curl_error($ch);
                curl_close($ch);
                throw new Exception("Failed to list directory: $err");
            }
            curl_close($ch);
            $lines = explode("\n", str_replace("\r", "", $res));
            return $this->parseRawList(array_filter($lines), $directory);
        }
        if (!$this->connection) {
            throw new Exception("Not connected.");
        }
        $list = @ftp_mlsd($this->connection, $directory);
        if ($list !== false) {
            return $this->parseMlsd($list, $directory);
        }
        $rawList = @ftp_rawlist($this->connection, $directory);
        if ($rawList === false) {
             throw new Exception("Failed to list directory: $directory");
        }
        return $this->parseRawList($rawList, $directory);
    }
    private function parseMlsd(array $list, string $path): array {
        $items = [];
        foreach ($list as $item) {
            if ($item['name'] === '.' || $item['name'] === '..') {
                continue;
            }
            $isDir = strtolower($item['type']) === 'dir' || strtolower($item['type']) === 'cdir' || strtolower($item['type']) === 'pdir';
            $items[] = [
                'name' => $item['name'],
                'path' => rtrim($path, '/') . '/' . $item['name'],
                'isDir' => $isDir,
                'size' => $isDir ? 0 : (isset($item['size']) ? (int)$item['size'] : 0),
                'modify' => $item['modify'] ?? ''
            ];
        }
        usort($items, function($a, $b) {
            if ($a['isDir'] === $b['isDir']) {
                return strcasecmp($a['name'], $b['name']);
            }
            return $a['isDir'] ? -1 : 1;
        });
        return $items;
    }
    private function parseRawList(array $rawList, string $path): array {
          $items = [];
          foreach ($rawList as $line) {
              if (preg_match('/^([d\-])(?:[rwx\-]{9})\s+\d+\s+\S+\s+\S+\s+(\d+)\s+(.+?)\s+(.+)$/', $line, $matches)) {
                  $isDir = $matches[1] === 'd';
                  $size = (int)$matches[2];
                  $name = $matches[4];
                  if ($name === '.' || $name === '..') continue;
                  $items[] = [
                     'name' => $name,
                     'path' => rtrim($path, '/') . '/' . $name,
                     'isDir' => $isDir,
                     'size' => $isDir ? 0 : $size,
                     'modify' => $matches[3]
                 ];
              }
          }
        usort($items, function($a, $b) {
            if ($a['isDir'] === $b['isDir']) {
                return strcasecmp($a['name'], $b['name']);
            }
            return $a['isDir'] ? -1 : 1;
        });
         return $items;
    }
    public function readFile(string $remoteFile): string {
        if ($this->useProxy) {
            $path = '/' . ltrim($remoteFile, '/');
            $url = "ftp://{$this->host}:{$this->port}" . $path;
            $ch = $this->initCurl($url);
            $res = curl_exec($ch);
            if ($res === false) {
                $err = curl_error($ch);
                curl_close($ch);
                throw new Exception("Failed to read file: $err");
            }
            curl_close($ch);
            return $res;
        }
        $tempFile = tmpfile();
        $tempPath = stream_get_meta_data($tempFile)['uri'];
        if (!ftp_get($this->connection, $tempPath, $remoteFile, FTP_BINARY)) {
            throw new Exception("Failed to download file: $remoteFile");
        }
        $content = file_get_contents($tempPath);
        fclose($tempFile);
        return $content;
    }
    public function writeFile(string $remoteFile, string $content): bool {
        if ($this->useProxy) {
            $path = '/' . ltrim($remoteFile, '/');
            $url = "ftp://{$this->host}:{$this->port}" . $path;
            $ch = $this->initCurl($url);
            $fp = tmpfile();
            fwrite($fp, $content);
            fseek($fp, 0);
            curl_setopt($ch, CURLOPT_UPLOAD, true);
            curl_setopt($ch, CURLOPT_INFILE, $fp);
            curl_setopt($ch, CURLOPT_INFILESIZE, strlen($content));
            $res = curl_exec($ch);
            $err = curl_errno($ch) ? curl_error($ch) : '';
            curl_close($ch);
            fclose($fp);
            if ($res === false) {
                throw new Exception("Failed to write file: $err");
            }
            return true;
        }
        $tempFile = tmpfile();
        fwrite($tempFile, $content);
        fseek($tempFile, 0);
        $tempPath = stream_get_meta_data($tempFile)['uri'];
        $result = ftp_put($this->connection, $remoteFile, $tempPath, FTP_BINARY);
        fclose($tempFile);
        if (!$result) {
            throw new Exception("Failed to upload file: $remoteFile");
        }
        return true;
    }
    public function createDirectory(string $directory): bool {
        if ($this->useProxy) {
            $url = "ftp://{$this->host}:{$this->port}/";
            $ch = $this->initCurl($url);
            $dir = '/' . ltrim($directory, '/');
            curl_setopt($ch, CURLOPT_QUOTE, ["MKD {$dir}"]);
            curl_setopt($ch, CURLOPT_NOBODY, true);
            $res = curl_exec($ch);
            if ($res === false) {
                $err = curl_error($ch);
                curl_close($ch);
                throw new Exception("Failed to create directory: $err");
            }
            curl_close($ch);
            return true;
        }
        if (!@ftp_mkdir($this->connection, $directory)) {
            throw new Exception("Failed to create directory: $directory");
        }
        return true;
    }
    public function rename(string $oldName, string $newName): bool {
        if ($this->useProxy) {
            $url = "ftp://{$this->host}:{$this->port}/";
            $ch = $this->initCurl($url);
            $old = '/' . ltrim($oldName, '/');
            $new = '/' . ltrim($newName, '/');
            curl_setopt($ch, CURLOPT_QUOTE, [
                "RNFR {$old}",
                "RNTO {$new}"
            ]);
            curl_setopt($ch, CURLOPT_NOBODY, true);
            $res = curl_exec($ch);
            if ($res === false) {
                $err = curl_error($ch);
                curl_close($ch);
                throw new Exception("Failed to rename: $err");
            }
            curl_close($ch);
            return true;
        }
        if (!@ftp_rename($this->connection, $oldName, $newName)) {
            throw new Exception("Failed to rename $oldName to $newName");
        }
        return true;
    }
    public function deleteFile(string $file): bool {
        if ($this->useProxy) {
            $url = "ftp://{$this->host}:{$this->port}/";
            $ch = $this->initCurl($url);
            $path = '/' . ltrim($file, '/');
            curl_setopt($ch, CURLOPT_QUOTE, ["DELE {$path}"]);
            curl_setopt($ch, CURLOPT_NOBODY, true);
            $res = curl_exec($ch);
            if ($res === false) {
                $err = curl_error($ch);
                curl_close($ch);
                throw new Exception("Failed to delete file: $err");
            }
            curl_close($ch);
            return true;
        }
        if (!@ftp_delete($this->connection, $file)) {
            throw new Exception("Failed to delete file: $file");
        }
        return true;
    }
    public function deleteDirectory(string $dir): bool {
        if ($this->useProxy) {
            $url = "ftp://{$this->host}:{$this->port}/";
            $ch = $this->initCurl($url);
            $path = '/' . ltrim($dir, '/');
            curl_setopt($ch, CURLOPT_QUOTE, ["RMD {$path}"]);
            curl_setopt($ch, CURLOPT_NOBODY, true);
            $res = curl_exec($ch);
            if ($res === false) {
                $err = curl_error($ch);
                curl_close($ch);
                throw new Exception("Failed to delete directory: $err");
            }
            curl_close($ch);
            return true;
        }
         if (!@ftp_rmdir($this->connection, $dir)) {
            throw new Exception("Failed to delete directory: $dir (ensure it is empty)");
        }
        return true;
    }
}