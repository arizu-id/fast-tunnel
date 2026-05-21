<?php
// Suppress deprecated warnings and minor notices from output to ensure clean HTML rendering
error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED & ~E_NOTICE & ~E_WARNING);
ini_set('display_errors', '0');

$activePlugins = [];
if (is_dir(__DIR__ . '/plugins')) {
    $dirs = glob(__DIR__ . '/plugins/*', GLOB_ONLYDIR);
    foreach ($dirs as $dir) {
        $name = basename($dir);
        if (strpos($name, 'temp_') === 0) continue;
        $activePlugins[] = $name;
    }
}
?>
<!DOCTYPE html>
<html lang="en" data-bs-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fast Tunnel</title>
    <script>
        window.FAST_TUNNEL_PLUGINS = <?php echo json_encode($activePlugins); ?>;
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-contextmenu/2.9.2/jquery.contextMenu.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.css">
    <link rel="stylesheet" href="assets/css/style.css">
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
        <div class="panel-left d-flex flex-column border-end border-secondary">
            <div class="p-3 border-bottom border-secondary d-flex justify-content-between align-items-center bg-darker panel-header">
                <h6 class="mb-0 fw-semibold tracking-wide text-uppercase text-muted" style="font-size: 0.75rem;"><i class="bi bi-hdd-network me-2"></i>Fast Tunnel</h6>
                <div class="d-flex align-items-center gap-1">
                    <button class="btn btn-sm btn-icon" id="btnImportSessions" title="Import Sessions">
                        <i class="bi bi-box-arrow-in-down"></i>
                    </button>
                    <button class="btn btn-sm btn-icon" id="btnExportSessions" title="Export Sessions">
                        <i class="bi bi-box-arrow-up"></i>
                    </button>
                    <button class="btn btn-sm btn-icon" data-bs-toggle="modal" data-bs-target="#addSessionModal" title="New Session">
                        <i class="bi bi-plus-lg"></i>
                    </button>
                </div>
            </div>
            <input type="file" id="importFileInput" accept=".json" style="display:none;">
            <div class="flex-grow-1 overflow-auto session-list py-2" id="sessionList">
            </div>
        </div>

        <div class="panel-right flex-grow-1 d-flex flex-column" style="min-width: 0;">
            <div class="p-2 border-bottom border-secondary d-flex align-items-center justify-content-between bg-darker panel-header" id="workspaceHeader">
                <div class="d-flex align-items-center">
                    <button class="btn btn-sm btn-icon d-md-none me-2" id="btnToggleSessions" title="Toggle Sessions"><i class="bi bi-list fs-5"></i></button>
                    <button class="btn btn-sm btn-icon d-md-none me-2 d-none" id="btnToggleExplorer" title="Toggle File Explorer"><i class="bi bi-folder2 fs-5"></i></button>
                    <span class="text-muted" id="connectionStatus"><i class="bi bi-info-circle me-2"></i>Not connected</span>
                </div>
                <div class="d-flex align-items-center gap-1">
                    <button class="btn btn-sm btn-icon" id="btnPluginsManager" title="Plugins Manager" data-bs-toggle="modal" data-bs-target="#pluginsModal">
                        <i class="bi bi-puzzle"></i>
                    </button>
                    <div class="dropdown">
                        <button class="btn btn-icon btn-sm" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="More">
                            <i class="bi bi-three-dots-vertical"></i>
                        </button>
                    <ul class="dropdown-menu dropdown-menu-end dropdown-menu-dark border-secondary shadow-lg" style="min-width: 200px; border-radius: 10px; overflow: hidden;">
                        <li><h6 class="dropdown-header text-muted small">Arizu Studio</h6></li>
                        <li>
                            <button class="dropdown-item d-flex align-items-center gap-2" data-bs-toggle="modal" data-bs-target="#aboutDevModal">
                                <i class="bi bi-person-circle text-muted"></i> About Developer
                            </button>
                        </li>
                        <li><hr class="dropdown-divider border-secondary my-1"></li>
                        <li>
                            <button class="dropdown-item d-flex align-items-center gap-2" data-bs-toggle="modal" data-bs-target="#privacyPolicyModal">
                                <i class="bi bi-shield-check text-muted"></i> Privacy Policy
                            </button>
                        </li>
                        <li>
                            <button class="dropdown-item d-flex align-items-center gap-2" data-bs-toggle="modal" data-bs-target="#termsModal">
                                <i class="bi bi-file-text text-muted"></i> Terms &amp; Conditions
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
            
            <div class="d-flex flex-grow-1 overflow-hidden d-none" id="workspaceArea">
                <div class="file-explorer border-end border-secondary d-flex flex-column" id="ftpSidebar" style="width: 260px;">
                    <div class="p-2 border-bottom border-secondary d-flex justify-content-between align-items-center bg-dark panel-header">
                        <span class="small text-muted text-uppercase fw-semibold ms-2" style="letter-spacing: 0.5px;">Workspace</span>
                        <div class="btn-group gap-1">
                            <button class="btn btn-sm btn-icon" id="btnAddFile" title="New File"><i class="bi bi-file-earmark-plus"></i></button>
                            <button class="btn btn-sm btn-icon" id="btnAddFolder" title="New Folder"><i class="bi bi-folder-plus"></i></button>
                            <button class="btn btn-sm btn-icon" id="btnRefresh" title="Refresh"><i class="bi bi-arrow-clockwise"></i></button>
                        </div>
                    </div>
                    <div class="p-1 px-3 small text-truncate text-muted border-bottom border-secondary bg-dark font-monospace" id="currentPath" title="/">/</div>
                    <div class="flex-grow-1 overflow-auto file-list py-2" id="fileList">
                    </div>
                </div>

                <div class="db-sidebar border-end border-secondary d-none flex-column" id="dbSidebar" style="width: 260px; background-color: #18181b;">
                    <div class="p-2 border-bottom border-secondary d-flex flex-column bg-dark panel-header" style="height: auto;">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="small text-muted text-uppercase fw-semibold ms-2" style="letter-spacing: 0.5px;">Database Explorer</span>
                            <button class="btn btn-sm btn-icon text-danger btn-db-disconnect" style="padding: 2px 6px;" title="Disconnect"><i class="bi bi-power"></i></button>
                        </div>
                        <select class="form-select form-select-sm bg-darker text-light border-secondary" id="dbSelector" style="font-size: 0.8rem; border-radius: 6px;">
                            <option value="">-- Select Database --</option>
                        </select>
                    </div>
                    <div class="flex-grow-1 overflow-auto db-table-list py-2 px-2" id="dbTableList">
                    </div>
                </div>

                <div class="ssh-sidebar border-end border-secondary d-none flex-column" id="sshSidebar" style="width: 280px; background-color: #18181b; overflow: hidden;">
                </div>
                
                <div class="editor-area flex-grow-1 position-relative bg-darker d-flex flex-column" style="min-width: 0;">
                    <div class="editor-tabs-container border-bottom border-secondary bg-dark d-flex align-items-center overflow-hidden">
                        <div class="editor-tabs d-flex align-items-center flex-nowrap flex-grow-1 overflow-auto" id="editorTabs" style="scrollbar-width: none; -ms-overflow-style: none;">
                        </div>
                    </div>
                    
                    <div class="d-flex flex-column flex-grow-1 overflow-hidden position-relative" id="monaco-container">
                        <div id="monacoEditorEl" class="flex-grow-1" style="min-height:0;"></div>
                    </div>

                    <div id="floatingActionPanel" class="bg-dark border-top border-secondary px-3 py-2 align-items-center justify-content-end gap-2 d-none" style="z-index: 10; flex-shrink:0;">
                        <button id="btnSaveFile" class="btn-editor-action btn-editor-save d-flex align-items-center gap-2" title="Save (Ctrl+S)">
                            <i class="bi bi-floppy"></i>
                            <span>Save</span>
                        </button>
                        <button id="btnSaveCloseFile" class="btn-editor-action btn-editor-close d-flex align-items-center gap-2" title="Save and Close">
                            <i class="bi bi-x-lg"></i>
                            <span>Save &amp; Close</span>
                        </button>
                    </div>

                    <div class="db-container flex-grow-1 flex-column overflow-hidden bg-darker d-none" id="db-container">
                         <!-- DB Tabs Nav -->
                         <div class="db-tabs-nav d-flex align-items-center gap-1 px-3 pt-2 border-bottom border-secondary" id="dbTabsNav" style="background: #1a1a1e; flex-shrink:0;">
                             <button class="db-tab-btn active" id="dbTabStructure" data-tab="structure">
                                 <i class="bi bi-folder2-open me-1"></i>Structure
                             </button>
                             <button class="db-tab-btn" id="dbTabSql" data-tab="sql">
                                 <i class="bi bi-code-slash me-1"></i>SQL
                             </button>
                             <button class="db-tab-btn" id="dbTabBrowse" data-tab="browse">
                                 <i class="bi bi-table me-1"></i>Browse
                             </button>
                             <button class="db-tab-btn" id="dbTabColumns" data-tab="columns">
                                 <i class="bi bi-list-columns-reverse me-1"></i>Table Columns
                             </button>
                             <div class="ms-auto d-flex align-items-center gap-2 pb-1">
                                 <span class="text-muted small" id="dbActiveTableBadge" style="display:none;">
                                     <i class="bi bi-table me-1 text-success"></i>
                                     <span id="dbActiveTableName" class="text-success fw-bold"></span>
                                 </span>
                             </div>
                         </div>

                         <!-- Structure Tab -->
                         <div class="db-tab-pane flex-grow-1 overflow-auto p-3" id="dbPaneStructure">
                             <div class="text-center text-muted p-5" id="dbStructurePlaceholder">
                                 <i class="bi bi-database mb-3 opacity-25" style="font-size: 3.5rem; display:block;"></i>
                                 <span class="opacity-50">Select a database to view its structure</span>
                             </div>
                             <div id="dbStructureContent" class="d-none">
                                 <div class="d-flex justify-content-between align-items-center mb-3">
                                     <h6 class="mb-0 text-light fw-bold">
                                         <i class="bi bi-folder2-open me-2 text-warning"></i>
                                         <span id="dbStructureDbName"></span>
                                     </h6>
                                     <div class="d-flex gap-2">
                                         <button class="btn btn-sm btn-outline-secondary" id="btnRefreshStructure">
                                             <i class="bi bi-arrow-clockwise me-1"></i>Refresh
                                         </button>
                                         <button class="btn btn-sm btn-outline-primary" id="btnNewQuery">
                                             <i class="bi bi-plus me-1"></i>New SQL Query
                                         </button>
                                     </div>
                                 </div>
                                 <div class="card border-secondary" style="background: rgba(30,30,35,0.8); border-radius: 10px; overflow: hidden;">
                                     <div class="table-responsive" style="max-width: 100%;">
                                         <table class="table table-dark table-hover mb-0" id="dbStructureTable" style="font-size: 0.82rem; width: max-content; min-width: 100%;">
                                             <thead>
                                                 <tr style="background: #27272a; border-bottom: 1px solid #3f3f46;">
                                                     <th class="px-3 py-2" style="color: #a1a1aa; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; font-size: 0.72rem;">Table</th>
                                                     <th class="px-3 py-2" style="color: #a1a1aa; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; font-size: 0.72rem;">Rows</th>
                                                     <th class="px-3 py-2" style="color: #a1a1aa; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; font-size: 0.72rem;">Engine</th>
                                                     <th class="px-3 py-2" style="color: #a1a1aa; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; font-size: 0.72rem;">Collation</th>
                                                     <th class="px-3 py-2" style="color: #a1a1aa; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; font-size: 0.72rem;">Size</th>
                                                     <th class="px-3 py-2" style="color: #a1a1aa; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; font-size: 0.72rem;">Actions</th>
                                                 </tr>
                                             </thead>
                                             <tbody id="dbStructureBody"></tbody>
                                             <tfoot>
                                                 <tr style="background: #27272a; border-top: 1px solid #3f3f46;">
                                                     <td class="px-3 py-2 text-muted" id="dbStructureSumLabel"></td>
                                                     <td class="px-3 py-2 text-light fw-bold" id="dbStructureSumRows"></td>
                                                     <td colspan="3" class="px-3 py-2"></td>
                                                     <td class="px-3 py-2 text-light fw-bold" id="dbStructureSumSize"></td>
                                                 </tr>
                                             </tfoot>
                                         </table>
                                     </div>
                                 </div>
                             </div>
                         </div>

                         <!-- SQL Tab -->
                         <div class="db-tab-pane flex-grow-1 overflow-auto p-3 d-none" id="dbPaneSql">
                             <div class="mb-2 d-flex justify-content-between align-items-center">
                                 <label class="form-label small text-muted text-uppercase fw-semibold mb-0" style="letter-spacing: 0.5px;">SQL Query Runner</label>
                                 <div class="d-flex gap-2">
                                     <button class="btn btn-sm btn-outline-secondary" id="btnClearSql"><i class="bi bi-trash me-1"></i>Clear</button>
                                     <button class="btn btn-sm btn-outline-secondary" id="btnFormatSql"><i class="bi bi-text-left me-1"></i>Format</button>
                                 </div>
                             </div>
                             <div class="d-flex gap-2 mb-3">
                                 <textarea class="form-control bg-dark text-light border-secondary font-monospace flex-grow-1" id="sqlQueryInput" rows="5" style="font-size: 0.84rem; border-radius: 8px; resize: vertical; border-color: rgba(255, 255, 255, 0.12) !important; line-height: 1.5;" placeholder="-- Type your SQL query here&#10;SELECT * FROM `table_name` LIMIT 10;"></textarea>
                             </div>
                             <div class="d-flex gap-2 mb-3">
                                 <button class="btn btn-success px-4 d-flex align-items-center gap-2" id="btnRunSql" style="border-radius: 8px;">
                                     <i class="bi bi-play-fill fs-5"></i> <span>Run Query</span>
                                 </button>
                                 <button class="btn btn-outline-secondary px-3 d-flex align-items-center gap-2" id="btnRunSqlExplain" style="border-radius: 8px;">
                                     <i class="bi bi-lightning me-1"></i>EXPLAIN
                                 </button>
                             </div>
                             <div id="sqlResultArea">
                                 <div class="text-center text-muted py-4">
                                     <i class="bi bi-terminal mb-2 opacity-25" style="font-size: 2.5rem; display:block;"></i>
                                     <span class="opacity-50">Run a query to see the output</span>
                                 </div>
                             </div>
                         </div>

                         <!-- Browse Tab -->
                         <div class="db-tab-pane d-flex flex-column flex-grow-1 overflow-hidden d-none" id="dbPaneBrowse">
                             <div class="text-center text-muted py-5" id="dbBrowsePlaceholder">
                                 <i class="bi bi-table mb-3 opacity-25" style="font-size: 3.5rem; display:block;"></i>
                                 <span class="opacity-50">Click "Browse" on a table from the Structure tab</span>
                             </div>
                             <div id="dbBrowseContent" class="d-none d-flex flex-column flex-grow-1 overflow-hidden">
                                 <!-- Toolbar top -->
                                 <div class="d-flex justify-content-between align-items-center px-3 pt-3 pb-2 flex-wrap gap-2" style="flex-shrink:0;">
                                     <h6 class="mb-0 text-light fw-bold d-flex align-items-center gap-2">
                                         <i class="bi bi-table text-success"></i>
                                         <span id="dbBrowseTableTitle"></span>
                                     </h6>
                                     <div class="d-flex align-items-center gap-2 flex-wrap">
                                         <span class="text-muted small" id="dbBrowsePaginationInfo"></span>
                                         <div class="d-flex gap-1" id="dbBrowsePaginationBtns"></div>
                                         <div class="input-group input-group-sm" style="width:180px;">
                                             <span class="input-group-text bg-dark border-secondary text-muted"><i class="bi bi-search"></i></span>
                                             <input type="text" class="form-control bg-dark text-light border-secondary" id="dbBrowseSearch" placeholder="Filter rows...">
                                         </div>
                                     </div>
                                 </div>
                                 <!-- Selection toolbar (hidden until rows selected) -->
                                 <div id="dbBrowseSelectionBar" class="d-none align-items-center gap-2 px-3 py-2 mx-3 mb-2 rounded-3"
                                      style="background:rgba(59,130,246,0.1); border:1px solid rgba(59,130,246,0.3); flex-shrink:0;">
                                     <i class="bi bi-check2-square text-primary"></i>
                                     <span id="dbBrowseSelectedCount" class="text-primary fw-bold small">0 selected</span>
                                     <div class="ms-auto d-flex gap-2">
                                         <button class="btn btn-sm btn-outline-secondary" id="btnEditSelectedRows" style="border-radius:6px;">
                                             <i class="bi bi-pencil me-1"></i>Edit Row
                                         </button>
                                         <button class="btn btn-sm btn-outline-danger" id="btnDeleteSelectedRows" style="border-radius:6px;">
                                             <i class="bi bi-trash me-1"></i>Delete Selected
                                         </button>
                                         <button class="btn btn-sm btn-outline-secondary" id="btnClearBrowseSelection" style="border-radius:6px;">
                                             <i class="bi bi-x me-1"></i>Clear
                                         </button>
                                     </div>
                                 </div>
                                 <!-- Scrollable table -->
                                 <div class="flex-grow-1 px-3 pb-3" style="min-height:0; overflow:hidden; display:flex; flex-direction:column; max-width: 100%;">
                                     <div class="table-responsive flex-grow-1" style="min-height:0; border-radius:10px; border:1px solid #3f3f46; background: #131316; overflow: auto; max-width: 100%;">
                                         <table class="table table-dark table-hover mb-0" id="dbBrowseTable" style="font-size:0.82rem; width: max-content; min-width: 100%;">
                                             <thead id="dbBrowseThead" style="position:sticky; top:0; z-index:10;"></thead>
                                             <tbody id="dbBrowseTbody"></tbody>
                                         </table>
                                     </div>
                                 </div>
                             </div>
                         </div>


                         <!-- Table Columns Tab -->
                         <div class="db-tab-pane flex-grow-1 overflow-auto p-3 d-none" id="dbPaneColumns">
                             <div class="text-center text-muted py-5" id="dbColumnsPlaceholder">
                                 <i class="bi bi-list-columns-reverse mb-3 opacity-25" style="font-size: 3.5rem; display:block;"></i>
                                 <span class="opacity-50">Click "Structure" on a table to view its columns</span>
                             </div>
                             <div id="dbColumnsContent" class="d-none">
                                  <div class="d-flex justify-content-between align-items-center mb-3">
                                      <h6 class="mb-0 text-light fw-bold">
                                          <i class="bi bi-list-columns-reverse me-2 text-info"></i>
                                          Columns of <span id="dbColumnsTableTitle" class="text-info"></span>
                                      </h6>
                                      <div class="d-flex gap-2">
                                          <button class="btn btn-sm btn-outline-success" id="btnAddColumn">
                                              <i class="bi bi-plus-lg me-1"></i>Add Column
                                          </button>
                                          <button class="btn btn-sm btn-outline-secondary" id="btnBrowseFromColumns">
                                              <i class="bi bi-table me-1"></i>Browse Data
                                          </button>
                                      </div>
                                  </div>
                                  <div class="card border-secondary" style="background: rgba(30,30,35,0.8); border-radius: 10px; overflow: hidden;">
                                      <div class="table-responsive" style="max-width: 100%;">
                                          <table class="table table-dark table-hover mb-0" style="font-size: 0.82rem; width: max-content; min-width: 100%;">
                                              <thead>
                                                  <tr style="background: #27272a; border-bottom: 1px solid #3f3f46;">
                                                      <th class="px-3 py-2 text-center" style="width: 45px;">
                                                          <input type="checkbox" id="dbColSelectAll" style="cursor: pointer;" class="form-check-input">
                                                      </th>
                                                      <th class="px-3 py-2" style="color:#a1a1aa;font-weight:600;letter-spacing:.5px;text-transform:uppercase;font-size:.72rem; width: 50px;">#</th>
                                                      <th class="px-3 py-2" style="color:#a1a1aa;font-weight:600;letter-spacing:.5px;text-transform:uppercase;font-size:.72rem;">Field</th>
                                                      <th class="px-3 py-2" style="color:#a1a1aa;font-weight:600;letter-spacing:.5px;text-transform:uppercase;font-size:.72rem;">Type</th>
                                                      <th class="px-3 py-2" style="color:#a1a1aa;font-weight:600;letter-spacing:.5px;text-transform:uppercase;font-size:.72rem;">Null</th>
                                                      <th class="px-3 py-2" style="color:#a1a1aa;font-weight:600;letter-spacing:.5px;text-transform:uppercase;font-size:.72rem;">Key</th>
                                                      <th class="px-3 py-2" style="color:#a1a1aa;font-weight:600;letter-spacing:.5px;text-transform:uppercase;font-size:.72rem;">Default</th>
                                                      <th class="px-3 py-2" style="color:#a1a1aa;font-weight:600;letter-spacing:.5px;text-transform:uppercase;font-size:.72rem;">Extra</th>
                                                      <th class="px-3 py-2 text-center" style="color:#a1a1aa;font-weight:600;letter-spacing:.5px;text-transform:uppercase;font-size:.72rem; width: 120px;">Actions</th>
                                                  </tr>
                                              </thead>
                                              <tbody id="dbColumnsTbody"></tbody>
                                          </table>
                                      </div>
                                  </div>
                                  <div id="dbColumnsMultiActions" class="mt-3 d-none">
                                      <button class="btn btn-sm btn-danger px-3" id="btnDropSelectedColumns">
                                          <i class="bi bi-trash3 me-1"></i>Drop Selected Columns
                                      </button>
                                  </div>
                              </div>
                         </div>
                     </div>

                     <!-- Edit Row Modal -->
                     <div class="modal fade" id="dbEditRowModal" tabindex="-1" aria-hidden="true">
                         <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
                             <div class="modal-content border-secondary text-light shadow-lg" style="background:#1a1a1e; border-radius:14px; overflow:hidden;">
                                 <div class="modal-header border-secondary px-4 py-3" style="background:#18181b;">
                                     <div class="d-flex align-items-center gap-3">
                                         <div style="width:36px;height:36px;background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.3);border-radius:8px;display:flex;align-items:center;justify-content:center;">
                                             <i class="bi bi-pencil-square text-warning"></i>
                                         </div>
                                         <div>
                                             <h5 class="modal-title fw-bold mb-0" id="dbEditRowTitle">Edit Row</h5>
                                             <small class="text-muted" id="dbEditRowSubtitle"></small>
                                         </div>
                                     </div>
                                     <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                                 </div>
                                 <div class="modal-body px-4 py-3" id="dbEditRowBody">
                                     <!-- Fields rendered dynamically by JS -->
                                 </div>
                                 <div class="modal-footer border-secondary px-4 py-3 gap-2" style="background:#18181b;">
                                     <span class="text-muted small me-auto" id="dbEditRowPkInfo"></span>
                                     <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                     <button type="button" class="btn btn-warning px-4" id="btnDbSaveRow">
                                         <i class="bi bi-check-lg me-1"></i>Save Changes
                                     </button>
                                 </div>
                             </div>
                         </div>
                     </div>

                      <!-- Edit/Add Column Modal -->
                      <div class="modal fade" id="dbColumnModal" tabindex="-1" aria-hidden="true">
                          <div class="modal-dialog modal-dialog-centered modal-md">
                              <div class="modal-content border-secondary text-light shadow-lg" style="background:#1a1a1e; border-radius:14px; overflow:hidden;">
                                  <div class="modal-header border-secondary px-4 py-3" style="background:#18181b;">
                                      <div class="d-flex align-items-center gap-3">
                                          <div style="width:36px;height:36px;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);border-radius:8px;display:flex;align-items:center;justify-content:center;">
                                              <i class="bi bi-list-columns-reverse text-success"></i>
                                          </div>
                                          <div>
                                              <h5 class="modal-title fw-bold mb-0" id="dbColumnModalTitle">Add Column</h5>
                                              <small class="text-muted" id="dbColumnModalSubtitle"></small>
                                          </div>
                                      </div>
                                      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                                  </div>
                                  <div class="modal-body px-4 py-3">
                                      <form id="dbColumnForm">
                                          <input type="hidden" id="dbColOriginalName">
                                          <div class="mb-3">
                                              <label class="form-label text-muted small fw-bold text-uppercase">Column Name</label>
                                              <input type="text" class="form-control bg-darker border-secondary text-light shadow-none" id="dbColName" required placeholder="e.g. email">
                                          </div>
                                          <div class="row">
                                              <div class="col-md-6 mb-3">
                                                  <label class="form-label text-muted small fw-bold text-uppercase">Type</label>
                                                  <select class="form-select bg-darker border-secondary text-light shadow-none" id="dbColType" required>
                                                      <option value="INT">INT</option>
                                                      <option value="VARCHAR">VARCHAR</option>
                                                      <option value="TEXT">TEXT</option>
                                                      <option value="DATE">DATE</option>
                                                      <option value="DATETIME">DATETIME</option>
                                                      <option value="TIMESTAMP">TIMESTAMP</option>
                                                      <option value="TINYINT">TINYINT</option>
                                                      <option value="BIGINT">BIGINT</option>
                                                      <option value="DECIMAL">DECIMAL</option>
                                                      <option value="FLOAT">FLOAT</option>
                                                      <option value="DOUBLE">DOUBLE</option>
                                                      <option value="CHAR">CHAR</option>
                                                      <option value="BLOB">BLOB</option>
                                                  </select>
                                              </div>
                                              <div class="col-md-6 mb-3">
                                                  <label class="form-label text-muted small fw-bold text-uppercase">Length/Values</label>
                                                  <input type="text" class="form-control bg-darker border-secondary text-light shadow-none" id="dbColLength" placeholder="e.g. 255">
                                              </div>
                                          </div>
                                          <div class="row">
                                              <div class="col-md-6 mb-3">
                                                  <label class="form-label text-muted small fw-bold text-uppercase">Default</label>
                                                  <select class="form-select bg-darker border-secondary text-light shadow-none" id="dbColDefaultType">
                                                      <option value="NONE">None</option>
                                                      <option value="NULL">NULL</option>
                                                      <option value="CURRENT_TIMESTAMP">CURRENT_TIMESTAMP</option>
                                                      <option value="USER_DEFINED">As defined...</option>
                                                  </select>
                                              </div>
                                              <div class="col-md-6 mb-3 d-none" id="dbColDefaultValueWrapper">
                                                  <label class="form-label text-muted small fw-bold text-uppercase">Default Value</label>
                                                  <input type="text" class="form-control bg-darker border-secondary text-light shadow-none" id="dbColDefaultValue">
                                              </div>
                                          </div>
                                          <div class="row align-items-center mt-2">
                                              <div class="col-6 mb-3">
                                                  <div class="form-check form-switch">
                                                      <input class="form-check-input style-none" type="checkbox" id="dbColNull" checked>
                                                      <label class="form-check-label text-light small" for="dbColNull">Allow NULL</label>
                                                  </div>
                                              </div>
                                              <div class="col-6 mb-3">
                                                  <div class="form-check form-switch">
                                                      <input class="form-check-input style-none" type="checkbox" id="dbColAi">
                                                      <label class="form-check-label text-light small" for="dbColAi">Auto Increment</label>
                                                  </div>
                                              </div>
                                          </div>
                                          <div class="mb-1">
                                              <label class="form-label text-muted small fw-bold text-uppercase">Index</label>
                                              <select class="form-select bg-darker border-secondary text-light shadow-none" id="dbColIndex">
                                                  <option value="NONE">None</option>
                                                  <option value="PRIMARY">PRIMARY</option>
                                                  <option value="UNIQUE">UNIQUE</option>
                                                  <option value="INDEX">INDEX</option>
                                              </select>
                                          </div>
                                      </form>
                                  </div>
                                  <div class="modal-footer border-secondary px-4 py-3 gap-2" style="background:#18181b;">
                                      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                      <button type="button" class="btn btn-success px-4" id="btnDbSaveColumn">
                                          <i class="bi bi-check-lg me-1"></i>Save Column
                                      </button>
                                  </div>
                              </div>
                          </div>
                      </div>

                     <!-- DB Confirm Action Modal -->
                     <div class="modal fade" id="dbConfirmModal" tabindex="-1" aria-hidden="true">
                         <div class="modal-dialog modal-dialog-centered">
                             <div class="modal-content border-secondary" style="background: #1e1e24;">
                                 <div class="modal-header border-secondary">
                                     <h5 class="modal-title" id="dbConfirmTitle">Confirm Action</h5>
                                     <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                                 </div>
                                 <div class="modal-body" id="dbConfirmBody"></div>
                                 <div class="modal-footer border-secondary">
                                     <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                     <button type="button" class="btn btn-danger" id="dbConfirmOk">Confirm</button>
                                 </div>
                             </div>
                         </div>
                     </div>

                    <div class="terminal-container flex-grow-1 flex-column p-3 bg-darker d-none" id="terminal-container">
                        <div class="flex-grow-1 border border-secondary rounded-3 overflow-hidden p-2 mb-2" id="sshTerminal" style="background: #121214;"></div>
                        <div class="d-flex gap-2" id="sshInputRow" style="flex-shrink: 0;">
                            <div class="input-group">
                                <span class="input-group-text bg-dark border-secondary text-success font-monospace" style="font-size: 0.85rem; border-color: rgba(255,255,255,0.15) !important;">$</span>
                                <input type="text" id="sshConsoleInput" class="form-control bg-dark border-secondary text-light font-monospace shadow-none" placeholder="Type a command and press Enter..." style="font-size: 0.85rem; border-color: rgba(255,255,255,0.15) !important;" autocomplete="off">
                                <button class="btn btn-success" id="btnSshSendCmd" type="button">
                                    <i class="bi bi-send me-1"></i>Run
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div id="editorPlaceholder" class="position-absolute top-0 start-0 w-100 h-100 bg-darker d-flex flex-column justify-content-center align-items-center text-muted" style="z-index: 10;">
                        <i class="bi bi-file-earmark-code mb-3 opacity-25" style="font-size: 4rem;"></i>
                        <span class="opacity-50">Select a file to start editing</span>
                    </div>
                </div>
            </div>

            <div class="flex-grow-1 d-flex justify-content-center align-items-center flex-column bg-darker" id="welcomeArea">
                <i class="bi bi-broadcast text-secondary mb-4 opacity-25" style="font-size: 5rem;"></i>
                <h4 class="text-secondary opacity-50 fw-normal">Select a session to connect</h4>
                <button class="btn btn-primary mt-4 px-4 py-2 rounded-pill shadow" data-bs-toggle="modal" data-bs-target="#addSessionModal">
                    <i class="bi bi-plus-lg me-2"></i> Add New Connection
                </button>
            </div>
        </div>
    </div>

    <div class="modal fade" id="addSessionModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content bg-dark text-light border-secondary shadow-lg" style="border-radius: 12px; overflow: hidden;">
                <div class="modal-header border-secondary bg-darker p-4 pb-3">
                    <div>
                        <h5 class="modal-title fw-bold mb-1">New Connection</h5>
                        <p class="text-muted small mb-0">Select protocol and set credentials.</p>
                    </div>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4">
                    <form id="addSessionForm">
                        <div class="mb-3">
                            <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide">Protocol</label>
                            <select class="form-select bg-darker text-light border-secondary" id="sessionProtocol" name="protocol" style="border-radius: 8px;">
                                <option value="ftp">FTP Connection</option>
                                <option value="mysql">MySQL Client (phpMyAdmin style)</option>
                                <option value="ssh">Web SSH Client</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide">Session Name</label>
                            <div class="input-group">
                                <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-tag"></i></span>
                                <input type="text" class="form-control bg-darker text-light border-secondary" name="name" placeholder="Session Name (optional, e.g. My Server)">
                            </div>
                        </div>
                        
                        <div id="ftpFormFields" class="protocol-group">
                            <div class="mb-4">
                                <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide">FTP Server Details</label>
                                <div class="input-group mb-2">
                                    <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-globe"></i></span>
                                    <input type="text" class="form-control bg-darker text-light border-secondary" name="host" placeholder="Host (e.g. ftp.example.com)">
                                </div>
                                <div class="input-group">
                                    <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-door-open"></i></span>
                                    <input type="number" class="form-control bg-darker text-light border-secondary" name="port" value="21" placeholder="Port">
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide">FTP Authentication</label>
                                <div class="input-group mb-2">
                                    <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-person"></i></span>
                                    <input type="text" class="form-control bg-darker text-light border-secondary" name="user" placeholder="Username">
                                </div>
                                <div class="input-group">
                                    <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-key"></i></span>
                                    <input type="password" class="form-control bg-darker text-light border-secondary" name="password" placeholder="Password">
                                </div>
                            </div>
                        </div>

                        <div id="mysqlFormFields" class="protocol-group d-none">
                            <div class="mb-4">
                                <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide">MySQL Server Details</label>
                                <div class="input-group mb-2">
                                    <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-globe"></i></span>
                                    <input type="text" class="form-control bg-darker text-light border-secondary" name="mysql_host" placeholder="Host (e.g. 127.0.0.1)">
                                </div>
                                <div class="input-group mb-2">
                                    <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-door-open"></i></span>
                                    <input type="number" class="form-control bg-darker text-light border-secondary" name="mysql_port" value="3306" placeholder="Port">
                                </div>
                                <div class="input-group">
                                    <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-database"></i></span>
                                    <input type="text" class="form-control bg-darker text-light border-secondary" name="mysql_db" placeholder="Database Name (optional)">
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide">MySQL Authentication</label>
                                <div class="input-group mb-2">
                                    <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-person"></i></span>
                                    <input type="text" class="form-control bg-darker text-light border-secondary" name="mysql_user" placeholder="Username">
                                </div>
                                <div class="input-group">
                                    <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-key"></i></span>
                                    <input type="password" class="form-control bg-darker text-light border-secondary" name="mysql_password" placeholder="Password">
                                </div>
                            </div>
                        </div>

                        <div id="sshFormFields" class="protocol-group d-none">
                            <div class="mb-4">
                                <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide">SSH Server Details</label>
                                <div class="input-group mb-2">
                                    <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-globe"></i></span>
                                    <input type="text" class="form-control bg-darker text-light border-secondary" name="ssh_host" placeholder="Host (e.g. ssh.example.com)">
                                </div>
                                <div class="input-group">
                                    <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-door-open"></i></span>
                                    <input type="number" class="form-control bg-darker text-light border-secondary" name="ssh_port" value="22" placeholder="Port">
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide">SSH Authentication</label>
                                <div class="input-group mb-2">
                                    <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-person"></i></span>
                                    <input type="text" class="form-control bg-darker text-light border-secondary" name="ssh_user" placeholder="Username">
                                </div>
                                <div class="input-group">
                                    <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-key"></i></span>
                                    <input type="password" class="form-control bg-darker text-light border-secondary" name="ssh_password" placeholder="Password">
                                </div>
                            </div>
                        </div>

                        <?php
                        foreach ($activePlugins as $plugin) {
                            $modalUi = __DIR__ . "/plugins/{$plugin}/ui_connection_modal.php";
                            if (file_exists($modalUi)) {
                                include $modalUi;
                            }
                        }
                        ?>
                    </form>
                </div>
                <div class="modal-footer border-secondary bg-darker p-3">
                    <button type="button" class="btn btn-dark border-secondary px-4" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary px-4" id="btnSaveSession">Save Connection</button>
                </div>
            </div>
        </div>
    </div>
    
    <div class="modal fade" id="inputModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content bg-dark text-light border-secondary shadow-lg">
                <div class="modal-header border-secondary">
                    <h6 class="modal-title fw-semibold" id="inputModalTitle">Input</h6>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <input type="text" class="form-control bg-darker text-light border-secondary" id="inputModalValue">
                </div>
                <div class="modal-footer border-secondary p-2">
                    <button type="button" class="btn btn-sm btn-primary w-100" id="btnInputModalConfirm">Confirm</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Edit Session Modal -->
    <div class="modal fade" id="editSessionModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content bg-dark text-light border-secondary shadow-lg" style="border-radius: 12px; overflow: hidden;">
                <div class="modal-header border-secondary bg-darker p-4 pb-3">
                    <div>
                        <h5 class="modal-title fw-bold mb-1"><i class="bi bi-pencil-square text-warning me-2"></i>Edit Connection</h5>
                        <p class="text-muted small mb-0">Modify credentials for this session.</p>
                    </div>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4">
                    <input type="hidden" id="editSessionId">
                    <input type="hidden" id="editSessionProtocol">

                    <div class="mb-3">
                        <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide">Session Name</label>
                        <div class="input-group">
                            <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-tag"></i></span>
                            <input type="text" class="form-control bg-darker text-light border-secondary" id="editSessionName" placeholder="Session Name (optional)">
                        </div>
                    </div>

                    <!-- FTP fields -->
                    <div id="editFtpFields" class="edit-protocol-group">
                        <div class="mb-4">
                            <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide">FTP Server Details</label>
                            <div class="input-group mb-2">
                                <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-globe"></i></span>
                                <input type="text" class="form-control bg-darker text-light border-secondary" id="editFtpHost" placeholder="Host (e.g. ftp.example.com)">
                            </div>
                            <div class="input-group">
                                <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-door-open"></i></span>
                                <input type="number" class="form-control bg-darker text-light border-secondary" id="editFtpPort" value="21" placeholder="Port">
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide">FTP Authentication</label>
                            <div class="input-group mb-2">
                                <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-person"></i></span>
                                <input type="text" class="form-control bg-darker text-light border-secondary" id="editFtpUser" placeholder="Username">
                            </div>
                            <div class="input-group">
                                <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-key"></i></span>
                                <input type="password" class="form-control bg-darker text-light border-secondary" id="editFtpPassword" placeholder="Leave blank to keep current">
                                <button class="btn btn-outline-secondary edit-pw-toggle" type="button" data-target="editFtpPassword"><i class="bi bi-eye"></i></button>
                            </div>
                            <small class="text-muted">Leave blank to keep the existing password.</small>
                        </div>
                    </div>

                    <!-- MySQL fields -->
                    <div id="editMysqlFields" class="edit-protocol-group d-none">
                        <div class="mb-4">
                            <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide">MySQL Server Details</label>
                            <div class="input-group mb-2">
                                <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-globe"></i></span>
                                <input type="text" class="form-control bg-darker text-light border-secondary" id="editMysqlHost" placeholder="Host (e.g. 127.0.0.1)">
                            </div>
                            <div class="input-group mb-2">
                                <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-door-open"></i></span>
                                <input type="number" class="form-control bg-darker text-light border-secondary" id="editMysqlPort" value="3306" placeholder="Port">
                            </div>
                            <div class="input-group">
                                <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-database"></i></span>
                                <input type="text" class="form-control bg-darker text-light border-secondary" id="editMysqlDb" placeholder="Database Name (optional)">
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide">MySQL Authentication</label>
                            <div class="input-group mb-2">
                                <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-person"></i></span>
                                <input type="text" class="form-control bg-darker text-light border-secondary" id="editMysqlUser" placeholder="Username">
                            </div>
                            <div class="input-group">
                                <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-key"></i></span>
                                <input type="password" class="form-control bg-darker text-light border-secondary" id="editMysqlPassword" placeholder="Leave blank to keep current">
                                <button class="btn btn-outline-secondary edit-pw-toggle" type="button" data-target="editMysqlPassword"><i class="bi bi-eye"></i></button>
                            </div>
                            <small class="text-muted">Leave blank to keep the existing password.</small>
                        </div>
                    </div>

                    <!-- SSH fields -->
                    <div id="editSshFields" class="edit-protocol-group d-none">
                        <div class="mb-4">
                            <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide">SSH Server Details</label>
                            <div class="input-group mb-2">
                                <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-globe"></i></span>
                                <input type="text" class="form-control bg-darker text-light border-secondary" id="editSshHost" placeholder="Host (e.g. ssh.example.com)">
                            </div>
                            <div class="input-group">
                                <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-door-open"></i></span>
                                <input type="number" class="form-control bg-darker text-light border-secondary" id="editSshPort" value="22" placeholder="Port">
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide">SSH Authentication</label>
                            <div class="input-group mb-2">
                                <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-person"></i></span>
                                <input type="text" class="form-control bg-darker text-light border-secondary" id="editSshUser" placeholder="Username">
                            </div>
                            <div class="input-group">
                                <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-key"></i></span>
                                <input type="password" class="form-control bg-darker text-light border-secondary" id="editSshPassword" placeholder="Leave blank to keep current">
                                <button class="btn btn-outline-secondary edit-pw-toggle" type="button" data-target="editSshPassword"><i class="bi bi-eye"></i></button>
                            </div>
                            <small class="text-muted">Leave blank to keep the existing password.</small>
                        </div>
                    </div>

                    <!-- Proxy plugin fields (shown for all protocols if plugin active) -->
                    <?php if (in_array('proxy', $activePlugins)): ?>
                    <div id="editProxyWrapper" class="mb-3 border border-secondary rounded p-3 bg-darker">
                        <div class="form-check form-switch mb-0">
                            <input class="form-check-input" type="checkbox" role="switch" id="editUseProxy">
                            <label class="form-check-label small text-muted text-uppercase fw-semibold tracking-wide" for="editUseProxy">Use Proxy Connection</label>
                        </div>
                        <div id="editProxyFields" class="mt-3 d-none">
                            <div class="mb-2">
                                <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide">Proxy Type</label>
                                <select class="form-select bg-dark text-light border-secondary" id="editProxyType">
                                    <option value="http">HTTP</option>
                                    <option value="socks4">SOCKS4</option>
                                    <option value="socks5" selected>SOCKS5</option>
                                </select>
                            </div>
                            <div class="row g-2 mb-2">
                                <div class="col-8">
                                    <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide">Proxy Host</label>
                                    <input type="text" class="form-control bg-dark text-light border-secondary" id="editProxyHost" placeholder="e.g. 127.0.0.1">
                                </div>
                                <div class="col-4">
                                    <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide">Port</label>
                                    <input type="number" class="form-control bg-dark text-light border-secondary" id="editProxyPort" placeholder="1080">
                                </div>
                            </div>
                            <div class="row g-2">
                                <div class="col-6">
                                    <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide">Proxy User</label>
                                    <input type="text" class="form-control bg-dark text-light border-secondary" id="editProxyUser" placeholder="Username (optional)">
                                </div>
                                <div class="col-6">
                                    <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide">Proxy Pass</label>
                                    <input type="password" class="form-control bg-dark text-light border-secondary" id="editProxyPassword" placeholder="Password (optional)">
                                </div>
                            </div>
                        </div>
                    </div>
                    <?php endif; ?>
                </div>
                <div class="modal-footer border-secondary bg-darker p-3">
                    <button type="button" class="btn btn-dark border-secondary px-4" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-warning px-4" id="btnSaveEditSession">
                        <i class="bi bi-check-lg me-1"></i>Save Changes
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="confirmModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content bg-dark text-light border-secondary shadow-lg" style="border-radius: 12px; overflow: hidden;">
                <div class="modal-header border-secondary bg-darker p-3 pb-2">
                    <h6 class="modal-title fw-bold" id="confirmModalTitle">Confirm Action</h6>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-3">
                    <p class="mb-0 text-muted small" id="confirmModalMessage">Are you sure you want to proceed?</p>
                </div>
                <div class="modal-footer border-secondary bg-darker p-2 d-flex gap-2">
                    <button type="button" class="btn btn-sm btn-dark border-secondary flex-grow-1" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-sm btn-danger flex-grow-1" id="btnConfirmModalExecute">Delete</button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="aboutDevModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-secondary shadow-lg" style="background-color: #1c1c1f; border-radius: 14px; overflow: hidden;">
                <div class="modal-header border-secondary" style="background-color: #18181b; padding: 24px 28px 20px;">
                    <div class="d-flex align-items-center gap-3">
                        <div style="width:44px; height:44px; background: linear-gradient(135deg, #3f3f46, #52525b); border-radius: 10px; display:flex; align-items:center; justify-content:center;">
                            <i class="bi bi-code-square text-white" style="font-size:1.25rem;"></i>
                        </div>
                        <div>
                            <h5 class="modal-title fw-bold mb-0 text-white">About Developer</h5>
                            <p class="text-muted small mb-0">Fast Tunnel</p>
                        </div>
                    </div>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body" style="padding: 28px;">
                    <div class="mb-4 text-center">
                        <div style="width:72px; height:72px; background: linear-gradient(135deg, #27272a, #3f3f46); border-radius: 50%; display:flex; align-items:center; justify-content:center; margin: 0 auto 16px;">
                            <i class="bi bi-person text-white" style="font-size:2rem;"></i>
                        </div>
                        <h4 class="fw-bold text-white mb-1">Arizu Studio</h4>
                        <p class="text-muted small mb-0">Independent software development studio</p>
                    </div>
                    <div class="d-flex flex-column gap-3">
                        <a href="https://arizu.id" target="_blank" class="d-flex align-items-center gap-3 p-3 rounded-3 text-decoration-none" style="background: #27272a; border: 1px solid #3f3f46;">
                            <i class="bi bi-globe2 text-muted"></i>
                            <div>
                                <div class="text-white small fw-medium">Website</div>
                                <div class="text-muted" style="font-size:0.8rem;">arizu.id</div>
                            </div>
                            <i class="bi bi-arrow-up-right ms-auto text-muted" style="font-size:0.75rem;"></i>
                        </a>
                        <a href="mailto:ariefzufar@arizu.id" class="d-flex align-items-center gap-3 p-3 rounded-3 text-decoration-none" style="background: #27272a; border: 1px solid #3f3f46;">
                            <i class="bi bi-envelope text-muted"></i>
                            <div>
                                <div class="text-white small fw-medium">Contact</div>
                                <div class="text-muted" style="font-size:0.8rem;">ariefzufar@arizu.id</div>
                            </div>
                            <i class="bi bi-arrow-up-right ms-auto text-muted" style="font-size:0.75rem;"></i>
                        </a>
                    </div>
                </div>
                <div class="modal-footer border-secondary" style="background-color: #18181b; padding: 14px 28px;">
                    <span class="text-muted small">Built with &hearts; by Arizu Studio</span>
                    <button type="button" class="btn btn-sm ms-auto" style="background:#27272a; color:#d4d4d8; border:1px solid #3f3f46;" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="privacyPolicyModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div class="modal-content border-secondary shadow-lg" style="background-color: #1c1c1f; border-radius: 14px; overflow: hidden;">
                <div class="modal-header border-secondary" style="background-color: #18181b; padding: 20px 28px;">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-shield-check text-muted"></i>
                        <h5 class="modal-title fw-bold mb-0 text-white">Privacy Policy</h5>
                    </div>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body" style="padding: 28px; color: #a1a1aa; line-height: 1.7; font-size: 0.9rem;">
                    <p class="text-muted small">Last updated: May 2025 &mdash; Arizu Studio</p>

                    <h6 class="text-white fw-semibold mt-4 mb-2">1. Information We Collect</h6>
                    <p>This application (Fast Tunnel) operates entirely on your own server environment. We do not collect, store, or transmit any personal data, session credentials, or file/database contents to any external server or third party.</p>
                    <p>All connection credentials entered in this application are stored locally on your server's session or storage mechanism and are never shared with Arizu Studio or any external party.</p>

                    <h6 class="text-white fw-semibold mt-4 mb-2">2. Data Storage</h6>
                    <p>Session credentials (hostname, port, username, password) are stored locally on your server. You are solely responsible for the security of your server environment and the data stored within it.</p>

                    <h6 class="text-white fw-semibold mt-4 mb-2">3. Third-Party Services</h6>
                    <p>This application loads resources from the following CDNs for functionality: Bootstrap, jQuery, Monaco Editor, and Bootstrap Icons. These services may collect standard browser request data (e.g., IP address) according to their own privacy policies.</p>

                    <h6 class="text-white fw-semibold mt-4 mb-2">4. No Analytics or Tracking</h6>
                    <p>This application does not include any analytics, tracking pixels, cookies, or telemetry of any kind. Your usage remains entirely private.</p>

                    <h6 class="text-white fw-semibold mt-4 mb-2">5. Contact</h6>
                    <p>For privacy-related inquiries, please contact us at <a href="mailto:ariefzufar@arizu.id" class="text-light">ariefzufar@arizu.id</a>.</p>
                </div>
                <div class="modal-footer border-secondary" style="background-color: #18181b; padding: 14px 28px;">
                    <span class="text-muted small">&copy; 2025 Arizu Studio &mdash; arizu.id</span>
                    <button type="button" class="btn btn-sm ms-auto" style="background:#27272a; color:#d4d4d8; border:1px solid #3f3f46;" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="termsModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div class="modal-content border-secondary shadow-lg" style="background-color: #1c1c1f; border-radius: 14px; overflow: hidden;">
                <div class="modal-header border-secondary" style="background-color: #18181b; padding: 20px 28px;">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-file-text text-muted"></i>
                        <h5 class="modal-title fw-bold mb-0 text-white">Terms &amp; Conditions</h5>
                    </div>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body" style="padding: 28px; color: #a1a1aa; line-height: 1.7; font-size: 0.9rem;">
                    <p class="text-muted small">Last updated: May 2025 &mdash; Arizu Studio</p>

                    <h6 class="text-white fw-semibold mt-4 mb-2">1. Acceptance of Terms</h6>
                    <p>By using Fast Tunnel (the "Application"), you agree to be bound by these Terms &amp; Conditions. If you do not agree, please discontinue use of the Application immediately.</p>

                    <h6 class="text-white fw-semibold mt-4 mb-2">2. License &amp; Permitted Use</h6>
                    <p>This Application is provided for personal and internal business use only. You may not resell, redistribute, or sublicense this Application or its source code without explicit written permission from Arizu Studio.</p>

                    <h6 class="text-white fw-semibold mt-4 mb-2">3. Responsibility &amp; Liability</h6>
                    <p>You are solely responsible for all files, data, and operations performed through this Application. Arizu Studio is not liable for any data loss, unauthorized access, or damage resulting from your use or misuse of the Application.</p>
                    <p>You are responsible for securing your server environment, keeping your credentials confidential, and maintaining proper access controls.</p>

                    <h6 class="text-white fw-semibold mt-4 mb-2">4. No Warranty</h6>
                    <p>This Application is provided "as is" without warranty of any kind, express or implied. Arizu Studio does not guarantee uninterrupted, error-free operation of the Application.</p>

                    <h6 class="text-white fw-semibold mt-4 mb-2">5. Modifications</h6>
                    <p>Arizu Studio reserves the right to modify these Terms &amp; Conditions at any time. Continued use of the Application after such changes constitutes acceptance of the new terms.</p>

                    <h6 class="text-white fw-semibold mt-4 mb-2">6. Contact</h6>
                    <p>For questions about these Terms, contact us at <a href="mailto:ariefzufar@arizu.id" class="text-light">ariefzufar@arizu.id</a>.</p>
                </div>
                <div class="modal-footer border-secondary" style="background-color: #18181b; padding: 14px 28px;">
                    <span class="text-muted small">&copy; 2025 Arizu Studio &mdash; arizu.id</span>
                    <button type="button" class="btn btn-sm ms-auto" style="background:#27272a; color:#d4d4d8; border:1px solid #3f3f46;" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="exportPasswordModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content border-secondary shadow-lg" style="background-color: #1c1c1f; border-radius: 12px; overflow: hidden;">
                <div class="modal-header border-secondary" style="background-color: #18181b; padding: 18px 22px 14px;">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-shield-lock text-muted"></i>
                        <h6 class="modal-title fw-bold mb-0 text-white">Export — Set Password</h6>
                    </div>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body" style="padding: 20px 22px;">
                    <p class="text-muted small mb-3">Enter a password to encrypt your session credentials before exporting.</p>
                    <div class="input-group">
                        <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-key"></i></span>
                        <input type="password" class="form-control bg-darker text-light border-secondary" id="exportPasswordInput" placeholder="Encryption password">
                        <button class="btn btn-outline-secondary border-secondary" type="button" id="btnToggleExportPassword" tabindex="-1">
                            <i class="bi bi-eye"></i>
                        </button>
                    </div>
                </div>
                <div class="modal-footer border-secondary p-2 d-flex gap-2" style="background-color: #18181b;">
                    <button type="button" class="btn btn-sm flex-grow-1" style="background:#27272a; color:#d4d4d8; border:1px solid #3f3f46;" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-sm flex-grow-1 btn-editor-save" id="btnConfirmExport">
                        <i class="bi bi-box-arrow-up me-1"></i> Export
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="importPasswordModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content border-secondary shadow-lg" style="background-color: #1c1c1f; border-radius: 12px; overflow: hidden;">
                <div class="modal-header border-secondary" style="background-color: #18181b; padding: 18px 22px 14px;">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-shield-lock text-muted"></i>
                        <h6 class="modal-title fw-bold mb-0 text-white">Import — Enter Password</h6>
                    </div>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body" style="padding: 20px 22px;">
                    <p class="text-muted small mb-3">Enter the password used when this file was exported to decrypt the credentials.</p>
                    <div class="input-group">
                        <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-key"></i></span>
                        <input type="password" class="form-control bg-darker text-light border-secondary" id="importPasswordInput" placeholder="Decryption password">
                        <button class="btn btn-outline-secondary border-secondary" type="button" id="btnToggleImportPassword" tabindex="-1">
                            <i class="bi bi-eye"></i>
                        </button>
                    </div>
                </div>
                <div class="modal-footer border-secondary p-2 d-flex gap-2" style="background-color: #18181b;">
                    <button type="button" class="btn btn-sm flex-grow-1" style="background:#27272a; color:#d4d4d8; border:1px solid #3f3f46;" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-sm flex-grow-1 btn-editor-save" id="btnConfirmImport">
                        <i class="bi bi-box-arrow-in-down me-1"></i> Import
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Plugins and App Info Modal -->
    <div class="modal fade" id="pluginsModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content bg-dark text-light border-secondary shadow-lg" style="border-radius: 12px; overflow: hidden;">
                <div class="modal-header border-secondary bg-darker p-4 pb-3">
                    <div>
                        <h5 class="modal-title fw-bold mb-1"><i class="bi bi-puzzle text-primary me-2"></i>Plugins &amp; App Info</h5>
                        <p class="text-muted small mb-0">Manage Fast Tunnel system plugins and view application details.</p>
                    </div>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4" style="max-height: 70vh; overflow-y: auto;">
                    <!-- App Info Section -->
                    <div class="p-3 mb-4 rounded-3 border border-secondary" style="background: linear-gradient(135deg, rgba(39, 39, 42, 0.6) 0%, rgba(24, 24, 27, 0.8) 100%);">
                        <div class="d-flex align-items-center gap-3">
                            <div class="rounded-3 bg-primary bg-opacity-10 p-3 text-primary d-flex align-items-center justify-content-center" style="width: 54px; height: 54px;">
                                <i class="bi bi-broadcast fs-3"></i>
                            </div>
                            <div class="flex-grow-1">
                                <div class="d-flex align-items-center gap-2">
                                    <h5 class="fw-bold mb-0 text-white" id="appNameText">Fast Tunnel</h5>
                                    <span class="badge bg-secondary" id="appVersionText">v1.0.0</span>
                                </div>
                                <p class="text-muted small mb-1" id="appDescText">Multi-protocol web client for FTP, MySQL, and SSH connections.</p>
                                <div class="small text-muted d-flex gap-3">
                                    <span><i class="bi bi-person me-1"></i><span id="appAuthorText">Arizu Studio</span></span>
                                    <span><i class="bi bi-globe me-1"></i><a href="https://arizu.id" target="_blank" class="text-decoration-none text-info" id="appWebText">arizu.id</a></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Installed Plugins Section Header -->
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h6 class="text-muted text-uppercase fw-semibold tracking-wide small mb-0"><i class="bi bi-plugin me-2"></i>Installed Plugins</h6>
                        <div>
                            <button class="btn btn-sm btn-primary d-flex align-items-center gap-2" id="btnTriggerUploadPlugin" style="border-radius: 8px;">
                                <i class="bi bi-upload"></i> Import Plugin
                            </button>
                            <input type="file" id="pluginZipInput" accept=".zip" class="d-none">
                        </div>
                    </div>

                    <!-- Plugins List -->
                    <div class="list-group gap-2" id="pluginsList">
                        <!-- Populated by JavaScript -->
                        <div class="text-center p-4 text-muted">
                            <div class="spinner-border spinner-border-sm me-2 text-primary" role="status"></div>
                            <span>Loading plugins...</span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer border-secondary p-2 d-flex gap-2" style="background-color: #18181b;">
                    <button type="button" class="btn btn-sm flex-grow-1 btn-secondary" style="background:#27272a; color:#d4d4d8; border:1px solid #3f3f46; border-radius: 8px;" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    </div>

    <div class="sidebar-backdrop d-none" id="sidebarBackdrop"></div>
    <div class="toast-container position-fixed bottom-0 end-0 p-3"></div>

    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-contextmenu/2.9.2/jquery.contextMenu.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-contextmenu/2.9.2/jquery.ui.position.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js"></script>
    <script type="module" src="assets/js/app.js"></script>
    <?php
    foreach ($activePlugins as $plugin) {
        if (file_exists(__DIR__ . "/plugins/{$plugin}/plugin.js")) {
            echo '<script type="module" src="plugins/' . $plugin . '/plugin.js"></script>';
        }
    }
    ?>
</body>
</html>
