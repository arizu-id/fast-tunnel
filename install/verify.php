<?php
/**
 * Fast Tunnel — License Verification
 * Verifies Envato purchase code via the Envato Market API.
 */
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$purchaseCode = trim($input['purchase_code'] ?? '');
$email = trim($input['email'] ?? '');

if (empty($purchaseCode) || empty($email)) {
    echo json_encode(['success' => false, 'message' => 'Purchase code and email are required.']);
    exit;
}

// Validate purchase code format (UUID v4 format: 8-4-4-4-12)
if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $purchaseCode)) {
    echo json_encode(['success' => false, 'message' => 'Invalid purchase code format.']);
    exit;
}

// ── Verification Server Config ──
// The installer sends the verification request to your remote license server
// so that your personal Envato API token is kept secure and not exposed to buyers.
$verifyUrl = 'https://arizu.id/verify/envato/fasttunnel.php';

// If verification URL is empty, allow installation (development mode)
if (empty($verifyUrl)) {
    // Development/preview mode — accept any valid-format code
    echo json_encode([
        'success' => true,
        'license' => 'Regular License',
        'buyer' => $email,
        'message' => 'License verified (development mode).',
    ]);
    exit;
}

// Production: Verify via Remote License Server
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $verifyUrl,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode([
        'purchase_code' => $purchaseCode,
        'email' => $email
    ]),
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'User-Agent: Fast Tunnel Installer',
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_SSL_VERIFYPEER => true,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    echo json_encode(['success' => false, 'message' => 'Verification server connection error: ' . $curlError]);
    exit;
}

if ($httpCode !== 200) {
    echo json_encode(['success' => false, 'message' => 'Verification server error (HTTP ' . $httpCode . '). Please try again later.']);
    exit;
}

$payload = json_decode($response, true);
if (!$payload || !isset($payload['data']) || !isset($payload['signature'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid response structure from verification server.']);
    exit;
}

// ── Cryptographic Signature Verification ──
// Public Key to verify responses from arizu.id
$publicKey = "-----BEGIN PUBLIC KEY-----\n" .
    "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqK22v2f3o116c6znqGG0\n" .
    "b7H1AH93qaaSTkMx0fP15tka78NbfrKUjWYcNbc0MvGFcPTEAcpMg8NRrhONZLAy\n" .
    "hpC6DQXU1UAicavoDq/keeZMzhQpqHwdp7Uo2fyNFzoz5vypKsEiKZDQqC3ydCL0\n" .
    "za/iVXKoty6I9ZB3s0/cnVmfNcUORpF/VKGVi2meXbSpPxybzByJj6+uxgu1q0os\n" .
    "FcfKOYT7DPfSQ4EGHyLhbZGSL3k73u31LlacZVTE64WfRhv124e7q56S64zwO0bR\n" .
    "jC1rplvSdssQQAJUN8s56mERa4UvsuOUcCiInKhfAP4Ei5HMvTi23pNAhEiebHiZ\n" .
    "3QIDAQAB\n" .
    "-----END PUBLIC KEY-----";

$rawPayload = $payload['data'];
$signature = base64_decode($payload['signature']);

$verifyResult = openssl_verify($rawPayload, $signature, $publicKey, OPENSSL_ALGO_SHA256);

if ($verifyResult !== 1) {
    echo json_encode(['success' => false, 'message' => 'Security check failed. License signature is invalid.']);
    exit;
}

// Signature is valid! Now output the actual inner payload (the license verification details)
echo $rawPayload;
exit;
