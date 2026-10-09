<?php
/**
 * End-to-end API test against a real MySQL/MariaDB.
 *
 *   FT_DB_HOST=127.0.0.1 FT_DB_USER=ft FT_DB_PASS=ftpass php tests/integration/run.php
 *
 * It starts `php -S`, runs the web installer (writes config.php + installed.lock, removed afterwards),
 * logs in and exercises the MySQL panel API. Exit code 1 on any failure.
 */
$root = dirname(__DIR__, 2);
$dbHost = getenv('FT_DB_HOST') ?: '127.0.0.1';
$dbPort = (int)(getenv('FT_DB_PORT') ?: 3306);
$dbUser = getenv('FT_DB_USER') ?: 'root';
$dbPass = getenv('FT_DB_PASS') ?: '';
$appDb = 'ft_it_app_' . getmypid();
$port = 18000 + getmypid() % 1000;
$base = "http://127.0.0.1:$port";
$admin = ['admin_user' => 'admin', 'admin_pass' => 'S3cret-pass!'];

if (file_exists("$root/config.php")) { fwrite(STDERR, "config.php already exists; refusing to overwrite an installed instance\n"); exit(2); }

$server = proc_open([PHP_BINARY, '-S', "127.0.0.1:$port", "$root/tests/integration/router.php"], [1 => ['file', '/dev/null', 'w'], 2 => ['file', '/dev/null', 'w']], $pipes, $root);
register_shutdown_function(function () use ($server, $root, $appDb, $dbHost, $dbPort, $dbUser, $dbPass) {
    proc_terminate($server);
    @unlink("$root/config.php");
    @unlink("$root/installed.lock");
    try {
        $pdo = new PDO("mysql:host=$dbHost;port=$dbPort", $dbUser, $dbPass);
        $pdo->exec("DROP DATABASE IF EXISTS `$appDb`");
        $pdo->exec("DROP DATABASE IF EXISTS `ft_it`");
        $pdo->exec("DROP DATABASE IF EXISTS `ft_it_imp`");
    } catch (Throwable $e) {}
});
for ($i = 0; $i < 50; $i++) { if (@fsockopen('127.0.0.1', $port)) break; usleep(100000); }

$jar = tempnam(sys_get_temp_dir(), 'ftjar');
$csrf = '';
function http(string $method, string $url, $body = null, array $headers = [], bool $json = true): array {
    global $jar, $csrf;
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_HEADER => true, CURLOPT_COOKIEJAR => $jar, CURLOPT_COOKIEFILE => $jar, CURLOPT_CUSTOMREQUEST => $method]);
    $h = $headers;
    if ($csrf) $h[] = "X-CSRF-Token: $csrf";
    if ($body !== null) {
        if ($json) { $h[] = 'Content-Type: application/json'; $body = json_encode($body); }
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $h);
    $raw = curl_exec($ch);
    $size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    $text = substr($raw, $size);
    return ['status' => $status, 'headers' => substr($raw, 0, $size), 'text' => $text, 'json' => json_decode($text, true)];
}
function api(string $action, array $body = []): array { global $base; return http('POST', "$base/api/$action", $body); }
$failed = 0;
function check(string $name, $cond, string $extra = ''): void {
    global $failed;
    if (!$cond) $failed++;
    echo ($cond ? 'PASS ' : 'FAIL ') . $name . (!$cond && $extra !== '' ? "  -> $extra" : '') . "\n";
}
function ok(array $r): bool { return ($r['json']['success'] ?? false) === true; }
function err(array $r): string { return (string)($r['json']['error'] ?? $r['text']); }

// ---- install ----
$r = http('POST', "$base/install/setup.php", ['db_host' => $dbHost, 'db_port' => $dbPort, 'db_user' => $dbUser, 'db_pass' => $dbPass, 'db_name' => $appDb] + $admin);
check('installer succeeds', ($r['json']['success'] ?? false) === true, $r['text']);
check('config.php generated without CSRF_SECRET', file_exists("$root/config.php") && strpos(file_get_contents("$root/config.php"), 'CSRF_SECRET') === false);

// ---- auth ----
$r = http('POST', "$base/api/auth_login", ['username' => 'admin', 'password' => 'wrong']);
check('wrong password rejected', !ok($r));
$r = http('POST', "$base/api/auth_login", ['username' => 'admin', 'password' => $admin['admin_pass']]);
check('login ok', ok($r), $r['text']);
$csrf = $r['json']['csrf_token'] ?? '';
$r = http('POST', "$base/api/mysql_connect", ['host' => $dbHost], [], true);
$noCsrf = (function () use ($base, $jar) { global $csrf; $keep = $csrf; $csrf = ''; $x = http('POST', "$base/api/mysql_list_tables", []); $csrf = $keep; return $x; })();
check('POST without CSRF token is rejected (403)', $noCsrf['status'] === 403);

// ---- mysql panel ----
$r = api('mysql_connect', ['host' => $dbHost, 'port' => $dbPort, 'user' => $dbUser, 'password' => $dbPass, 'db_name' => '']);
check('mysql_connect lists databases', ok($r) && in_array('information_schema', $r['json']['databases'] ?? []), $r['text']);

$r = api('mysql_create_database', ['db_name' => 'ft_it']);
check('create database', ok($r) && in_array('ft_it', $r['json']['databases']), $r['text']);
check('create system-named database refused', !ok(api('mysql_create_database', ['db_name' => 'mysql'])));
check('create database with backtick refused', !ok(api('mysql_create_database', ['db_name' => 'a`b'])));

$r = api('mysql_create_table', ['db_name' => 'ft_it', 'table' => 'users', 'columns' => [
    ['name' => 'id', 'type' => 'INT', 'nullable' => false, 'ai' => true, 'pk' => true],
    ['name' => 'name', 'type' => 'VARCHAR', 'length' => '50', 'nullable' => true],
    ['name' => 'bio', 'type' => 'TEXT', 'nullable' => true],
]]);
check('create table (single PK + AI)', ok($r), $r['text']);
$r = api('mysql_create_table', ['db_name' => 'ft_it', 'table' => 'my-links', 'columns' => [
    ['name' => 'a', 'type' => 'INT', 'nullable' => false, 'pk' => true],
    ['name' => 'b', 'type' => 'INT', 'nullable' => false, 'pk' => true],
    ['name' => 'note', 'type' => 'VARCHAR', 'length' => '20', 'nullable' => true],
]]);
check('create table with hyphen + composite PK', ok($r), $r['text']);
check('duplicate column names refused', !ok(api('mysql_create_table', ['db_name' => 'ft_it', 'table' => 't2', 'columns' => [['name' => 'x', 'type' => 'INT'], ['name' => 'X', 'type' => 'INT']]])));
check('bad column type refused', !ok(api('mysql_create_table', ['db_name' => 'ft_it', 'table' => 't3', 'columns' => [['name' => 'x', 'type' => 'INT); DROP TABLE users; --']]])));

$r = api('mysql_run_query', ['db_name' => 'ft_it', 'sql' => "INSERT INTO users(name,bio) VALUES ('alice','it''s; fine'),('bob',NULL),('carol','x,y'),('dave', 'line1\nline2')"]);
check('insert rows via SQL console', ok($r) && ($r['json']['affected_rows'] ?? 0) === 4, $r['text']);
api('mysql_run_query', ['db_name' => 'ft_it', 'sql' => "INSERT INTO `my-links`(a,b,note) VALUES (1,1,'x'),(1,2,'y'),(2,1,'z')"]);

$r = api('mysql_table_data', ['db_name' => 'ft_it', 'table' => 'users', 'page' => 1, 'limit' => 50, 'order_by' => 'name', 'order_dir' => 'DESC']);
check('table data sorted DESC', ok($r) && array_column($r['json']['rows'], 'name') === ['dave', 'carol', 'bob', 'alice'], $r['text']);
$r = api('mysql_table_data', ['db_name' => 'ft_it', 'table' => 'my-links', 'page' => 1, 'limit' => 50]);
check('table with hyphen browsable', ok($r) && $r['json']['total'] === 3, $r['text']);
$r = api('mysql_table_data', ['db_name' => 'ft_it', 'table' => "users` UNION SELECT 1,2,3 -- ", 'page' => 1, 'limit' => 50]);
check('SQL injection via table name does not return data', !ok($r) || empty($r['json']['rows']), $r['text']);
$r = api('mysql_table_data', ['db_name' => 'ft_it', 'table' => 'users', 'page' => 1, 'limit' => 50, 'order_by' => 'name` ; DROP TABLE users; -- ']);
check('injection via order_by is inert', !ok($r));
check('users table still exists after injection attempts', ok(api('mysql_table_structure', ['db_name' => 'ft_it', 'table' => 'users'])));

// update / delete (single + composite)
$r = api('mysql_update_row', ['db_name' => 'ft_it', 'table' => 'users', 'pk' => ['id' => 1], 'row_data' => ['name' => 'ALICE', 'bio' => '__NULL__']]);
check('update row (new pk format)', ok($r) && $r['json']['affected'] === 1, $r['text']);
$r = api('mysql_update_row', ['db_name' => 'ft_it', 'table' => 'users', 'pk_column' => 'id', 'pk_value' => 2, 'row_data' => ['name' => 'BOB']]);
check('update row (legacy pk format)', ok($r), $r['text']);
$r = api('mysql_update_row', ['db_name' => 'ft_it', 'table' => 'my-links', 'pk' => ['a' => 1, 'b' => 2], 'row_data' => ['note' => 'changed']]);
check('update row with composite PK', ok($r) && $r['json']['affected'] === 1, $r['text']);
$r = api('mysql_delete_rows', ['db_name' => 'ft_it', 'table' => 'my-links', 'pk_rows' => [['a' => 1, 'b' => 1], ['a' => 2, 'b' => 1]]]);
check('delete rows with composite PK deletes exactly 2', ok($r) && $r['json']['affected'] === 2, $r['text']);
$r = api('mysql_table_data', ['db_name' => 'ft_it', 'table' => 'my-links', 'page' => 1, 'limit' => 50]);
check('composite delete left the right row', ok($r) && count($r['json']['rows']) === 1 && $r['json']['rows'][0]['b'] == 2);
$r = api('mysql_delete_rows', ['db_name' => 'ft_it', 'table' => 'users', 'pk_column' => 'id', 'pk_values' => [3]]);
check('delete rows (legacy single pk)', ok($r) && $r['json']['affected'] === 1, $r['text']);

// export
$r = http('POST', "$base/api/mysql_export", ['db_name' => 'ft_it', 'table' => 'users', 'format' => 'csv']);
check('export csv: headers', $r['status'] === 200 && stripos($r['headers'], 'text/csv') !== false && preg_match('/filename="ft_it_users_\d{8}_\d{6}\.csv"/', $r['headers']) === 1, $r['headers']);
check('export csv: content', strpos($r['text'], "id,name,bio") !== false && strpos($r['text'], 'ALICE') !== false);
$csv = $r['text'];
$r = http('POST', "$base/api/mysql_export", ['db_name' => 'ft_it', 'format' => 'sql']);
check('export sql: structure + data + escaping', strpos($r['text'], 'CREATE TABLE `users`') !== false && strpos($r['text'], 'CREATE TABLE `my-links`') !== false && strpos($r['text'], "'line1\\nline2'") !== false && strpos($r['text'], 'INSERT INTO `users`') !== false);
$dump = $r['text'];
check('export unknown table fails cleanly (JSON error, not a file)', !ok(http('POST', "$base/api/mysql_export", ['db_name' => 'ft_it', 'table' => 'nope', 'format' => 'csv'])));
check('csv export of whole db refused', !ok(http('POST', "$base/api/mysql_export", ['db_name' => 'ft_it', 'format' => 'csv'])));

// import: round-trip the dump into a fresh database
api('mysql_create_database', ['db_name' => 'ft_it_imp']);
$tmp = tempnam(sys_get_temp_dir(), 'dump') . '.sql';
file_put_contents($tmp, $dump);
$r = http('POST', "$base/api/mysql_import", ['db_name' => 'ft_it_imp', 'format' => 'sql', 'import_file' => new CURLFile($tmp, 'application/sql', 'dump.sql')], [], false);
check('import sql dump into new database', ok($r) && $r['json']['statements'] > 3, $r['text']);
$r = api('mysql_table_data', ['db_name' => 'ft_it_imp', 'table' => 'users', 'page' => 1, 'limit' => 50, 'order_by' => 'id']);
$orig = api('mysql_table_data', ['db_name' => 'ft_it', 'table' => 'users', 'page' => 1, 'limit' => 50, 'order_by' => 'id']);
check('round-trip data identical (incl. quotes, NULL, newline)', ok($r) && $r['json']['rows'] === $orig['json']['rows'] && count($r['json']['rows']) === 3, json_encode($r['json']['rows'] ?? $r['text']));
file_put_contents($tmp, "INSERT INTO users(name) VALUES ('ok');\nSELECT * FROM does_not_exist;\nINSERT INTO users(name) VALUES ('never');");
$r = http('POST', "$base/api/mysql_import", ['db_name' => 'ft_it_imp', 'format' => 'sql', 'import_file' => new CURLFile($tmp, 'application/sql', 'bad.sql')], [], false);
check('import sql stops at first error and reports position', !ok($r) && strpos(err($r), 'Statement 2 of 3 failed after 1 succeeded') !== false, err($r));

$csvFile = tempnam(sys_get_temp_dir(), 'csv') . '.csv';
file_put_contents($csvFile, "id,name,bio\n10,csvA,\"multi\nline\"\n11,csvB,\n");
$r = http('POST', "$base/api/mysql_import", ['db_name' => 'ft_it_imp', 'table' => 'users', 'format' => 'csv', 'empty_as_null' => '1', 'import_file' => new CURLFile($csvFile, 'text/csv', 'rows.csv')], [], false);
check('import csv rows', ok($r) && $r['json']['rows'] === 2, $r['text']);
$r = api('mysql_run_query', ['db_name' => 'ft_it_imp', 'sql' => "SELECT name, bio IS NULL AS bio_null FROM users WHERE id IN (10,11) ORDER BY id"]);
check('csv: multiline field kept, empty -> NULL', ok($r) && $r['json']['rows'][0]['name'] === 'csvA' && $r['json']['rows'][1]['bio_null'] == 1, $r['text']);
file_put_contents($csvFile, "id,name\n20,good\n21\n");
$before = api('mysql_run_query', ['db_name' => 'ft_it_imp', 'sql' => 'SELECT COUNT(*) c FROM users'])['json']['rows'][0]['c'];
$r = http('POST', "$base/api/mysql_import", ['db_name' => 'ft_it_imp', 'table' => 'users', 'format' => 'csv', 'import_file' => new CURLFile($csvFile, 'text/csv', 'bad.csv')], [], false);
$after = api('mysql_run_query', ['db_name' => 'ft_it_imp', 'sql' => 'SELECT COUNT(*) c FROM users'])['json']['rows'][0]['c'];
check('csv with a short row fails and rolls back the whole import', !ok($r) && $before === $after, err($r) . " before=$before after=$after");
file_put_contents($csvFile, "id,nope\n1,2\n");
$r = http('POST', "$base/api/mysql_import", ['db_name' => 'ft_it_imp', 'table' => 'users', 'format' => 'csv', 'import_file' => new CURLFile($csvFile, 'text/csv', 'unk.csv')], [], false);
check('csv with unknown column refused', !ok($r) && strpos(err($r), 'Unknown column') !== false, err($r));

// structure operations
$evil = "7'; DROP TABLE users;-- \\";
$r = api('mysql_save_column', ['db_name' => 'ft_it', 'table' => 'users', 'name' => 'age', 'type' => 'VARCHAR', 'length' => '50', 'nullable' => true, 'default_type' => 'USER_DEFINED', 'default_value' => $evil]);
check('add column with hostile default value', ok($r), $r['text']);
$cols = api('mysql_table_structure', ['db_name' => 'ft_it', 'table' => 'users'])['json']['columns'] ?? [];
$age = array_values(array_filter($cols, fn($c) => $c['Field'] === 'age'))[0] ?? null;
check('hostile default stored literally (no injection) and users table intact', $age && $age['Default'] === $evil, json_encode($age));
$r = api('mysql_save_column', ['db_name' => 'ft_it', 'table' => 'users', 'name' => 'score', 'type' => 'INT', 'nullable' => true, 'default_type' => 'USER_DEFINED', 'default_value' => '5']);
check('add column with default', ok($r), $r['text']);
$r = api('mysql_drop_columns', ['db_name' => 'ft_it', 'table' => 'users', 'columns' => ['score', 'age']]);
check('drop columns', ok($r), $r['text']);
$r = api('mysql_truncate_table', ['db_name' => 'ft_it', 'table' => 'users']);
check('truncate table', ok($r), $r['text']);
$r = api('mysql_table_data', ['db_name' => 'ft_it', 'table' => 'users', 'page' => 1, 'limit' => 50]);
check('table empty after truncate', ok($r) && $r['json']['total'] === 0);
$r = api('mysql_drop_table', ['db_name' => 'ft_it', 'table' => 'my-links']);
check('drop table with hyphen', ok($r), $r['text']);
$r = api('mysql_drop_table', ['db_name' => 'ft_it', 'table' => 'my-links']);
check('drop missing table reports error', !ok($r) && strlen(err($r)) > 0);

// drop database safety
$r = api('mysql_drop_database', ['db_name' => 'ft_it_imp']);
check('drop database without confirm_name refused', !ok($r) && strpos(err($r), 'Confirmation') !== false, err($r));
$r = api('mysql_drop_database', ['db_name' => 'ft_it_imp', 'confirm_name' => 'other']);
check('drop database with wrong confirm_name refused', !ok($r));
$r = api('mysql_drop_database', ['db_name' => 'mysql', 'confirm_name' => 'mysql']);
check('system database cannot be dropped', !ok($r) && strpos(err($r), 'System database') !== false, err($r));
$r = api('mysql_drop_database', ['db_name' => 'ft_it_imp', 'confirm_name' => 'ft_it_imp']);
check('drop database with matching confirm_name', ok($r) && !in_array('ft_it_imp', $r['json']['databases']), $r['text']);

// audit trail
$r = api('auth_audit_list', ['limit' => 200]);
$actions = array_column($r['json']['entries'] ?? [], 'action');
foreach (['auth_login_failed', 'auth_login', 'mysql_create_database', 'mysql_create_table', 'mysql_export', 'mysql_import', 'mysql_drop_columns', 'mysql_truncate_table', 'mysql_drop_table', 'mysql_drop_database', 'mysql_delete_rows', 'mysql_run_query'] as $a) {
    check("audit log has $a", in_array($a, $actions, true));
}
check('audit log does not log plain SELECT queries', count(array_filter($r['json']['entries'], fn($e) => $e['action'] === 'mysql_run_query' && stripos($e['detail'] ?? '', 'SELECT') === 0)) === 0);
check('audit entries carry user + ip', ($r['json']['entries'][0]['username'] ?? '') === 'admin' && ($r['json']['entries'][0]['ip_address'] ?? '') !== '');

// logout / unauthenticated access
http('POST', "$base/api/auth_logout", []);
$csrf = '';
$r = http('POST', "$base/api/mysql_list_tables", []);
check('API requires auth after logout (401)', $r['status'] === 401);

echo $failed ? "\n$failed check(s) FAILED\n" : "\nAll checks passed\n";
exit($failed ? 1 : 0);
