import { state } from './modules/state.js';
import { getParentPath } from './modules/helpers.js';
import { startTour, resetTour } from './modules/tour.js';
import { promptInput, showToast, showConfirmModal } from './modules/ui.js';
import { loadSessions, saveSession, exportSessions, handleImportFile, doExportWithPassword, doImportWithPassword } from './modules/sessions.js';
import { expandAndRefreshFolder, createNewFile, createNewFolder, uploadFiles } from './modules/ftp.js';
import { initMonacoEditor, saveCurrentFile, closeTab } from './modules/editor.js';
import { initContextMenu } from './modules/context-menu.js';
import { withLoading, setLoading } from './modules/loading.js';
import { api } from './modules/api.js';
import './modules/loading-bar.js';
$(document).ready(function() {
    // Intercept native fetch to automatically inject CSRF token
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
        init = init || {};
        init.headers = init.headers || {};
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
        if (csrfToken) {
            if (init.headers instanceof Headers) {
                init.headers.set('X-CSRF-Token', csrfToken);
            } else {
                init.headers['X-CSRF-Token'] = csrfToken;
            }
        }
        return originalFetch(input, init);
    };

    // Configure jQuery ajax to inject CSRF token
    $.ajaxSetup({
        beforeSend: function(xhr) {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            if (csrfToken) {
                xhr.setRequestHeader('X-CSRF-Token', csrfToken);
            }
        }
    });

    // Logout button handler
    $('#btnLogout').click(function() {
        window.location.href = '/logout';
    });

    $('#btnReplayTour').click(function() {
        resetTour();
        startTour(true);
    });

    loadSessions();
    setTimeout(() => startTour(), 600);
    initMonacoEditor();
    initContextMenu();
    $('.editor-tabs-container').addClass('d-none');
    $('#btnSaveSession').click(saveSession);
    $('#btnExportSessions').click(exportSessions);
    $('#btnImportSessions').click(() => $('#importFileInput').trigger('click'));
    $('#importFileInput').change(handleImportFile);
    $('#btnConfirmExport').click(doExportWithPassword);
    $('#btnToggleExportPassword').click(function() {
        const inp = $('#exportPasswordInput');
        const isPass = inp.attr('type') === 'password';
        inp.attr('type', isPass ? 'text' : 'password');
        $(this).find('i').toggleClass('bi-eye bi-eye-slash');
    });
    $('#exportPasswordModal').on('shown.bs.modal', () => { $('#exportPasswordInput').val('').trigger('focus'); });
    $('#btnConfirmImport').click(doImportWithPassword);
    $('#btnToggleImportPassword').click(function() {
        const inp = $('#importPasswordInput');
        const isPass = inp.attr('type') === 'password';
        inp.attr('type', isPass ? 'text' : 'password');
        $(this).find('i').toggleClass('bi-eye bi-eye-slash');
    });
    $('#importPasswordModal').on('shown.bs.modal', () => { $('#importPasswordInput').val('').trigger('focus'); });
    $('#btnToggleSessions').click(function() {
        const $left = $('.panel-left');
        $left.toggleClass('show-mobile');
        if ($left.hasClass('show-mobile')) {
            $('#sidebarBackdrop').removeClass('d-none');
        } else {
            $('#sidebarBackdrop').addClass('d-none');
        }
    });
    $('#btnToggleExplorer').click(function() {
        const $explorer = $('.file-explorer');
        $explorer.toggleClass('show-mobile');
        if ($explorer.hasClass('show-mobile')) {
            $('#sidebarBackdrop').removeClass('d-none');
        } else {
            $('#sidebarBackdrop').addClass('d-none');
        }
    });
    $('#sidebarBackdrop').click(function() {
        $('.panel-left, .file-explorer').removeClass('show-mobile');
        $('#sidebarBackdrop').addClass('d-none');
    });
    $(document).on('click', '.session-item, .tree-item.file-item', function() {
        if (window.innerWidth < 768) {
            $('.panel-left, .file-explorer').removeClass('show-mobile');
            $('#sidebarBackdrop').addClass('d-none');
        }
    });
    const observer = new MutationObserver(function() {
        if ($('#workspaceArea').hasClass('d-none')) {
            $('#btnToggleExplorer').addClass('d-none');
        } else {
            $('#btnToggleExplorer').removeClass('d-none');
        }
    });
    observer.observe(document.getElementById('workspaceArea'), { attributes: true, attributeFilter: ['class'] });
    $('#useProxy').change(function() {
        if (this.checked) {
            $('#proxyFields').removeClass('d-none');
        } else {
            $('#proxyFields').addClass('d-none');
        }
    });
    $('#addSessionModal').on('hidden.bs.modal', function() {
        $('#addSessionForm')[0].reset();
        $('#proxyFields').addClass('d-none');
        $('.protocol-group').addClass('d-none');
        $('#ftpFormFields').removeClass('d-none');
    });
    $('#sessionProtocol').change(function() {
        const proto = $(this).val();
        $('.protocol-group').addClass('d-none');
        if (proto === 'ftp') $('#ftpFormFields').removeClass('d-none');
        else if (proto === 'mysql') $('#mysqlFormFields').removeClass('d-none');
        else if (proto === 'ssh') $('#sshFormFields').removeClass('d-none');
    });
    $('#btnAddFile').click(function() {
        const path = state.selectedPath || state.currentPath;
        const basePath = state.selectedIsDir ? path : getParentPath(path);
        promptInput('New File Name', function(name) {
            createNewFile(basePath, name);
        });
    });
    $('#btnAddFolder').click(function() {
        const path = state.selectedPath || state.currentPath;
        const basePath = state.selectedIsDir ? path : getParentPath(path);
        promptInput('New Folder Name', function(name) {
            createNewFolder(basePath, name);
        });
    });
    $('#btnRefresh').click(function() {
        const path = state.selectedPath || state.currentPath || '/';
        expandAndRefreshFolder(path);
    });
    $('#btnUploadFile').click(function() {
        state.uploadDestFolder = state.selectedPath && state.selectedIsDir ? state.selectedPath : (state.currentPath || '/');
        $('#fileUploadInput').trigger('click');
    });
    $('#fileUploadInput').change(function() {
        const files = this.files;
        if (!files || files.length === 0) return;
        const destFolder = state.uploadDestFolder || (state.selectedPath && state.selectedIsDir ? state.selectedPath : (state.currentPath || '/'));
        uploadFiles(files, destFolder);
        state.uploadDestFolder = null;
        $(this).val('');
    });
    $('#btnSaveFile').click(function() {
        saveCurrentFile();
    });
    $(window).bind('keydown', function(event) {
        if (event.ctrlKey || event.metaKey) {
            switch (String.fromCharCode(event.which).toLowerCase()) {
                case 's':
                    event.preventDefault();
                    saveCurrentFile();
                    break;
            }
        }
    });

    // Credentials Modal logic
    $('#editCredentialsModal').on('show.bs.modal', function() {
        $('#editCredentialsError').addClass('d-none').text('');
        $('#editCredUsername').val('');
        $('#editCredPassword').val('');
        $('#editCredConfirmPassword').val('');
        
        fetch('/api/auth_profile')
            .then(r => r.json())
            .then(res => {
                if (res.success) {
                    $('#editCredUsername').val(res.username);
                }
            })
            .catch(() => {
                showToast('Failed to fetch profile username', 'danger');
            });
    });

    $('#btnSaveCredentials').click(function() {
        $('#editCredentialsForm').submit();
    });

    $('#editCredentialsForm').submit(function(e) {
        e.preventDefault();
        const username = $('#editCredUsername').val().trim();
        const password = $('#editCredPassword').val();
        const confirmPassword = $('#editCredConfirmPassword').val();
        const $err = $('#editCredentialsError');
        
        $err.addClass('d-none').text('');
        
        if (!username) {
            $err.text('Username is required').removeClass('d-none');
            return;
        }
        
        if (password || confirmPassword) {
            if (password !== confirmPassword) {
                $err.text('Passwords do not match').removeClass('d-none');
                return;
            }
            if (password.length < 5) {
                $err.text('Password must be at least 5 characters long').removeClass('d-none');
                return;
            }
        }
        
        const btn = $('#btnSaveCredentials');
        btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span>Saving...');
        
        fetch('/api/auth_update_credentials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                password: password
            })
        })
        .then(r => r.json())
        .then(res => {
            if (res.success) {
                showToast('Credentials updated successfully', 'success');
                bootstrap.Modal.getInstance(document.getElementById('editCredentialsModal')).hide();
            } else {
                $err.text(res.error || 'Failed to update credentials').removeClass('d-none');
            }
        })
        .catch(() => {
            $err.text('Connection error').removeClass('d-none');
        })
        .finally(() => {
            btn.prop('disabled', false).html('<i class="bi bi-check-lg me-1"></i>Save Changes');
        });
    });

    // Audit log viewer
    function loadAuditLog() {
        const $body = $('#auditLogBody');
        const esc = v => $('<div>').text(v == null ? '' : v).html();
        return withLoading($('#auditLogModal .modal-body'), api('auth_audit_list', { limit: 200 }), { overlay: true })
        .then(res => {
            $body.html((res.entries || []).map(e => `<tr>
                <td class="px-3 py-1 text-nowrap text-muted">${esc(e.created_at)}</td>
                <td class="px-3 py-1">${esc(e.username)}</td>
                <td class="px-3 py-1 text-muted">${esc(e.ip_address)}</td>
                <td class="px-3 py-1"><span class="badge bg-secondary">${esc(e.action)}</span></td>
                <td class="px-3 py-1 text-break">${esc(e.target)}</td>
                <td class="px-3 py-1 text-break text-muted">${esc(e.detail)}</td></tr>`).join('')
                || '<tr><td colspan="6" class="text-center text-muted p-4">No entries yet</td></tr>');
        })
        .catch(err => $body.html(`<tr><td colspan="6" class="text-danger p-3">${esc(err.message)}</td></tr>`));
    }
    $('#auditLogModal').on('show.bs.modal', loadAuditLog);
    $('#btnRefreshAudit').click(loadAuditLog);

    // Plugins Manager listeners
    $('#pluginsModal').on('show.bs.modal', loadPlugins);

    $('#btnTriggerUploadPlugin').click(function() {
        $('#pluginZipInput').trigger('click');
    });

    $('#pluginZipInput').change(function() {
        const file = this.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('plugin_file', file);

        showToast('Uploading and installing plugin...', 'info');

        const btn = $('#btnTriggerUploadPlugin');
        const origHtml = btn.html();
        btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span>Uploading...');

        fetch('/api/install_plugin', {
            method: 'POST',
            body: formData
        })
        .then(r => r.json())
        .then(res => {
            if (res.success) {
                showToast('Plugin installed successfully! Reloading page...', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                showToast(res.error || 'Failed to install plugin.', 'danger');
            }
        })
        .catch(err => {
            showToast('Network error during upload', 'danger');
        })
        .finally(() => {
            btn.prop('disabled', false).html(origHtml);
            $('#pluginZipInput').val('');
        });
    });

    $(document).on('click', '.btn-delete-plugin', function() {
        const slug = $(this).data('slug');
        showConfirmModal(
            'Delete Plugin',
            `Are you sure you want to delete the plugin "${slug}"? This will permanently remove its files.`,
            'Delete Plugin',
            'btn-danger',
            function() {
                const $card = $('.btn-delete-plugin').filter((_, el) => $(el).data('slug') === slug).closest('.d-flex.align-items-center.justify-content-between');
                return withLoading($card, fetch('/api/delete_plugin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ slug: slug })
                }))
                .then(r => r.json())
                .then(res => {
                    if (res.success) {
                        showToast('Plugin deleted successfully! Reloading...', 'success');
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                    } else {
                        showToast(res.error || 'Failed to delete plugin.', 'danger');
                    }
                })
                .catch(err => {
                    showToast('Network error deleting plugin', 'danger');
                });
            }
        );
    });

    function loadPlugins() {
        const $list = $('#pluginsList');
        $list.html(`
            <div class="text-center p-4 text-muted">
                <div class="spinner-border spinner-border-sm me-2 text-primary" role="status"></div>
                <span>Loading plugins...</span>
            </div>
        `);

        fetch('/api/get_plugins', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        })
        .then(r => r.json())
        .then(res => {
            if (res.success) {
                if (res.app) {
                    $('#appNameText').text(res.app.name || 'Fast Tunnel');
                    $('#appVersionText').text('v' + (res.app.version || '1.0.0'));
                    $('#appDescText').text(res.app.description || 'Multi-protocol web client for FTP, MySQL, and SSH connections.');
                    $('#appAuthorText').text(res.app.author || 'Arizu Studio');
                    const webUrl = res.app.website || 'arizu.id';
                    $('#appWebText').text(webUrl).attr('href', webUrl.startsWith('http') ? webUrl : 'https://' + webUrl);
                }

                $list.empty();
                if (res.plugins && res.plugins.length > 0) {
                    res.plugins.forEach(plugin => {
                        const pluginCard = `
                            <div class="d-flex align-items-center justify-content-between p-3 rounded-3 border border-secondary" style="background: rgba(39, 39, 42, 0.4);">
                                <div class="d-flex align-items-center gap-3">
                                    <div class="rounded-3 bg-secondary bg-opacity-10 p-2.5 text-muted d-flex align-items-center justify-content-center" style="width: 44px; height: 44px; border: 1px solid rgba(255,255,255,0.05);">
                                        <i class="bi bi-puzzle fs-4 text-primary"></i>
                                    </div>
                                    <div>
                                        <div class="d-flex align-items-center gap-2">
                                            <span class="fw-semibold text-white">${plugin.name || plugin.slug}</span>
                                            <span class="badge bg-dark border border-secondary text-muted" style="font-size: 0.7rem; padding: 2px 6px;">v${plugin.version || '0.0.0'}</span>
                                        </div>
                                        <p class="text-muted small mb-0" style="margin-top: 2px;">${plugin.description || 'No description provided.'}</p>
                                        <span class="text-secondary small" style="font-size:0.75rem;">By ${plugin.author || 'Unknown'}</span>
                                    </div>
                                </div>
                                <button class="btn btn-sm btn-icon btn-outline-danger btn-delete-plugin" data-slug="${plugin.slug}" title="Delete Plugin" style="border: 1px solid rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.05); color: var(--accent-red);">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        `;
                        $list.append(pluginCard);
                    });
                } else {
                    $list.html(`
                        <div class="text-center p-5 text-muted border border-dashed border-secondary rounded-3" style="background: rgba(39, 39, 42, 0.2);">
                            <i class="bi bi-puzzle-fill mb-3 opacity-25" style="font-size: 2.5rem; display: block;"></i>
                            <span class="small opacity-50">No plugins installed. Import a ZIP plugin file to get started.</span>
                        </div>
                    `);
                }
            } else {
                $list.html(`<div class="alert alert-danger" style="border-radius: 8px;">${res.error || 'Failed to load plugins.'}</div>`);
            }
        })
        .catch(err => {
            $list.html(`<div class="alert alert-danger" style="border-radius: 8px;">Network or server error loading plugins.</div>`);
        });
    }
});