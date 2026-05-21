<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$host = trim($input['db_host'] ?? 'localhost');
$port = intval($input['db_port'] ?? 3306);
$user = trim($input['db_user'] ?? '');
$pass = $input['db_pass'] ?? '';
$name = trim($input['db_name'] ?? '');

if (empty($user) || empty($name)) {
    echo json_encode(['success' => false, 'message' => 'Database username and name are required.']);
    exit;
}

try {
    $dsn = "mysql:host={$host};port={$port};charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 5,
    ]);
    echo json_encode(['success' => true, 'message' => 'Connection successful.']);
} catch (PDOException $e) {
    $msg = $e->getMessage();
    if (strpos($msg, 'Access denied') !== false) {
        $msg = 'Access denied. Wrong username or password.';
    } elseif (strpos($msg, 'Connection refused') !== false) {
        $msg = 'Connection refused. Check host and port.';
    } elseif (strpos($msg, 'Unknown MySQL server host') !== false) {
        $msg = 'Unknown host. Check the database hostname.';
    } elseif (strpos($msg, 'php_network_getaddresses') !== false) {
        $msg = 'Cannot resolve host. Check the database hostname.';
    }
    echo json_encode(['success' => false, 'message' => $msg]);
}
