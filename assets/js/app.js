import { state } from './modules/state.js';
import { getParentPath } from './modules/helpers.js';
import { promptInput } from './modules/ui.js';
import { loadSessions, saveSession, exportSessions, handleImportFile, doExportWithPassword, doImportWithPassword } from './modules/sessions.js';
import { expandAndRefreshFolder, createNewFile, createNewFolder } from './modules/ftp.js';
import { initMonacoEditor, saveCurrentFile, closeTab } from './modules/editor.js';
import { initContextMenu } from './modules/context-menu.js';
$(document).ready(function() {
    loadSessions();
    initMonacoEditor();
    initContextMenu();
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
});