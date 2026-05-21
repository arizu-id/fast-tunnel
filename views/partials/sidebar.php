<div class="panel-left d-flex flex-column border-end border-secondary">
    <div class="p-3 border-bottom border-secondary d-flex justify-content-between align-items-center bg-darker panel-header">
        <h6 class="mb-0 fw-semibold tracking-wide text-uppercase text-muted" style="font-size: 0.75rem;" data-i18n="fast_tunnel">Fast Tunnel</h6>
        <div class="d-flex align-items-center gap-1">
            <button class="btn btn-sm btn-icon" id="btnImportSessions" title="Import Sessions" data-i18n-title="import_sessions">
                <i class="bi bi-box-arrow-in-down"></i>
            </button>
            <button class="btn btn-sm btn-icon" id="btnExportSessions" title="Export Sessions" data-i18n-title="export_sessions">
                <i class="bi bi-box-arrow-up"></i>
            </button>
            <button class="btn btn-sm btn-icon" id="btnSidebarNewSession" data-bs-toggle="modal" data-bs-target="#addSessionModal" title="New Session" data-i18n-title="new_session">
                <i class="bi bi-plus-lg"></i>
            </button>
        </div>
    </div>
    <input type="file" id="importFileInput" accept=".json" style="display:none;">
    <input type="file" id="fileUploadInput" multiple style="display:none;">
    <div class="flex-grow-1 overflow-auto session-list py-2" id="sessionList">
    </div>
</div>
