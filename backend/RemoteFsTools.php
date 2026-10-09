<?php
namespace App;
use Exception;
use ZipArchive;

/**
 * Operations built on top of the primitive FTP/SFTP client methods
 * (listDirectory, deleteFile, deleteDirectory, createDirectory, downloadToFile),
 * shared by FtpClient and SftpClient.
 */
trait RemoteFsTools {
    /** Recursively delete a directory and everything in it. */
    public function deleteTree(string $path, int $depth = 0): void {
        if ($depth > 30) {
            throw new Exception("Directory nesting is too deep");
        }
        foreach ($this->listDirectory($path) as $item) {
            if ($item['isDir']) {
                $this->deleteTree($item['path'], $depth + 1);
            } else {
                $this->deleteFile($item['path']);
            }
        }
        $this->deleteDirectory($path);
    }

    /** mkdir -p; existing directories are fine. */
    public function ensureDirectory(string $path): void {
        $cur = '';
        foreach (array_filter(explode('/', $path), 'strlen') as $part) {
            $cur .= '/' . $part;
            try {
                $this->createDirectory($cur);
            } catch (\Throwable $e) {
                // most likely "already exists"
            }
        }
    }

    /** Case-insensitive name search below $dir (breadth first, bounded by count and time). */
    public function search(string $dir, string $needle, int $limit = 200, int $maxSeconds = 20): array {
        $needle = trim($needle);
        if ($needle === '') return ['results' => [], 'truncated' => false];
        $deadline = time() + $maxSeconds;
        $queue = [[$dir === '' ? '/' : $dir, 0]];
        $results = [];
        $truncated = false;
        while ($queue) {
            [$cur, $depth] = array_shift($queue);
            try {
                $items = $this->listDirectory($cur);
            } catch (\Throwable $e) {
                continue; // unreadable directory: skip
            }
            foreach ($items as $it) {
                if (stripos($it['name'], $needle) !== false) {
                    $results[] = ['name' => $it['name'], 'path' => $it['path'], 'isDir' => $it['isDir']];
                    if (count($results) >= $limit) { $truncated = true; break 2; }
                }
                if ($it['isDir'] && $depth < 10) $queue[] = [$it['path'], $depth + 1];
            }
            if (time() > $deadline) { $truncated = true; break; }
        }
        return ['results' => $results, 'truncated' => $truncated];
    }

    /**
     * Build a ZIP of the given [{path,isDir}] items in $zipPath. Returns the number of files added.
     * Files are staged in temp files (deleted afterwards) and capped to keep the server safe.
     */
    public function zipTo(array $items, string $zipPath, int $maxFiles = 2000, int $maxBytes = 209715200): int {
        if (!class_exists('ZipArchive')) {
            throw new Exception("PHP ZipArchive extension is not enabled");
        }
        $zip = new ZipArchive();
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new Exception("Could not create the ZIP archive");
        }
        $tmpFiles = [];
        $count = 0;
        $bytes = 0;
        $used = [];
        $walk = function (string $path, bool $isDir, string $zipName, int $depth) use (&$walk, $zip, &$tmpFiles, &$count, &$bytes, $maxFiles, $maxBytes) {
            if ($depth > 30) throw new Exception("Directory nesting is too deep");
            if ($isDir) {
                $zip->addEmptyDir($zipName);
                foreach ($this->listDirectory($path) as $it) {
                    $walk($it['path'], $it['isDir'], $zipName . '/' . $it['name'], $depth + 1);
                }
                return;
            }
            if (++$count > $maxFiles) throw new Exception("Too many files for a ZIP download (max $maxFiles)");
            $tmp = tempnam(sys_get_temp_dir(), 'ftz');
            $tmpFiles[] = $tmp;
            $this->downloadToFile($path, $tmp);
            $bytes += (int)filesize($tmp);
            if ($bytes > $maxBytes) throw new Exception("Selection is too large for a ZIP download (max " . round($maxBytes / 1048576) . " MB)");
            $zip->addFile($tmp, $zipName);
        };
        try {
            foreach ($items as $item) {
                $base = basename(rtrim($item['path'], '/')) ?: 'root';
                $name = $base;
                for ($n = 2; isset($used[$name]); $n++) $name = $base . " ($n)";
                $used[$name] = true;
                $walk($item['path'], !empty($item['isDir']), $name, 0);
            }
            $zip->close();
        } catch (\Throwable $e) {
            @$zip->close();
            @unlink($zipPath);
            throw $e;
        } finally {
            foreach ($tmpFiles as $f) @unlink($f);
        }
        return $count;
    }
}
