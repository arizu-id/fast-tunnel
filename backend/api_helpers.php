<?php
$GLOBALS['ftpConfigHooks'] = [];
function getPhpExecutablePath() {
    if (PHP_SAPI === 'cli') {
        return PHP_BINARY;
    }
    if (PHP_OS_FAMILY === 'Windows') {
        $apachePath = PHP_BINARY;
        if (stripos($apachePath, 'apache') !== false) {
            $xamppDir = dirname(dirname(dirname($apachePath)));
            $phpExe = $xamppDir . '/php/php.exe';
            if (file_exists($phpExe)) {
                return $phpExe;
            }
        }
        if (file_exists('C:/xampp/php/php.exe')) {
            return 'C:/xampp/php/php.exe';
        }
        $paths = explode(PATH_SEPARATOR, getenv('PATH'));
        foreach ($paths as $path) {
            $phpExe = rtrim($path, '/\\') . '/php.exe';
            if (file_exists($phpExe)) {
                return $phpExe;
            }
        }
    } else {
        foreach (['/usr/bin/php', '/usr/local/bin/php', '/usr/bin/php8', '/usr/bin/php7'] as $path) {
            if (file_exists($path) && is_executable($path)) {
                return $path;
            }
        }
        $path = trim(@shell_exec('which php'));
        if ($path && file_exists($path)) {
            return $path;
        }
    }
    return PHP_BINARY;
}
function registerFtpConfigHook(callable $fn): void {
    $GLOBALS['ftpConfigHooks'][] = $fn;
}
function applyFtpConfigHooks(array $config, array $requestData): array {
    foreach ($GLOBALS['ftpConfigHooks'] as $fn) {
        $config = $fn($config, $requestData);
    }
    return $config;
}
function isPluginActive(string $slug): bool {
    return is_dir(__DIR__ . '/../plugins/' . $slug);
}
function loadPluginBackends(): void {
    $pluginDir = __DIR__ . '/../plugins';
    if (!is_dir($pluginDir)) return;
    $dirs = glob($pluginDir . '/*', GLOB_ONLYDIR) ?: [];
    foreach ($dirs as $dir) {
        $file = $dir . '/plugin.php';
        if (file_exists($file)) {
            require_once $file;
        }
    }
}
function getConnectedFtp(): \App\FtpClient {
    if (!isset($_SESSION['ftp_auth'])) {
        throw new Exception("Not connected.");
    }
    $auth = $_SESSION['ftp_auth'];
    $use_proxy = (bool)($auth['use_proxy'] ?? false) && isPluginActive('proxy');
    $ftp = new \App\FtpClient(
        $auth['host'],
        (int)$auth['port'],
        $auth['user'],
        Auth::decrypt($auth['password_enc']),
        $use_proxy,
        $use_proxy ? ($auth['proxy_host'] ?? '') : '',
        $use_proxy ? (int)($auth['proxy_port'] ?? 0) : 0,
        $use_proxy ? ($auth['proxy_type'] ?? '') : '',
        $use_proxy ? ($auth['proxy_user'] ?? '') : '',
        $use_proxy ? Auth::decrypt($auth['proxy_password_enc'] ?? '') : ''
    );
    $ftp->connect();
    return $ftp;
}
function getConnectedMysql($dbName = ''): \App\MysqlClient {
    if (!isset($_SESSION['mysql_auth'])) {
        throw new Exception("Not connected to MySQL.");
    }
    $auth = $_SESSION['mysql_auth'];
    $db = $dbName !== '' ? $dbName : ($auth['db_name'] ?? '');
    return new \App\MysqlClient(
        $auth['host'],
        $auth['port'],
        $auth['user'],
        Auth::decrypt($auth['password_enc']),
        $db
    );
}
function getConnectedSsh(): \App\SshClient {
    if (!isset($_SESSION['ssh_auth'])) {
        throw new Exception("Not connected to SSH.");
    }
    $auth = $_SESSION['ssh_auth'];
    $ssh = new \App\SshClient($auth['host'], (int)$auth['port']);
    $ssh->connect($auth['user'], Auth::decrypt($auth['password_enc']));
    return $ssh;
}
function rmdir_recursive(string $dir): void {
    if (!is_dir($dir)) return;
    $files = array_diff(scandir($dir), ['.', '..']);
    foreach ($files as $file) {
        $path = $dir . '/' . $file;
        is_dir($path) ? rmdir_recursive($path) : unlink($path);
    }
    rmdir($dir);
}
function copy_recursive(string $src, string $dst): void {
    if (!is_dir($src)) return;
    @mkdir($dst, 0755, true);
    $dir = opendir($src);
    while (false !== ($file = readdir($dir))) {
        if ($file !== '.' && $file !== '..') {
            $srcPath = $src . '/' . $file;
            $dstPath = $dst . '/' . $file;
            if (is_dir($srcPath)) {
                copy_recursive($srcPath, $dstPath);
            } else {
                copy($srcPath, $dstPath);
            }
        }
    }
    closedir($dir);
}
function sanitizeIdentifier(string $name): string {
    $clean = str_replace('`', '', $name);
    if (!preg_match('/^[a-zA-Z0-9_]+$/', $clean)) {
        throw new Exception("Invalid SQL identifier: " . htmlspecialchars($name));
    }
    return "`$clean`";
}
function sanitizeColumnType(string $type): string {
    $allowedTypes = ['INT', 'VARCHAR', 'TEXT', 'DATE', 'DATETIME', 'TIMESTAMP', 'TINYINT', 'SMALLINT', 'BIGINT', 'DECIMAL', 'FLOAT', 'DOUBLE', 'CHAR', 'BLOB'];
    $upper = strtoupper(trim($type));
    if (!in_array($upper, $allowedTypes)) {
        throw new Exception("Unauthorized column type: " . htmlspecialchars($type));
    }
    return $upper;
}
function sanitizeColumnLength(string $length): string {
    $clean = trim($length);
    if ($clean === '') {
        return '';
    }
    if (!preg_match('/^[0-9]+(,[0-9]+)?$/', $clean)) {
        throw new Exception("Invalid length value: " . htmlspecialchars($length));
    }
    return $clean;
}
