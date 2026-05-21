<div class="d-flex flex-grow-1 overflow-hidden d-none" id="workspaceArea">
    <div class="file-explorer border-end border-secondary d-flex flex-column" id="ftpSidebar" style="width: 260px;">
        <div class="p-2 border-bottom border-secondary d-flex justify-content-between align-items-center bg-dark panel-header">
            <span class="small text-muted text-uppercase fw-semibold ms-2" style="letter-spacing: 0.5px;" data-i18n="workspace">Workspace</span>
            <div class="btn-group gap-1">
                <button class="btn btn-sm btn-icon" id="btnAddFile" title="New File" data-i18n-title="new_file"><i class="bi bi-file-earmark-plus"></i></button>
                <button class="btn btn-sm btn-icon" id="btnAddFolder" title="New Folder" data-i18n-title="new_folder"><i class="bi bi-folder-plus"></i></button>
                <button class="btn btn-sm btn-icon" id="btnUploadFile" title="Upload File" data-i18n-title="upload_file"><i class="bi bi-upload"></i></button>
                <button class="btn btn-sm btn-icon" id="btnRefresh" title="Refresh" data-i18n-title="refresh"><i class="bi bi-arrow-clockwise"></i></button>
            </div>
        </div>
        <div class="p-1 px-3 small text-truncate text-muted border-bottom border-secondary bg-dark font-monospace" id="currentPath" title="/">/</div>
        <div class="flex-grow-1 overflow-auto file-list py-2" id="fileList">
        </div>
    </div>

    <div class="db-sidebar border-end border-secondary d-none flex-column" id="dbSidebar" style="width: 260px; background-color: #18181b;">
        <div class="p-2 border-bottom border-secondary d-flex justify-content-between align-items-center bg-dark panel-header">
            <span class="small text-muted text-uppercase fw-semibold ms-2" style="letter-spacing: 0.5px;" data-i18n="database_explorer">Database Explorer</span>
            <button class="btn btn-sm btn-icon text-danger btn-db-disconnect" style="padding: 2px 6px;" title="Disconnect" data-i18n-title="disconnect"><i class="bi bi-power"></i></button>
        </div>
        <div class="flex-grow-1 overflow-auto py-2" id="dbTreeContainer">
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
                <span data-i18n="save">Save</span>
            </button>
            <button id="btnSaveCloseFile" class="btn-editor-action btn-editor-close d-flex align-items-center gap-2" title="Save and Close">
                <i class="bi bi-x-lg"></i>
                <span data-i18n="save_close">Save &amp; Close</span>
            </button>
        </div>

        <div class="db-container flex-grow-1 flex-column overflow-hidden bg-darker d-none" id="db-container">
             <div class="db-tabs-nav d-flex align-items-center gap-1 px-3 pt-2 border-bottom border-secondary" id="dbTabsNav" style="background: #1a1a1e; flex-shrink:0;">
                 <button class="db-tab-btn active" id="dbTabStructure" data-tab="structure">
                     <i class="bi bi-folder2-open me-1"></i><span data-i18n="structure">Structure</span>
                 </button>
                 <button class="db-tab-btn" id="dbTabSql" data-tab="sql">
                     <i class="bi bi-code-slash me-1"></i><span data-i18n="sql">SQL</span>
                 </button>
                 <button class="db-tab-btn" id="dbTabBrowse" data-tab="browse">
                     <i class="bi bi-table me-1"></i><span data-i18n="browse">Browse</span>
                 </button>
                 <button class="db-tab-btn" id="dbTabColumns" data-tab="columns">
                     <i class="bi bi-list-columns-reverse me-1"></i><span data-i18n="table_columns">Table Columns</span>
                 </button>
                 <div class="ms-auto d-flex align-items-center gap-2 pb-1">
                     <span class="text-muted small" id="dbActiveTableBadge" style="display:none;">
                         <i class="bi bi-table me-1 text-success"></i>
                         <span id="dbActiveTableName" class="text-success fw-bold"></span>
                     </span>
                 </div>
             </div>

             <div class="db-tab-pane flex-grow-1 overflow-auto p-3" id="dbPaneStructure">
                 <div class="text-center text-muted p-5" id="dbStructurePlaceholder">
                     <i class="bi bi-database mb-3 opacity-25" style="font-size: 3.5rem; display:block;"></i>
                     <span class="opacity-50" data-i18n="select_db_view_structure">Select a database to view its structure</span>
                 </div>
                 <div id="dbStructureContent" class="d-none">
                     <div class="d-flex justify-content-between align-items-center mb-3">
                         <h6 class="mb-0 text-light fw-bold">
                             <i class="bi bi-folder2-open me-2 text-warning"></i>
                             <span id="dbStructureDbName"></span>
                         </h6>
                         <div class="d-flex gap-2">
                             <button class="btn btn-sm btn-outline-secondary" id="btnRefreshStructure">
                                 <i class="bi bi-arrow-clockwise me-1"></i><span data-i18n="refresh">Refresh</span>
                             </button>
                             <button class="btn btn-sm btn-outline-primary" id="btnNewQuery">
                                 <i class="bi bi-plus me-1"></i><span data-i18n="new_sql_query">New SQL Query</span>
                             </button>
                         </div>
                     </div>
                     <div class="card border-secondary" style="background: rgba(30,30,35,0.8); border-radius: 10px; overflow: hidden;">
                         <div class="table-responsive" style="max-width: 100%;">
                             <table class="table table-dark table-hover mb-0" id="dbStructureTable" style="font-size: 0.82rem; width: max-content; min-width: 100%;">
                                 <thead>
                                     <tr style="background: #27272a; border-bottom: 1px solid #3f3f46;">
                                         <th class="px-3 py-2" style="color: #a1a1aa; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; font-size: 0.72rem;" data-i18n="table">Table</th>
                                         <th class="px-3 py-2" style="color: #a1a1aa; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; font-size: 0.72rem;" data-i18n="rows">Rows</th>
                                         <th class="px-3 py-2" style="color: #a1a1aa; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; font-size: 0.72rem;" data-i18n="engine">Engine</th>
                                         <th class="px-3 py-2" style="color: #a1a1aa; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; font-size: 0.72rem;" data-i18n="collation">Collation</th>
                                         <th class="px-3 py-2" style="color: #a1a1aa; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; font-size: 0.72rem;" data-i18n="size">Size</th>
                                         <th class="px-3 py-2" style="color: #a1a1aa; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; font-size: 0.72rem;" data-i18n="actions">Actions</th>
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

             <div class="db-tab-pane flex-grow-1 overflow-auto p-3 d-none" id="dbPaneSql">
                 <div class="mb-2 d-flex justify-content-between align-items-center">
                     <label class="form-label small text-muted text-uppercase fw-semibold mb-0" style="letter-spacing: 0.5px;" data-i18n="sql_query_runner">SQL Query Runner</label>
                     <div class="d-flex gap-2">
                         <button class="btn btn-sm btn-outline-secondary" id="btnClearSql"><i class="bi bi-trash me-1"></i><span data-i18n="clear">Clear</span></button>
                         <button class="btn btn-sm btn-outline-secondary" id="btnFormatSql"><i class="bi bi-text-left me-1"></i><span data-i18n="format">Format</span></button>
                     </div>
                 </div>
                 <div class="d-flex gap-2 mb-3">
                     <textarea class="form-control bg-dark text-light border-secondary font-monospace flex-grow-1" id="sqlQueryInput" rows="5" style="font-size: 0.84rem; border-radius: 8px; resize: vertical; border-color: rgba(255, 255, 255, 0.12) !important; line-height: 1.5;" placeholder="-- Type your SQL query here&#10;SELECT * FROM `table_name` LIMIT 10;"></textarea>
                 </div>
                 <div class="d-flex gap-2 mb-3">
                     <button class="btn btn-success px-4 d-flex align-items-center gap-2" id="btnRunSql" style="border-radius: 8px;">
                         <i class="bi bi-play-fill fs-5"></i> <span data-i18n="run_query">Run Query</span>
                     </button>
                     <button class="btn btn-outline-secondary px-3 d-flex align-items-center gap-2" id="btnRunSqlExplain" style="border-radius: 8px;">
                         <i class="bi bi-lightning me-1"></i>EXPLAIN
                     </button>
                 </div>
                 <div id="sqlResultArea">
                     <div class="text-center text-muted py-4">
                         <i class="bi bi-terminal mb-2 opacity-25" style="font-size: 2.5rem; display:block;"></i>
                         <span class="opacity-50" data-i18n="run_query_output">Run a query to see the output</span>
                     </div>
                 </div>
             </div>

             <div class="db-tab-pane d-flex flex-column flex-grow-1 overflow-hidden d-none" id="dbPaneBrowse">
                 <div class="text-center text-muted py-5" id="dbBrowsePlaceholder">
                     <i class="bi bi-table mb-3 opacity-25" style="font-size: 3.5rem; display:block;"></i>
                     <span class="opacity-50" data-i18n="browse_hint">Click "Browse" on a table from the Structure tab</span>
                 </div>
                 <div id="dbBrowseContent" class="d-none d-flex flex-column flex-grow-1 overflow-hidden">
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

             <div class="db-tab-pane flex-grow-1 overflow-auto p-3 d-none" id="dbPaneColumns">
                 <div class="text-center text-muted py-5" id="dbColumnsPlaceholder">
                     <i class="bi bi-list-columns-reverse mb-3 opacity-25" style="font-size: 3.5rem; display:block;"></i>
                     <span class="opacity-50" data-i18n="columns_hint">Click "Structure" on a table to view its columns</span>
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

        <div class="terminal-container flex-grow-1 flex-column p-3 bg-darker d-none" id="terminal-container">
            <div class="flex-grow-1 border border-secondary rounded-3 overflow-hidden p-2" id="sshTerminal" style="background: #121214; height: 100%;"></div>
        </div>

        <div id="editorPlaceholder" class="position-absolute top-0 start-0 w-100 h-100 bg-darker d-flex flex-column justify-content-center align-items-center text-muted" style="z-index: 10;">
            <i class="bi bi-file-earmark-code mb-3 opacity-25" style="font-size: 4rem;"></i>
            <span class="opacity-50" data-i18n="select_file_edit">Select a file to start editing</span>
        </div>
    </div>
</div>
