import { state } from './modules/state.js';
import { getParentPath } from './modules/helpers.js';
import { promptInput, showToast } from './modules/ui.js';
import { loadSessions, saveSession, exportSessions, handleImportFile, doExportWithPassword, doImportWithPassword } from './modules/sessions.js';
import { expandAndRefreshFolder, createNewFile, createNewFolder } from './modules/ftp.js';
import { initMonacoEditor, saveCurrentFile, closeTab } from './modules/editor.js';
import { initContextMenu } from './modules/context-menu.js';
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

    loadSessions();
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
        
        const btn = $(this);
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
});