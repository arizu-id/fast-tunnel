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
    static $cached = null;
    if ($cached !== null) {
        return $cached;
    }
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
    return $cached = $ftp;
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
    if ($clean === '' || strlen($clean) > 64 || preg_match('/[\x00-\x1f\x7f]/', $clean)) {
        throw new Exception("Invalid SQL identifier: " . htmlspecialchars($name));
    }
    return "`$clean`";
}
function sanitizeDatabaseName(string $name): string {
    if ($name === '' || strlen($name) > 64 || strpos($name, '`') !== false || preg_match('/[\x00-\x1f\x7f\/\\\\.]/', $name)) {
        throw new Exception("Invalid database name");
    }
    if (in_array(strtolower($name), ['information_schema', 'mysql', 'performance_schema', 'sys'], true)) {
        throw new Exception("System database '$name' cannot be dropped");
    }
    return "`$name`";
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

/**
 * Record sensitive actions in the audit log once they have succeeded.
 */
function auditSuccessfulAction(string $action,array $data):void{
$db=$data['db_name']??'';
$table=$data['table']??'';
switch($action){
case'mysql_drop_database':Audit::log($action,$db);break;
case'mysql_drop_table':
case'mysql_truncate_table':Audit::log($action,"$db.$table");break;
case'mysql_drop_columns':Audit::log($action,"$db.$table",implode(',',(array)($data['columns']??[])));break;
case'mysql_delete_rows':Audit::log($action,"$db.$table",count(pkRowsFromRequest($data)).' row(s)');break;
case'mysql_run_query':
$sql=trim((string)($data['sql']??''));
if(!preg_match('/^(select|show|describe|desc|explain)\\b/i',$sql))Audit::log($action,$db,$sql);
break;
case'delete':Audit::log('ftp_delete',(string)($data['path']??''));break;
case'sessions_delete':Audit::log($action,(string)($data['id']??''));break;
case'sessions_import':Audit::log($action,'',count((array)($data['sessions']??[])).' session(s)');break;
case'delete_plugin':Audit::log($action,(string)($data['slug']??''));break;
case'install_plugin':Audit::log($action,(string)($_FILES['plugin_file']['name']??''));break;
case'auth_update_credentials':Audit::log($action,(string)($data['username']??''));break;
}
}

/**
 * Remove stale SSH IPC files (and kill orphaned daemons) older than $maxAge seconds.
 */
function reapSshTempFiles(string $tmpDir,int $maxAge=7200):void{
$files=glob($tmpDir.'/*');
if(!$files)return;
foreach($files as$f){
if(!is_file($f)||(time()-filemtime($f))<=$maxAge)continue;
if(strpos(basename($f),'_pid')!==false){
$pid=(int)@file_get_contents($f);
if($pid>0){
if(PHP_OS_FAMILY==='Windows'){@exec("taskkill /F /PID $pid >NUL 2>&1");}
else{@exec("kill -9 $pid >/dev/null 2>&1");}
}
}
@unlink($f);
}
}

/**
 * Primary key of a single row as [column => value]. Accepts the composite form
 * {pk:{col:val,...}} or the legacy {pk_column, pk_value}.
 */
function pkFromRequest(array $data):array{
if(isset($data['pk'])&&is_array($data['pk']))return $data['pk'];
if(!empty($data['pk_column'])&&array_key_exists('pk_value',$data)&&$data['pk_value']!==null)return[$data['pk_column']=>$data['pk_value']];
return[];
}
/**
 * List of primary keys for a multi-row delete: {pk_rows:[{col:val,...},...]} or legacy {pk_column, pk_values}.
 */
function pkRowsFromRequest(array $data):array{
if(!empty($data['pk_rows'])&&is_array($data['pk_rows'])){
return array_values(array_filter($data['pk_rows'],fn($r)=>is_array($r)&&!empty($r)));
}
if(!empty($data['pk_column'])&&!empty($data['pk_values'])&&is_array($data['pk_values'])){
return array_map(fn($v)=>[$data['pk_column']=>$v],array_values($data['pk_values']));
}
return[];
}
