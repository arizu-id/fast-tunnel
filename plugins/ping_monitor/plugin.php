<?php
if (isset($_GET['action']) && $_GET['action'] === 'ping_check') {
    // 1. Require Auth & Validate CSRF
    Auth::requireApiAuth();
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        Auth::validateCsrf();
        
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $uid = $data['uid'] ?? '';
        
        if (empty($uid)) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'error' => 'Missing session UID']);
            exit;
        }
        
        $userId = Auth::userId();
        $db = getAppDb();
        
        // 2. Fetch session from DB to decrypt host & port securely (Zero Trust - never trust client input)
        $stmt = $db->prepare("SELECT host_enc, port FROM saved_sessions WHERE session_uid = ? AND user_id = ?");
        $stmt->execute([$uid, $userId]);
        $row = $stmt->fetch();
        
        if (!$row) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'error' => 'Session not found or access denied']);
            exit;
        }
        
        $host = Auth::decrypt($row['host_enc']);
        $port = (int)$row['port'];
        
        if (empty($host) || !$port) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'error' => 'Invalid session connection metadata']);
            exit;
        }
        
        // 3. Connect to the host:port and measure latency (2.0s limit)
        $start = microtime(true);
        $fp = @fsockopen($host, $port, $errno, $errstr, 2.0);
        
        if ($fp) {
            $latency = round((microtime(true) - $start) * 1000);
            fclose($fp);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'online' => true,
                'latency' => $latency
            ]);
        } else {
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'online' => false,
                'error' => $errstr ?: 'Connection timed out'
            ]);
        }
        exit;
    }
}
