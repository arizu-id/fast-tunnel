<?php
/**
 * Multi-Language Plugin Backend
 * Serves translation data from locales/*.php files
 */
if (isset($_GET['action']) && $_GET['action'] === 'lang_get') {
    Auth::requireApiAuth();

    $lang = preg_replace('/[^a-z_]/', '', $_GET['lang'] ?? $_POST['lang'] ?? 'en');
    if (empty($lang)) $lang = 'en';

    $file = __DIR__ . '/locales/' . $lang . '.php';
    if (!file_exists($file)) {
        $file = __DIR__ . '/locales/en.php';
    }

    $translations = [];
    if (file_exists($file)) {
        $translations = require $file;
    }

    // Also provide the list of available languages
    $available = [];
    $localesDir = __DIR__ . '/locales';
    if (is_dir($localesDir)) {
        $files = glob($localesDir . '/*.php');
        foreach ($files as $f) {
            $code = pathinfo($f, PATHINFO_FILENAME);
            $data = require $f;
            $available[] = [
                'code' => $code,
                'name' => $data['_lang_name'] ?? $code,
                'flag' => $data['_lang_flag'] ?? '🌐'
            ];
        }
    }

    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'lang' => $lang,
        'translations' => $translations,
        'available' => $available
    ]);
    exit;
}
