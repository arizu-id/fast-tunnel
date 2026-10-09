<?php
/**
 * Fast Tunnel — Database Setup & Config Generation
 * Creates database, tables, admin user, and generates config.php.
 */
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$dbHost   = trim($input['db_host'] ?? 'localhost');
$dbPort   = intval($input['db_port'] ?? 3306);
$dbUser   = trim($input['db_user'] ?? '');
$dbPass   = $input['db_pass'] ?? '';
$dbName   = trim($input['db_name'] ?? '');
$adminUser = trim($input['admin_user'] ?? 'admin');
$adminPass = trim($input['admin_pass'] ?? '');
$licenseKey = trim($input['license_key'] ?? '');
$licenseEmail = trim($input['license_email'] ?? '');

// Validate
$errors = [];
if (empty($dbUser)) $errors[] = 'Database username is required.';
if (empty($dbName)) $errors[] = 'Database name is required.';
if (empty($adminUser)) $errors[] = 'Admin username is required.';
if (strlen($adminPass) < 4) $errors[] = 'Admin password must be at least 4 characters.';

if (!empty($errors)) {
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit;
}

try {
    // 1. Test DB connection (without database)
    $dsn = "mysql:host={$dbHost};port={$dbPort};charset=utf8mb4";
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 5,
    ]);

    // 2. Create database
    $safeName = preg_replace('/[^a-zA-Z0-9_]/', '', $dbName);
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$safeName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `{$safeName}`");

    // 3. Create tables
    $pdo->exec("CREATE TABLE IF NOT EXISTS users(
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB");

    $pdo->exec("CREATE TABLE IF NOT EXISTS saved_sessions(
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        session_uid VARCHAR(64) UNIQUE NOT NULL,
        protocol ENUM('ftp','ssh','mysql') NOT NULL,
        name VARCHAR(100) NOT NULL,
        host_enc TEXT NOT NULL,
        port INT NOT NULL DEFAULT 21,
        user_enc TEXT NOT NULL,
        pass_enc TEXT NOT NULL,
        db_name_enc TEXT DEFAULT NULL,
        extra_enc TEXT DEFAULT NULL,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB");

    $pdo->exec("CREATE TABLE IF NOT EXISTS login_attempts(
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL,
        attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ip_time(ip_address, attempted_at)
    ) ENGINE=InnoDB");

    // 4. Create admin user
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ?");
    $stmt->execute([$adminUser]);
    if ((int)$stmt->fetchColumn() === 0) {
        $hash = password_hash($adminPass, PASSWORD_BCRYPT, ['cost' => 12]);
        $ins = $pdo->prepare("INSERT INTO users(username, password_hash) VALUES(?, ?)");
        $ins->execute([$adminUser, $hash]);
    }

    // 5. Generate unique encryption key
    $encryptionKey = bin2hex(random_bytes(32));

    // 6. Generate config.php
    $rootDir = dirname(__DIR__);
    $configTemplate = file_get_contents($rootDir . '/config.sample.php');
    $configContent = str_replace(
        ['%%DB_HOST%%', '%%DB_PORT%%', '%%DB_USER%%', '%%DB_PASS%%', '%%DB_NAME%%', '%%ENCRYPTION_KEY%%', '%%LICENSE_KEY%%', '%%LICENSE_EMAIL%%'],
        [$dbHost, $dbPort, $dbUser, $dbPass, $safeName, $encryptionKey, $licenseKey, $licenseEmail],
        $configTemplate
    );

    // Write config.php
    $configPath = $rootDir . '/config.php';
    if (file_put_contents($configPath, $configContent) === false) {
        throw new Exception('Failed to write config.php. Check file permissions.');
    }

    // 7. Create installed.lock
    file_put_contents($rootDir . '/installed.lock', json_encode([
        'installed_at' => date('Y-m-d H:i:s'),
        'version' => '1.0.0',
        'php_version' => PHP_VERSION,
    ]));

    echo json_encode([
        'success' => true,
        'message' => 'Installation completed successfully!',
        'admin_user' => $adminUser,
    ]);

} catch (PDOException $e) {
    $msg = $e->getMessage();
    // Friendly messages
    if (strpos($msg, 'Access denied') !== false) {
        $msg = 'Database access denied. Check username and password.';
    } elseif (strpos($msg, 'Connection refused') !== false) {
        $msg = 'Could not connect to database server. Check host and port.';
    } elseif (strpos($msg, 'Unknown MySQL server host') !== false) {
        $msg = 'Unknown database host. Check the hostname.';
    }
    echo json_encode(['success' => false, 'message' => $msg]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
