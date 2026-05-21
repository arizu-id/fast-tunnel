<?php
// DB modals (originally inside workspaceArea)
?>
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
            <div class="modal-body px-4 py-3" id="dbEditRowBody"></div>
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

<div class="modal fade" id="addSessionModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content bg-dark text-light border-secondary shadow-lg" style="border-radius: 12px; overflow: hidden;">
            <div class="modal-header border-secondary bg-darker p-4 pb-3">
                <div>
                    <h5 class="modal-title fw-bold mb-1" data-i18n="new_connection">New Connection</h5>
                    <p class="text-muted small mb-0" data-i18n="select_protocol_set_cred">Select protocol and set credentials.</p>
                </div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
                <form id="addSessionForm">
                    <div class="mb-3">
                        <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide" data-i18n="protocol">Protocol</label>
                        <select class="form-select bg-darker text-light border-secondary" id="sessionProtocol" name="protocol" style="border-radius: 8px;">
                            <option value="ftp" data-i18n="ftp_connection">FTP Connection</option>
                            <option value="mysql" data-i18n="mysql_client">MySQL Client (phpMyAdmin style)</option>
                            <option value="ssh" data-i18n="web_ssh_client">Web SSH Client</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide" data-i18n="session_name">Session Name</label>
                        <div class="input-group">
                            <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-tag"></i></span>
                            <input type="text" class="form-control bg-darker text-light border-secondary" name="name" placeholder="Session Name (optional, e.g. My Server)">
                        </div>
                    </div>
                    <div id="ftpFormFields" class="protocol-group">
                        <div class="mb-4">
                            <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide" data-i18n="ftp_server_details">FTP Server Details</label>
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
                            <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide" data-i18n="ftp_authentication">FTP Authentication</label>
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
                            <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide" data-i18n="mysql_server_details">MySQL Server Details</label>
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
                            <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide" data-i18n="mysql_authentication">MySQL Authentication</label>
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
                            <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide" data-i18n="ssh_server_details">SSH Server Details</label>
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
                            <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide" data-i18n="ssh_authentication">SSH Authentication</label>
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
                        $modalUi = __DIR__ . '/../../plugins/' . $plugin . '/ui_connection_modal.php';
                        if (file_exists($modalUi)) {
                            include $modalUi;
                        }
                    }
                    ?>
                </form>
            </div>
            <div class="modal-footer border-secondary bg-darker p-3">
                <button type="button" class="btn btn-dark border-secondary px-4" data-bs-dismiss="modal" data-i18n="cancel">Cancel</button>
                <button type="button" class="btn btn-primary px-4" id="btnSaveSession" data-i18n="save_connection">Save Connection</button>
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

<div class="modal fade" id="editSessionModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content bg-dark text-light border-secondary shadow-lg" style="border-radius: 12px; overflow: hidden;">
            <div class="modal-header border-secondary bg-darker p-4 pb-3">
                <div>
                    <h5 class="modal-title fw-bold mb-1"><i class="bi bi-pencil-square text-warning me-2"></i><span data-i18n="edit_connection">Edit Connection</span></h5>
                    <p class="text-muted small mb-0" data-i18n="modify_credentials">Modify credentials for this session.</p>
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

<div class="modal fade" id="editCredentialsModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-secondary shadow-lg" style="background-color: #1c1c1f; border-radius: 14px; overflow: hidden;">
            <div class="modal-header border-secondary" style="background-color: #18181b; padding: 20px 28px;">
                <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-shield-lock text-muted fs-5"></i>
                    <h5 class="modal-title fw-bold mb-0 text-white" data-i18n="edit_admin_credentials">Edit Admin Credentials</h5>
                </div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body" style="padding: 28px;">
                <div class="alert alert-danger d-none" id="editCredentialsError" style="font-size: 0.82rem; border-radius: 8px;"></div>
                <form id="editCredentialsForm" autocomplete="off">
                    <div class="mb-3">
                        <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide">Username</label>
                        <div class="input-group">
                            <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-person"></i></span>
                            <input type="text" class="form-control bg-darker text-light border-secondary shadow-none" id="editCredUsername" required placeholder="Enter username">
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide">New Password</label>
                        <div class="input-group">
                            <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-key"></i></span>
                            <input type="password" class="form-control bg-darker text-light border-secondary shadow-none" id="editCredPassword" placeholder="Leave blank to keep current" autocomplete="new-password">
                        </div>
                        <small class="text-muted" style="font-size: 0.75rem;">Leave blank to keep the existing password.</small>
                    </div>
                    <div class="mb-3">
                        <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide">Confirm Password</label>
                        <div class="input-group">
                            <span class="input-group-text bg-darker border-secondary text-muted"><i class="bi bi-key-fill"></i></span>
                            <input type="password" class="form-control bg-darker text-light border-secondary shadow-none" id="editCredConfirmPassword" placeholder="Confirm new password" autocomplete="new-password">
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer border-secondary" style="background-color: #18181b; padding: 14px 28px;">
                <button type="button" class="btn btn-sm btn-dark border-secondary px-3" data-bs-dismiss="modal" style="border-radius: 8px;">Cancel</button>
                <button type="button" class="btn btn-sm btn-success px-4" id="btnSaveCredentials" style="border-radius: 8px;">
                    <i class="bi bi-check-lg me-1"></i>Save Changes
                </button>
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
                <p class="text-muted small">Last updated: May 2026 &mdash; Arizu Studio</p>
                <h6 class="text-white fw-semibold mt-4 mb-2">1. Information We Collect</h6>
                <p>This application (Fast Tunnel) operates entirely on your own server environment. We do not collect, store, or transmit any personal data, session credentials, or file/database contents to any external server or third party.</p>
                <p>All connection credentials entered in this application are stored locally in your server's database and are never shared with Arizu Studio or any external party.</p>
                <h6 class="text-white fw-semibold mt-4 mb-2">2. Zero-Trust Data Encryption</h6>
                <p>Session credentials (hostname, port, username, password, database name, and proxy details) are saved directly in your local MySQL database. To protect against credential leaks, all sensitive fields are secured using server-side AES-256-CBC encryption using a secret key kept strictly inside your server's <code>config.php</code> file. Credentials are only decrypted in-memory during active sessions.</p>
                <p>When you export sessions, they are encrypted client-side using a password you specify, ensuring your credentials cannot be read by unauthorized parties during transport.</p>
                <h6 class="text-white fw-semibold mt-4 mb-2">3. Third-Party Services</h6>
                <p>This application is fully self-contained. All libraries and assets (Bootstrap, jQuery, Monaco Editor, Bootstrap Icons, Inter Font) are bundled locally and served from your own server. No external CDN requests are made during normal operation, ensuring complete privacy and offline capability.</p>
                <h6 class="text-white fw-semibold mt-4 mb-2">4. No Analytics or Tracking</h6>
                <p>This application does not include any analytics, tracking pixels, cookies, or telemetry of any kind. Your usage remains entirely private.</p>
                <h6 class="text-white fw-semibold mt-4 mb-2">5. Contact</h6>
                <p>For privacy-related inquiries, please contact us at <a href="mailto:ariefzufar@arizu.id" class="text-light">ariefzufar@arizu.id</a>.</p>
            </div>
            <div class="modal-footer border-secondary" style="background-color: #18181b; padding: 14px 28px;">
                <span class="text-muted small">&copy; 2026 Arizu Studio &mdash; arizu.id</span>
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
                <p class="text-muted small">Last updated: May 2026 &mdash; Arizu Studio</p>
                <h6 class="text-white fw-semibold mt-4 mb-2">1. Acceptance of Terms</h6>
                <p>By using Fast Tunnel (the "Application"), you agree to be bound by these Terms &amp; Conditions. If you do not agree, please discontinue use of the Application immediately.</p>
                <h6 class="text-white fw-semibold mt-4 mb-2">2. License &amp; Permitted Use</h6>
                <p>This Application is provided for personal and internal business use only. You may not resell, redistribute, or sublicense this Application or its source code without explicit written permission from Arizu Studio.</p>
                <h6 class="text-white fw-semibold mt-4 mb-2">3. Responsibility &amp; Liability</h6>
                <p>You are solely responsible for all files, data, and operations performed through this Application. Arizu Studio is not liable for any data loss, unauthorized access, or damage resulting from your use or misuse of the Application.</p>
                <p>You are responsible for securing your server environment, maintaining the confidentiality of your database and encryption keys (including the <code>ENCRYPTION_KEY</code> inside <code>config.php</code>), and managing user access controls.</p>
                <h6 class="text-white fw-semibold mt-4 mb-2">4. No Warranty</h6>
                <p>This Application is provided "as is" without warranty of any kind, express or implied.</p>
                <h6 class="text-white fw-semibold mt-4 mb-2">5. Modifications</h6>
                <p>Arizu Studio reserves the right to modify these Terms &amp; Conditions at any time. Continued use of the Application after such changes constitutes acceptance of the new terms.</p>
                <h6 class="text-white fw-semibold mt-4 mb-2">6. Contact</h6>
                <p>For questions about these Terms, contact us at <a href="mailto:ariefzufar@arizu.id" class="text-light">ariefzufar@arizu.id</a>.</p>
            </div>
            <div class="modal-footer border-secondary" style="background-color: #18181b; padding: 14px 28px;">
                <span class="text-muted small">&copy; 2026 Arizu Studio &mdash; arizu.id</span>
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
                    <button class="btn btn-outline-secondary border-secondary" type="button" id="btnToggleExportPassword" tabindex="-1"><i class="bi bi-eye"></i></button>
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
                    <button class="btn btn-outline-secondary border-secondary" type="button" id="btnToggleImportPassword" tabindex="-1"><i class="bi bi-eye"></i></button>
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

<div class="modal fade" id="pluginsModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content bg-dark text-light border-secondary shadow-lg" style="border-radius: 12px; overflow: hidden;">
            <div class="modal-header border-secondary bg-darker p-4 pb-3">
                <div>
                    <h5 class="modal-title fw-bold mb-1"><i class="bi bi-puzzle text-primary me-2"></i><span data-i18n="plugins_app_info">Plugins &amp; App Info</span></h5>
                    <p class="text-muted small mb-0" data-i18n="manage_plugins_desc">Manage Fast Tunnel system plugins and view application details.</p>
                </div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4" style="max-height: 70vh; overflow-y: auto;">
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
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="text-muted text-uppercase fw-semibold tracking-wide small mb-0"><i class="bi bi-plugin me-2"></i>Installed Plugins</h6>
                    <div>
                        <button class="btn btn-sm btn-primary d-flex align-items-center gap-2" id="btnTriggerUploadPlugin" style="border-radius: 8px;">
                            <i class="bi bi-upload"></i> Import Plugin
                        </button>
                        <input type="file" id="pluginZipInput" accept=".zip" class="d-none">
                    </div>
                </div>
                <div class="list-group gap-2" id="pluginsList">
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
