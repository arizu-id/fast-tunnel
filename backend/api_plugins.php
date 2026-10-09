<?php
if ($method === 'POST') {
    switch ($action) {
        case 'get_plugins':
            $appInfo = [];
            if (file_exists(__DIR__ . '/../app.json')) {
                $appInfo = json_decode(file_get_contents(__DIR__ . '/../app.json'), true) ?: [];
            }
            $plugins = [];
            $pluginDir = __DIR__ . '/../plugins';
            if (is_dir($pluginDir)) {
                $dirs = glob($pluginDir . '/*', GLOB_ONLYDIR) ?: [];
                foreach ($dirs as $dir) {
                    $slug = basename($dir);
                    if (strpos($slug, 'temp_') === 0) continue;
                    $infoFile = $dir . '/info.json';
                    if (file_exists($infoFile)) {
                        $info = json_decode(file_get_contents($infoFile), true) ?: [];
                    } else {
                        $info = [
                            'name' => $slug,
                            'slug' => $slug,
                            'version' => '0.0.0',
                            'description' => 'No info.json found.',
                            'author' => 'Unknown'
                        ];
                    }
                    $info['slug'] = $slug;
                    $plugins[] = $info;
                }
            }
            echo json_encode([
                'success' => true,
                'app' => $appInfo,
                'plugins' => $plugins
            ]);
            break;

        case 'delete_plugin':
            $slug = $data['slug'] ?? '';
            if (!$slug || !preg_match('/^[a-zA-Z0-9_\-]+$/', $slug) || strpos($slug, 'temp_') === 0) {
                throw new Exception("Invalid plugin slug");
            }
            $pluginsRoot = realpath(__DIR__ . '/../plugins');
            $dir = __DIR__ . '/../plugins/' . $slug;
            $realDir = realpath($dir);
            if (!$realDir || !is_dir($realDir) || strpos($realDir, $pluginsRoot) !== 0) {
                throw new Exception("Plugin not found or invalid path");
            }
            rmdir_recursive($realDir);
            echo json_encode(['success' => true]);
            break;

        case 'install_plugin':
            if (!isset($_FILES['plugin_file'])) {
                throw new Exception("No plugin file uploaded.");
            }
            $file = $_FILES['plugin_file'];
            if ($file['error'] !== UPLOAD_ERR_OK) {
                throw new Exception("Upload error code: " . $file['error']);
            }
            $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
            if (strtolower($ext) !== 'zip') {
                throw new Exception("Only ZIP files are supported.");
            }
            if (!class_exists('ZipArchive')) {
                throw new Exception("PHP ZipArchive extension is not enabled. Please enable it in php.ini.");
            }

            $zip = new ZipArchive();
            if ($zip->open($file['tmp_name']) !== TRUE) {
                throw new Exception("Failed to open ZIP file.");
            }

            $tempDirName = 'temp_' . uniqid('', true);
            $tempPath = __DIR__ . '/../plugins/' . $tempDirName;
            if (!mkdir($tempPath, 0755, true)) {
                $zip->close();
                throw new Exception("Failed to create temporary installation folder.");
            }

            $realTempPath = realpath($tempPath);
            if ($realTempPath === false) {
                $zip->close();
                rmdir_recursive($tempPath);
                throw new Exception("Failed to resolve temporary installation path.");
            }

            // Security Audit: Inspect ZIP entries for Zip-Slip (Path Traversal) and forbidden files
            $numFiles = $zip->numFiles;
            // Zip-bomb guard: cap entry count and total uncompressed size
            $totalSize = 0;
            for ($i = 0; $i < $numFiles; $i++) {
                $st = $zip->statIndex($i);
                $totalSize += $st ? (int)$st['size'] : 0;
            }
            if ($numFiles > 1000 || $totalSize > 50 * 1024 * 1024) {
                $zip->close();
                rmdir_recursive($tempPath);
                throw new Exception("Plugin archive is too large (max 1000 files / 50 MB uncompressed).");
            }
            $disallowedExts = ['phtml', 'php3', 'php4', 'php5', 'php7', 'phps', 'phar', 'inc', 'cgi', 'pl', 'py', 'asp', 'aspx', 'exe', 'sh', 'bat', 'cmd', 'dll', 'so'];

            for ($i = 0; $i < $numFiles; $i++) {
                $stat = $zip->statIndex($i);
                if (!$stat) continue;
                $entryName = $stat['name'];
                $normName = str_replace('\\', '/', $entryName);

                // 1. Zip-Slip / Path Traversal Check
                if (strpos($normName, '../') !== false || strpos($normName, '..\\') !== false || strpos($normName, ':') !== false || strpos($normName, '/') === 0) {
                    $zip->close();
                    rmdir_recursive($tempPath);
                    throw new Exception("Security Error: Invalid path in ZIP archive (Zip-Slip attempt detected).");
                }

                $basename = basename($normName);
                if ($basename === '' || $basename === '.' || $basename === '..') continue;

                // 2. Block hidden & dangerous configuration files (.htaccess, .htpasswd, .user.ini, php.ini, .env, .git)
                if (strpos($basename, '.') === 0 || strcasecmp($basename, '.htaccess') === 0 || strcasecmp($basename, '.htpasswd') === 0 || strcasecmp($basename, '.user.ini') === 0 || strcasecmp($basename, 'php.ini') === 0) {
                    $zip->close();
                    rmdir_recursive($tempPath);
                    throw new Exception("Security Error: Restricted file '$basename' is forbidden in plugin archives.");
                }

                // 3. Block dangerous executable extensions
                $fileExt = strtolower(pathinfo($basename, PATHINFO_EXTENSION));
                if (in_array($fileExt, $disallowedExts)) {
                    $zip->close();
                    rmdir_recursive($tempPath);
                    throw new Exception("Security Error: Executable file extension '.$fileExt' ($basename) is forbidden.");
                }

                // 4. Ensure target destination path resolves inside $realTempPath
                $targetFile = $tempPath . '/' . $normName;
                $targetDir = dirname($targetFile);
                if (!is_dir($targetDir)) {
                    @mkdir($targetDir, 0755, true);
                }
                $canonicalTargetDir = realpath($targetDir);
                if ($canonicalTargetDir === false || strpos($canonicalTargetDir, $realTempPath) !== 0) {
                    $zip->close();
                    rmdir_recursive($tempPath);
                    throw new Exception("Security Error: Destination path outside plugin directory is forbidden.");
                }
            }

            // Extract ZIP safely
            if (!$zip->extractTo($tempPath)) {
                $zip->close();
                rmdir_recursive($tempPath);
                throw new Exception("Failed to extract plugin ZIP archive.");
            }
            $zip->close();

            if (!function_exists('findInfoJson')) {
                function findInfoJson($dir) {
                    $files = scandir($dir);
                    foreach ($files as $file) {
                        if ($file === '.' || $file === '..') continue;
                        $path = $dir . '/' . $file;
                        if (is_dir($path)) {
                            $res = findInfoJson($path);
                            if ($res) return $res;
                        } else if ($file === 'info.json') {
                            return $path;
                        }
                    }
                    return null;
                }
            }

            $infoJsonPath = findInfoJson($tempPath);
            if (!$infoJsonPath) {
                rmdir_recursive($tempPath);
                throw new Exception("Invalid plugin: info.json not found in the ZIP archive.");
            }

            $infoData = json_decode(file_get_contents($infoJsonPath), true);
            $slug = $infoData['slug'] ?? '';
            if (!$slug || !preg_match('/^[a-zA-Z0-9_\-]+$/', $slug) || strpos($slug, 'temp_') === 0) {
                $slug = pathinfo($file['name'], PATHINFO_FILENAME);
                $slug = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $slug);
            }

            $pluginsRoot = realpath(__DIR__ . '/../plugins');
            $targetPath = __DIR__ . '/../plugins/' . $slug;

            if (is_dir($targetPath)) {
                rmdir_recursive($targetPath);
            }

            $pluginSourceDir = dirname($infoJsonPath);
            if (!rename($pluginSourceDir, $targetPath)) {
                copy_recursive($pluginSourceDir, $targetPath);
            }
            rmdir_recursive($tempPath);

            echo json_encode(['success' => true, 'slug' => $slug]);
            break;

        default:
            throw new Exception("Invalid action POST: $action");
    }
}
