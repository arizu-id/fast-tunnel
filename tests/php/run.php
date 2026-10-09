<?php
/** Dependency-free unit tests: `php tests/php/run.php` (exit code 1 on failure). */
$root = dirname(__DIR__, 2);
require_once $root . '/backend/Totp.php';
require_once $root . '/backend/SqlTools.php';
require_once $root . '/backend/RemoteFsTools.php';
require_once $root . '/backend/FtpClient.php';
require_once $root . '/backend/SftpClient.php';
require_once $root . '/backend/api_helpers.php';

$failed = 0;
$count = 0;
function t(string $name, callable $fn): void {
    global $failed, $count;
    $count++;
    try {
        $fn();
        echo "PASS $name\n";
    } catch (Throwable $e) {
        $failed++;
        echo "FAIL $name -> " . get_class($e) . ': ' . $e->getMessage() . "\n";
    }
}
function eq($expected, $actual, string $msg = ''): void {
    if ($expected !== $actual) throw new Exception(($msg ? "$msg: " : '') . 'expected ' . json_encode($expected) . ' got ' . json_encode($actual));
}
function throws(callable $fn, string $contains = ''): void {
    try { $fn(); } catch (Throwable $e) {
        if ($contains !== '' && stripos($e->getMessage(), $contains) === false) throw new Exception("wrong message: " . $e->getMessage());
        return;
    }
    throw new Exception('expected an exception');
}
function priv(object $o, string $method, array $args = []) {
    $m = new ReflectionMethod($o, $method);
    $m->setAccessible(true);
    return $m->invokeArgs($o, $args);
}

// ── TOTP (RFC 6238 appendix B test vectors, SHA-1, 6 digits) ──
$rfcSecret = Totp::base32Encode('12345678901234567890');
foreach ([59 => '287082', 1111111109 => '081804', 1111111111 => '050471', 1234567890 => '005924', 2000000000 => '279037', 20000000000 => '353130'] as $time => $code) {
    t("totp: RFC 6238 vector t=$time", fn() => eq($code, Totp::code($rfcSecret, intdiv($time, 30))));
}
t('totp: base32 round trip (all byte values)', function () {
    $bin = implode('', array_map('chr', range(0, 255)));
    eq($bin, Totp::base32Decode(Totp::base32Encode($bin)));
});
t('totp: base32 decode ignores case, spaces and padding', fn() => eq('foobar', Totp::base32Decode('mzxw 6ytb oi======')));
t('totp: invalid base32 is rejected', fn() => throws(fn() => Totp::base32Decode('abc1'), 'base32'));
t('totp: generated secret is 32 base32 chars', fn() => eq(1, preg_match('/^[A-Z2-7]{32}$/', Totp::generateSecret())));
t('totp: verify accepts current step and +-1 window', function () use ($rfcSecret) {
    $t = 1111111109;
    $step = intdiv($t, 30);
    eq($step, Totp::verify($rfcSecret, Totp::code($rfcSecret, $step), 1, 0, $t));
    eq($step - 1, Totp::verify($rfcSecret, Totp::code($rfcSecret, $step - 1), 1, 0, $t));
    eq($step + 1, Totp::verify($rfcSecret, Totp::code($rfcSecret, $step + 1), 1, 0, $t));
    eq(null, Totp::verify($rfcSecret, Totp::code($rfcSecret, $step + 2), 1, 0, $t), 'outside window');
});
t('totp: replay protection (afterStep)', function () use ($rfcSecret) {
    $t = 1111111109;
    $step = intdiv($t, 30);
    eq(null, Totp::verify($rfcSecret, Totp::code($rfcSecret, $step), 1, $step, $t), 'same step again');
    eq($step + 1, Totp::verify($rfcSecret, Totp::code($rfcSecret, $step + 1), 1, $step, $t), 'newer step still fine');
});
t('totp: malformed input never verifies', function () use ($rfcSecret) {
    foreach (['', 'abcdef', '12345', '1234567', '12 34 5x'] as $bad) eq(null, Totp::verify($rfcSecret, $bad, 1, 0, 59), "input '$bad'");
});
t('totp: input may contain spaces', fn() => eq(1, Totp::verify($rfcSecret, '287 082', 0, 0, 59)));
t('totp: otpauth URI', fn() => eq('otpauth://totp/Fast%20Tunnel:a%40b.c?secret=ABC&issuer=Fast%20Tunnel&algorithm=SHA1&digits=6&period=30', Totp::otpauthUri('a@b.c', 'ABC')));
t('totp: recovery codes are unique, formatted, and hashing is normalized', function () {
    $codes = Totp::generateRecoveryCodes(8);
    eq(8, count(array_unique($codes)));
    eq(1, preg_match('/^[a-z2-9]{5}-[a-z2-9]{5}$/', $codes[0]));
    eq(Totp::hashRecoveryCode($codes[0]), Totp::hashRecoveryCode(' ' . strtoupper($codes[0]) . ' '));
    eq(64, strlen(Totp::hashRecoveryCode($codes[0])));
});

// ── SQL script splitting ──
t('sql split: statements, strings, comments, conditional comments', function () {
    $sql = "-- c\nSET NAMES utf8mb4;\n/*!40101 SET x=1 */;\nINSERT INTO t VALUES ('a;b', \"c;\\\"d\", `e;f`); # trailing; comment\n/* only comment */;\nSELECT 1";
    $st = App\SqlTools::splitStatements($sql);
    eq(4, count($st));
    eq("INSERT INTO t VALUES ('a;b', \"c;\\\"d\", `e;f`)", $st[2]);
    eq('SELECT 1', $st[3]);
});
t('sql split: doubled quotes and backslash escapes keep strings intact', function () {
    $st = App\SqlTools::splitStatements("INSERT INTO t VALUES ('it''s; ok', 'back\\\\'); SELECT 2;");
    eq(2, count($st));
    eq('SELECT 2', $st[1]);
});
t('sql split: BOM, blank input, comment-only input', function () {
    eq(['SELECT 1'], App\SqlTools::splitStatements("\xEF\xBB\xBFSELECT 1;"));
    eq([], App\SqlTools::splitStatements("  \n"));
    eq([], App\SqlTools::splitStatements("-- nothing\n/* here */"));
});
t('sql split: DELIMITER is refused', fn() => throws(fn() => App\SqlTools::splitStatements("DELIMITER //\nCREATE TRIGGER x;"), 'DELIMITER'));
t('sql: quoteIdent doubles backticks', fn() => eq('`a``b`', App\SqlTools::quoteIdent('a`b')));

// ── identifier / type validation ──
t('sanitizeIdentifier: quotes, allows hyphen/space/unicode', function () {
    eq('`my-table`', sanitizeIdentifier('my-table'));
    eq('`ünï cödé`', sanitizeIdentifier('ünï cödé'));
});
t('sanitizeIdentifier: strips backticks so it cannot break out', fn() => eq('`abDROP`', sanitizeIdentifier('ab`DROP')));
t('sanitizeIdentifier: rejects empty, control chars and >64 chars', function () {
    throws(fn() => sanitizeIdentifier(''));
    throws(fn() => sanitizeIdentifier("a\nb"));
    throws(fn() => sanitizeIdentifier(str_repeat('x', 65)));
});
t('sanitizeDatabaseName: system schemas and odd names', function () {
    foreach (['mysql', 'MySQL', 'information_schema', 'performance_schema', 'sys'] as $n) throws(fn() => sanitizeDatabaseName($n), 'System');
    foreach (['', 'a`b', 'a/b', 'a.b', "a\x00b"] as $n) throws(fn() => sanitizeDatabaseName($n), 'Invalid');
    eq('`shop-2024`', sanitizeDatabaseName('shop-2024'));
});
t('sanitizeColumnType / Length', function () {
    eq('VARCHAR', sanitizeColumnType(' varchar '));
    throws(fn() => sanitizeColumnType('INT); DROP TABLE x;--'));
    eq('10,2', sanitizeColumnLength('10,2'));
    eq('', sanitizeColumnLength(' '));
    throws(fn() => sanitizeColumnLength('1; DROP'));
});
t('buildColumnDefinition', function () {
    eq('`id` INT(11) NOT NULL AUTO_INCREMENT', buildColumnDefinition(['name' => 'id', 'type' => 'int', 'length' => '11', 'nullable' => false, 'ai' => true]));
    eq("`n` VARCHAR(50) NULL DEFAULT 'it''s'", buildColumnDefinition(['name' => 'n', 'type' => 'VARCHAR', 'length' => '50', 'default_type' => 'USER_DEFINED', 'default_value' => "it's"]));
    eq("`n` TEXT NULL DEFAULT 'a\\\\'", buildColumnDefinition(['name' => 'n', 'type' => 'TEXT', 'default_type' => 'USER_DEFINED', 'default_value' => 'a\\']));
    eq('`t` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP', buildColumnDefinition(['name' => 't', 'type' => 'TIMESTAMP', 'nullable' => false, 'default_type' => 'CURRENT_TIMESTAMP']));
    eq('`d` TEXT NULL', buildColumnDefinition(['name' => 'd', 'type' => 'TEXT', 'length' => '99']), 'length ignored for TEXT');
    throws(fn() => buildColumnDefinition(['name' => 'x', 'type' => 'INT', 'default_type' => 'USER_DEFINED', 'default_value' => "a\0b"]));
});
t('pkFromRequest / pkRowsFromRequest (legacy and composite shapes)', function () {
    eq(['id' => 5], pkFromRequest(['pk_column' => 'id', 'pk_value' => 5]));
    eq(['a' => 1, 'b' => 2], pkFromRequest(['pk' => ['a' => 1, 'b' => 2]]));
    eq([], pkFromRequest(['pk_column' => 'id']));
    eq([['id' => 1], ['id' => 2]], pkRowsFromRequest(['pk_column' => 'id', 'pk_values' => [1, 2]]));
    eq([['a' => 1, 'b' => 2]], pkRowsFromRequest(['pk_rows' => [['a' => 1, 'b' => 2], [], 'x']]));
});

// ── FTP LIST parsing ──
t('ftp: parseRawList handles ls -l variants (dates with spaces, ISO dates, symlinks, odd names)', function () {
    $c = (new ReflectionClass(App\FtpClient::class))->newInstanceWithoutConstructor();
    $items = priv($c, 'parseRawList', [[
        'total 8',
        'drwxr-xr-x    2 1000     1000         4096 Oct 09 09:28 my dir',
        '-rw-r--r--    1 ftp      ftp           220 Mar 31  2024 .bashrc',
        'lrwxrwxrwx    1 root root 7 Jan  1 10:00 link -> target',
        '-rwxr-xr-x+ 1 u g 12 2024-01-02 10:00 iso name.txt',
        'drwxr-xr-x 2 u g 4096 Oct 09 09:28 .',
        'drwxr-xr-x 2 u g 4096 Oct 09 09:28 ..',
    ], '/x']);
    eq(['my dir', '.bashrc', 'iso name.txt', 'link'], array_column($items, 'name'), 'directories first, then by name');
    eq('/x/my dir', $items[0]['path']);
    eq([true, false, false, false], array_column($items, 'isDir'));
    eq(220, $items[1]['size']);
});

// ── SFTP virtual root ──
t('sftp: paths are clamped to the login directory', function () {
    $c = (new ReflectionClass(App\SftpClient::class))->newInstanceWithoutConstructor();
    $home = new ReflectionProperty($c, 'home');
    $home->setAccessible(true);
    $home->setValue($c, '/home/u');
    eq('/home/u', priv($c, 'abs', ['/']));
    eq('/home/u/a/b', priv($c, 'abs', ['/a/./b/']));
    eq('/home/u/etc', priv($c, 'abs', ['/../../etc']), '.. cannot climb above the root');
    eq('/home/u/x', priv($c, 'abs', ['x']));
    $home->setValue($c, '');
    eq('/', priv($c, 'abs', ['/']), 'server whose home is /');
    eq('/var', priv($c, 'abs', ['/var']));
});

echo "\n$count tests, " . ($failed ? "$failed FAILED" : 'all passed') . "\n";
exit($failed ? 1 : 0);
