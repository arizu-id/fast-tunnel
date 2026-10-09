<?php
// Router for `php -S` so the integration tests don't need Apache/nginx rewrite rules.
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$root = dirname(__DIR__, 2);
if (preg_match('#^/api/([^/]+)$#', $path, $m)) {
    $_GET['action'] = $m[1];
    require $root . '/api.php';
    return true;
}
if ($path === '/login') { require $root . '/login.php'; return true; }
if ($path === '/') { require $root . '/index.php'; return true; }
if (preg_match('#^/(backend|vendor|temp_ssh)/#', $path) || preg_match('#\.json$#', $path)) { http_response_code(403); return true; }
return false;
