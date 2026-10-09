<?php
// Renders the app's partials into a standalone page used by the e2e tests (no PHP session/DB needed).
$activePlugins = [];
ob_start();
foreach (['workspace', 'sidebar', 'modals'] as $f) {
    include __DIR__ . "/../../views/partials/$f.php";
}
$html = ob_get_clean();
echo <<<HTML
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="/assets/vendor/bootstrap/css/bootstrap.min.css">
<link rel="stylesheet" href="/assets/vendor/bootstrap-icons/bootstrap-icons.min.css">
<link rel="stylesheet" href="/assets/css/style.css"></head><body>
<div id="globalLoadingBar"></div><div class="toast-container"></div><div id="connectionStatus"></div><div id="sessionList"></div>
<div id="wrap" style="display:flex;height:700px;width:1200px">$html</div>
<script src="/assets/vendor/jquery/jquery.min.js"></script>
<script src="/assets/vendor/bootstrap/js/bootstrap.bundle.min.js"></script>
<script>window.__ft_translate=(k,d)=>d;</script></body></html>
HTML;
