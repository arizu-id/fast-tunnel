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
    $('#btnToggleImportPassword').click
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