<?php
/**
 * Fast Tunnel — Pre-flight System Check
 * Returns JSON with pass/fail status for each requirement.
 */
header('Content-Type: application/json');

$checks = [];

// 1. PHP Version >= 8.0
$checks[] = [
    'name' => 'PHP Version',
    'required' => '≥ 8.0',
    'current' => PHP_VERSION,
    'pass' => version_compare(PHP_VERSION, '8.0.0', '>='),
    'optional' => false,
];

// 2. Required PHP Extensions
$requiredExtensions = [
    'pdo' => 'PDO (Database abstraction)',
    'pdo_mysql' => 'PDO MySQL Driver',
    'curl' => 'cURL (HTTP requests)',
    'openssl' => 'OpenSSL (Encryption)',
    'json' => 'JSON',
    'ftp' => 'FTP (File transfer)',
    'session' => 'Session handling',
];

foreach ($requiredExtensions as $ext => $label) {
    $checks[] = [
        'name' => $label,
        'required' => 'Enabled',
        'current' => extension_loaded($ext) ? 'Enabled' : 'Not installed',
        'pass' => extension_loaded($ext),
        'optional' => false,
    ];
}

// 3. Recommended PHP Extensions (Optional / Warning only)
$recommendedExtensions = [
    'mbstring' => 'Multibyte String (for multi-language support)',
];

foreach ($recommendedExtensions as $ext => $label) {
    $checks[] = [
        'name' => $label,
        'required' => 'Recommended',
        'current' => extension_loaded($ext) ? 'Enabled' : 'Not installed',
        'pass' => extension_loaded($ext),
        'optional' => true,
    ];
}

// 4. config.php directory writable
$rootDir = dirname(__DIR__);
$checks[] = [
    'name' => 'Config directory writable',
    'required' => 'Writable',
    'current' => is_writable($rootDir) ? 'Writable' : 'Not writable',
    'pass' => is_writable($rootDir),
    'optional' => false,
];

// 5. temp_ssh directory
$tempSshDir = $rootDir . '/temp_ssh';
if (!is_dir($tempSshDir)) {
    @mkdir($tempSshDir, 0755, true);
}
$checks[] = [
    'name' => 'temp_ssh/ directory',
    'required' => 'Writable',
    'current' => (is_dir($tempSshDir) && is_writable($tempSshDir)) ? 'Writable' : 'Not writable',
    'pass' => is_dir($tempSshDir) && is_writable($tempSshDir),
    'optional' => false,
];

// 6. Composer vendor installed
$checks[] = [
    'name' => 'Composer dependencies',
    'required' => 'Installed',
    'current' => is_dir($rootDir . '/vendor/phpseclib') ? 'Installed' : 'Not found',
    'pass' => is_dir($rootDir . '/vendor/phpseclib'),
    'optional' => false,
];

// Overall
$allPass = true;
foreach ($checks as $c) {
    if (!$c['optional'] && !$c['pass']) { $allPass = false; break; }
}

echo json_encode([
    'success' => true,
    'all_pass' => $allPass,
    'checks' => $checks,
]);
