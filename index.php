<?php
error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);
ini_set('display_errors','0');
ini_set('log_errors','1');
require_once __DIR__.'/config.php';
require_once __DIR__.'/backend/Auth.php';
Auth::requireAuth();
$activePlugins = [];
if (is_dir(__DIR__ . '/plugins')) {
    $dirs = glob(__DIR__ . '/plugins/*', GLOB_ONLYDIR);
    foreach ($dirs as $dir) {
        $name = basename($dir);
        if (strpos($name, 'temp_') === 0) continue;
        $activePlugins[] = $name;
    }
}
// Cache-busting version: newest mtime among our own JS/CSS (changes only when a file changes)
$assetVer = 0;
foreach (array_merge(glob(__DIR__ . '/assets/js/*.js') ?: [], glob(__DIR__ . '/assets/js/modules/*.js') ?: [], [__DIR__ . '/assets/css/style.css']) as $assetFile) {
    $assetVer = max($assetVer, (int)@filemtime($assetFile));
}
?>
<!DOCTYPE html>
<html lang="en" data-bs-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="<?php echo Auth::csrfToken(); ?>">
    <title>Fast Tunnel</title>
    <script>
        window.FAST_TUNNEL_PLUGINS = <?php echo json_encode($activePlugins); ?>;
        window.__ft_translate = window.__ft_translate || function(key, fallback) { return fallback || key; };
    </script>
    <link href="assets/vendor/fonts/inter.css" rel="stylesheet">
    <link href="assets/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="assets/vendor/bootstrap-icons/bootstrap-icons.min.css">
    <link rel="stylesheet" href="assets/vendor/jquery-contextmenu/jquery.contextMenu.min.css">
    <link rel="stylesheet" href="assets/vendor/xterm/xterm.css">
    <link rel="stylesheet" href="assets/css/style.css?v=<?php echo $assetVer; ?>">
    <?php
    foreach ($activePlugins as $plugin) {
        if (file_exists(__DIR__ . "/plugins/{$plugin}/plugin.css")) {
            echo '<link rel="stylesheet" href="plugins/' . $plugin . '/plugin.css">';
        }
    }
    ?>
</head>
<body>
    <div class="d-flex h-100 w-100 overflow-hidden main-container">
        <?php include_once __DIR__ . '/views/partials/sidebar.php'; ?>

        <div class="panel-right flex-grow-1 d-flex flex-column" style="min-width: 0;">
            <div class="p-2 border-bottom border-secondary d-flex align-items-center justify-content-between bg-darker panel-header" id="workspaceHeader">
                <div class="d-flex align-items-center">
                    <button class="btn btn-sm btn-icon d-md-none me-2" id="btnToggleSessions" title="Toggle Sessions"><i class="bi bi-list fs-5"></i></button>
                    <button class="btn btn-sm btn-icon d-md-none me-2 d-none" id="btnToggleExplorer" title="Toggle File Explorer"><i class="bi bi-folder2 fs-5"></i></button>
                    <span class="text-muted" id="connectionStatus"><i class="bi bi-info-circle me-2"></i><span data-i18n="not_connected">Not connected</span></span>
                </div>
                <div class="d-flex align-items-center gap-1">
                    <button class="btn btn-sm btn-icon" id="btnPluginsManager" title="Plugins Manager" data-i18n-title="plugins_manager" data-bs-toggle="modal" data-bs-target="#pluginsModal">
                        <i class="bi bi-puzzle"></i>
                    </button>
                    <div class="dropdown">
                        <button class="btn btn-icon btn-sm" id="btnMoreSettings" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="More">
                            <i class="bi bi-three-dots-vertical"></i>
                        </button>
                    <ul class="dropdown-menu dropdown-menu-end dropdown-menu-dark border-secondary shadow-lg" style="min-width: 200px; border-radius: 10px; overflow: hidden;">
                        <li><h6 class="dropdown-header text-muted small">Arizu Studio</h6></li>
                        <li>
                            <button class="dropdown-item d-flex align-items-center gap-2" data-bs-toggle="modal" data-bs-target="#editCredentialsModal" id="btnTriggerCredentialsModal">
                                <i class="bi bi-key text-muted"></i> <span data-i18n="edit_credentials">Edit Credentials</span>
                            </button>
                        </li>
                        <li>
                            <button class="dropdown-item d-flex align-items-center gap-2" data-bs-toggle="modal" data-bs-target="#auditLogModal" id="btnAuditLog">
                                <i class="bi bi-journal-text text-muted"></i> <span>Audit Log</span>
                            </button>
                        </li>
                        <li><hr class="dropdown-divider border-secondary my-1"></li>
                        <li>
                            <button class="dropdown-item d-flex align-items-center gap-2" data-bs-toggle="modal" data-bs-target="#privacyPolicyModal">
                                <i class="bi bi-shield-check text-muted"></i> <span data-i18n="privacy_policy">Privacy Policy</span>
                            </button>
                        </li>
                        <li>
                            <button class="dropdown-item d-flex align-items-center gap-2" data-bs-toggle="modal" data-bs-target="#termsModal">
                                <i class="bi bi-file-text text-muted"></i> <span data-i18n="terms_conditions">Terms &amp; Conditions</span>
                            </button>
                        </li>
                        <li>
                            <button class="dropdown-item d-flex align-items-center gap-2" data-bs-toggle="modal" data-bs-target="#aboutDevModal">
                                <i class="bi bi-person-circle text-muted"></i> <span data-i18n="about_developer">About Developer</span>
                            </button>
                        </li>
                        <li>
                            <button class="dropdown-item d-flex align-items-center gap-2" data-bs-toggle="modal" data-bs-target="#securityCreditsModal">
                                <i class="bi bi-award text-muted"></i> <span data-i18n="security_credits">Security Credits</span>
                            </button>
                        </li>
                        <li>
                            <button class="dropdown-item d-flex align-items-center gap-2" id="btnReplayTour">
                                <i class="bi bi-signpost-2 text-muted"></i> <span data-i18n="replay_tour">Feature Tour</span>
                            </button>
                        </li>
                        <li><hr class="dropdown-divider border-secondary my-1"></li>
                        <li>
                            <button class="dropdown-item d-flex align-items-center gap-2 text-danger" id="btnLogout">
                                <i class="bi bi-box-arrow-right"></i> <span data-i18n="logout">Logout</span>
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
            </div>

            <!-- Global loading bar — shown automatically during any API request -->
            <div id="globalLoadingBar" style="
                height: 3px;
                width: 0%;
                background: linear-gradient(90deg, #10b981, #3b82f6, #8b5cf6);
                background-size: 200% 100%;
                position: relative;
                flex-shrink: 0;
                transition: width 0.2s ease, opacity 0.3s ease;
                opacity: 0;
                overflow: hidden;
            ">
                <div id="globalLoadingShimmer" style="
                    position: absolute;
                    top: 0; left: -100%; width: 60%; height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
                    animation: loadingShimmer 0.8s linear infinite;
                "></div>
            </div>
            
            <?php include_once __DIR__ . '/views/partials/workspace.php'; ?>

            <div class="flex-grow-1 d-flex justify-content-center align-items-center flex-column bg-darker" id="welcomeArea">
                <i class="bi bi-broadcast text-secondary mb-4 opacity-25" style="font-size: 5rem;"></i>
                <h4 class="text-secondary opacity-50 fw-normal" data-i18n="select_session_connect">Select a session to connect</h4>
                <button class="btn btn-primary mt-4 px-4 py-2 rounded-pill shadow" data-bs-toggle="modal" data-bs-target="#addSessionModal">
                    <i class="bi bi-plus-lg me-2"></i> <span data-i18n="add_new_connection">Add New Connection</span>
                </button>
            </div>
        </div>
    </div>

    <?php include_once __DIR__ . '/views/partials/modals.php'; ?>

    <div class="sidebar-backdrop d-none" id="sidebarBackdrop"></div>
    <div class="toast-container position-fixed bottom-0 end-0 p-3"></div>

    <script src="assets/vendor/jquery/jquery.min.js"></script>
    <script src="assets/vendor/bootstrap/js/bootstrap.bundle.min.js"></script>
    <script src="assets/vendor/jquery-contextmenu/jquery.contextMenu.min.js"></script>
    <script src="assets/vendor/jquery-contextmenu/jquery.ui.position.js"></script>
    <script src="assets/vendor/xterm/xterm.js"></script>
    <script src="assets/vendor/xterm/xterm-addon-fit.js"></script>
    <script src="assets/vendor/monaco-editor/min/vs/loader.js"></script>
    <script type="importmap">
    {
      "imports": {
        "/assets/js/app.js": "/assets/js/app.js?v=<?php echo $assetVer; ?>",
        "/assets/js/modules/state.js": "/assets/js/modules/state.js?v=<?php echo $assetVer; ?>",
        "/assets/js/modules/helpers.js": "/assets/js/modules/helpers.js?v=<?php echo $assetVer; ?>",
        "/assets/js/modules/ui.js": "/assets/js/modules/ui.js?v=<?php echo $assetVer; ?>",
        "/assets/js/modules/sessions.js": "/assets/js/modules/sessions.js?v=<?php echo $assetVer; ?>",
        "/assets/js/modules/ftp.js": "/assets/js/modules/ftp.js?v=<?php echo $assetVer; ?>",
        "/assets/js/modules/editor.js": "/assets/js/modules/editor.js?v=<?php echo $assetVer; ?>",
        "/assets/js/modules/context-menu.js": "/assets/js/modules/context-menu.js?v=<?php echo $assetVer; ?>",
        "/assets/js/modules/loading.js": "/assets/js/modules/loading.js?v=<?php echo $assetVer; ?>",
        "/assets/js/modules/db-tools.js": "/assets/js/modules/db-tools.js?v=<?php echo $assetVer; ?>",
        "/assets/js/modules/file-tools.js": "/assets/js/modules/file-tools.js?v=<?php echo $assetVer; ?>",
        "/assets/js/modules/api.js": "/assets/js/modules/api.js?v=<?php echo $assetVer; ?>",
        "/assets/js/modules/loading-bar.js": "/assets/js/modules/loading-bar.js?v=<?php echo $assetVer; ?>",
        "/assets/js/modules/crypto.js": "/assets/js/modules/crypto.js?v=<?php echo $assetVer; ?>",
        "/assets/js/modules/db.js": "/assets/js/modules/db.js?v=<?php echo $assetVer; ?>",
        "/assets/js/modules/ssh.js": "/assets/js/modules/ssh.js?v=<?php echo $assetVer; ?>",
        "/assets/js/modules/db-helpers.js": "/assets/js/modules/db-helpers.js?v=<?php echo $assetVer; ?>",
        "/assets/js/modules/tour.js": "/assets/js/modules/tour.js?v=<?php echo $assetVer; ?>"
      }
    }
    </script>
    <script type="module" src="assets/js/app.js?v=<?php echo $assetVer; ?>"></script>
    <?php
    foreach ($activePlugins as $plugin) {
        if (file_exists(__DIR__ . "/plugins/{$plugin}/plugin.js")) {
            echo '<script type="module" src="plugins/' . $plugin . '/plugin.js"></script>';
        }
    }
    ?>
</body>
</html>
