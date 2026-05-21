import './modules/loading-bar.js'; // ? must be first ? patches window.fetch globally
import { state } from './modules/state.js';
import { getParentPath } from './modules/helpers.js';
import { promptInput, showToast, showConfirmModal } from './modules/ui.js';
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
        $(this).find('i').to
    $('#exportPasswordModal').on('shown.bs.modal', () => { $('#exportPasswordInput').val('').trigger('focus'); });

    $('#btnConfirmImport').click(doImportWithPassword);
    $('#btnToggleImportPassword').click(function() {
        const inp = $('#importPasswordInput');
        const isPa
        const isPass = inp.attr('type') === 'password';
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

    $('#btnToggleExplorer').click(function() {
        const activeSidebar = state.currentProtocol === 'mysql' ? $('.db-sidebar') : (state.currentProtocol === 'ssh' ? $('.ssh-sidebar') : $('.file-explorer'));
        activeSidebar.toggleClass('show-mobile');
        $('.panel-left').removeClass('show-mobile');
        if (activeSidebar.hasClass('show-mobile')) {
            $('#sidebarBackdrop').removeClass('d-none');
        } else {
            $('#sidebarBackdrop').addClass('d-none');
        }
    });

    $('#sidebarBackdrop').click(function() {
        $('.panel-left, .file-explorer, .db-sidebar, .ssh-sidebar').removeClass('show-mobile');
        $('#sidebarBackdrop').addClass('d-none');
    });

    $(document).on('click', '.session-item, .tree-item.file-item, .db-table-item', function() {
        if (window.innerWidth < 768) {
            $('.panel-left, .file-explorer, .db-sidebar, .ssh-sidebar').removeClass('show-mobile');
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

    $('#sessionProtocol').change(function() {
        const proto = $(this).val();
        $('.protocol-group').addClass('d-none');
        if (proto === 'ftp') {
            $('#ftpFormFields').removeClass('d-none');
        } else if (proto === 'mysql') {
            $('#mysqlFormFields').removeClass('d-none');
        } else if (proto === 'ssh') {
            $('#sshFormFields').removeClass('d-none');
        }
    });

    $('#addSessionModal').on('hidden.bs.modal', function() {
        $('#addSessionForm')[0].reset();
        $('#sessionProtocol').val('ftp').trigger('change');
    });

    $('#btnRunSql').click(runCustomQuery);

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

        showToast('Uploading and installing plugin...', 'success');

        $.ajax({
            url: 'api.php?action=install_plugin',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            dataType: 'json',
            success: function(res) {
                if (res.success) {
                    showToast('Plugin installed successfully! Reloading page...', 'success');
                    setTimeout(() => {
    });
});




















        const daysLeft = Math.max(1, Math.ceil((maxAgeMs - ageMs) / (1000 * 60 * 60 * 24)));
        const expiryText = daysLeft === 1 ? 'Expires tomorrow' : `Expires in ${daysLeft} days`;

        const item = $(`
            <div class="session-item d-flex justify-content-between align-items-center" data-id="${session.id}">
                <div class="d-flex align-items-center overflow-hidden">
                    <i class="bi bi-hdd-network me-2 text-primary fs-5"></i>
                    <div class="d-flex flex-column text-truncate">
                        <strong class="text-truncate">${session.name}</strong>
                        <small class="text-muted" style="font-size: 0.7rem;">${expiryText}</small>
                    </div>
                </div>
                <button class="btn btn-sm btn-icon text-danger btn-delete-session p-0" title="Delete">
                    <i class="bi bi-trash3"></i>
                </button>
            </div>
        `);
        
        item.click(function(e) {
            if (!$(e.target).closest('.btn-delete-session').length) {
                $('.session-item').removeClass('active');
                $(this).addClass('active');
                connectSession(session.id, session);
            }
        });

        item.find('.btn-delete-session').click(function(e) {
            e.stopPropagation();
            deleteSession(session.id);
        });

        $('#sessionList').append(item);
    });
}

function saveSession() {
    const nameInput = $('input[name="name"]').val().trim();
    const host = $('input[name="host"]').val();
    const port = $('input[name="port"]').val();
    const user = $('input[name="user"]').val();
    const password = $('input[name="password"]').val();

    if(!host || !user) {
        showToast('Host and Username are required', 'danger');
        return;
    }

    const sessions = getSavedSessions();
    const newSession = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        host: host,
        port: parseInt(port),
        user: user,
        password: btoa(password), // basic base64 encode
        name: nameInput || `${user}@${host}`,
        createdAt: Date.now()
    };

    sessions.push(newSession);
    setSavedSessions(sessions);

    bootstrap.Modal.getInstance(document.getElementById('addSessionModal')).hide();
    $('#addSessionForm')[0].reset();
    showToast('Session saved locally');
    loadSessions();
}

function deleteSession(id) {
    showConfirmModal(
        'Delete Session',
        'Are you sure you want to delete this session?',
        'Delete',
                                        <p class="text-muted small mb-0">${plugin.description || 'No description provided.'}</p>
                                        <span class="text-muted small" style="font-size:0.75rem;">By ${plugin.author || 'Unknown'}</span>
                                    </div>
                                </div>
                                <button class="btn btn-sm btn-icon btn-outline-danger btn-delete-plugin" data-slug="${plugin.slug}" title="Delete Plugin">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        `;
                        $list.append(pluginCard);
                    });
                } else {
                    $list.html(`<div class="alert alert-danger">${res.error || 'Failed to load plugins.'}</div>`);
                }
            },
            error: function(xhr) {
                const err = xhr.responseJSON ? xhr.responseJSON.error : 'Network error';
                $list.html(`<div class="alert alert-danger">${err}</div>`);
            }
        });
    }

    $(window).bind('keydown', function(event) {
        if (event.ctrlKey || event.metaKey) {
            switch (String.fromCharCode(event.which).toLowerCase()) {
                case 's':
                    event.preventDefault();
                    if (state.currentProtocol === 'ftp') {
                        saveCurrentFile();
                    }
                    break;
            }
        }
    });
});


function exportSessions() {
    const sessions = getSavedSessions();
    if (sessions.length === 0) {
        showToast('No sessions to export', 'danger');
        return;
    }
    const exportData = {
        exported_at: new Date().toISOString(),
        app: 'Personal FTP Manager - Arizu Studio',
        sessions: sessions
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href 
    $('#btnSaveFile').addClass('d-none');
}

    });
    openTabs = [];
    currentOpenedFile = null;
    renderTabs();
    switchTab(null);
}

function loadFiles(path) {
    $.ajax({
        url: 'api/list',
        type: 'POST',
            const data = JSON.parse(e.target.result);
            const incoming = Array.isArray(data) ? data : (data.sessions || []);
            if (!Array.isArray(incoming) || incoming.length === 0) {
                showToast('Invalid or empty session file', 'danger');
                return;
            }
            // Validate each session has required fields
            const valid = incoming.filter(s => s.host && s.user && s.password);
            if (valid.length === 0) {
                showToast('No valid sessions found in file', 'danger');
                return;
            }
            const existing = getSavedSessions();
            let added = 0;
            valid.forEach(s => {
                // Avoid duplicates by host+user
                const dup = existing.find(e => e.host === s.host && e.user === s.user);
                if (!dup) {
                    // Ensure required fields
                    if (!s.id) s.id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
                    if (!s.createdAt) s.createdAt = Date.now();
                    if (!s.name) s.name = `${s.user}@${s.host}`;
                    existing.push(s);
                    added++;
                }
            });
            setSavedSessions(existing);
            loadSessions();
            showToast(`Imported ${added} new session(s)`);
        } catch (err) {
            showToast('Failed to parse session file', 'danger');
        }
        // Reset input so same file can be re-imported if needed
        $('#importFileInput').val('');
    };
    reader.readAsText(file);
}

// --- FTP Operations ---

    });
}

function goUpDir() {
    if (currentPath === '/' || currentPath === '') return;
    const parts = currentPath.split('/');
    parts.pop();
    const newPath = parts.join('/') || '/';
    loadFiles(newPath);
}
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// --- Editor Operations ---

function initMonacoEditor() {
    require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }});
    require(['vs/editor/editor.main'], function() {
        editor = monaco.editor.create(document.getElementById('monaco-container'), {
            value: '',
            language: 'plaintext',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            fontFamily: 'Consolas, "Courier New", monospace',
            fontSize: 14,
            padding: { top: 16 }
        });
        
        // Add save action command inside editor
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, function() {
            saveCurrentFile();
        });
    });
}
    const file = $('#importFileInput')[0].files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.encrypted) {
                _pendingImportData = data;
                new bootstrap.Modal(document.getElementById('importPasswordModal')).show();
            } else {
                processImportData(data);
            }
        } catch (err) {
            showToast('Failed to read session file', 'danger');
        }
        $('#importFileInput').val('');
    };
    reader.readAsText(file);
}

async function doImportWithPassword() {
    const password = $('#importPasswordInput').val();
    if (!password || !_pendingImportData) {
        showToast('Please enter the decryption password', 'danger');
        return;
    }
    try {
        const plainText = await decryptData(password, _pendingImportData.data);
        const data = JSON.parse(plainText);
        bootstrap.Modal.getInstance(document.getElementById('importPasswordModal')).hide();
        processImportData(data);
    } catch (err) {
        showToast('Wrong password or corrupted file', 'danger');
    }
    _pendingImportData = null;
}

function processImportData(data) {
    const incoming = Array.isArray(data) ? data : (data.sessions || []);
    if (!Array.isArray(incoming) || incoming.length === 0) {
        showToast('Invalid or empty session file', 'danger');
        return;
    }
    const valid = incoming.filter(s => s.host && s.user && s.password);
    if (valid.length === 0) {
        showToast('No valid sessions found in file', 'danger');
        return;
    }
    const existing = getSavedSessions();
    let added = 0;
    valid.forEach(s => {
        const dup = existing.find(e => e.host === s.host && e.user === s.user);
        if (!dup) {
            if (!s.id) s.id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
            if (!s.createdAt) s.createdAt = Date.now();
            if (!s.name) s.name = `${s.user}@${s.host}`;
            existing.push(s);
            added++;
        }
    });
    setSavedSessions(existing);
    loadSessions();
    showToast(`Imported ${added} new session(s)`);
}

// --- FTP Operations ---

function connectSession(id, sessionData) {
    $('#connectionStatus').html(`<span class="text-info"><i class="bi bi-arrow-repeat spin me-2 d-inline-block"></i>Connecting to ${sessionData.name}...</span>`);
    
    // We send credentials directly to API since backend doesn't store them anymore
    $.ajax({
        url: 'api/connect',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            host: sessionData.host,
            port: sessionData.port,
            user: sessionData.user,
            password: atob(sessionData.password),
            dir: '/'
        }),
        success: function(res) {
            if (res.success) {
                curre
                currentPath = res.pwd;
                selectedPath = '/';
                selectedIsDir = true;
                $('#currentPath').text('/').attr('title', '/');
                
                $('#workspaceHeader').html(`<span class="text-success"><i class="bi bi-link-45deg me-2 fs-5"></i>Connected to ${sessionData.name}</span>`);
                $('#welcomeArea').addClass('d-none');
                $('#workspaceArea').removeClass('d-none');
                
                loadRoot();
            } else {
                $('#workspaceHeader').html(`<span class="text-danger"><i class="bi bi-exclamation-triangle me-2"></i>Connection failed: ${res.error}</span>`);
                showToast(res.error, 'danger');
            }
        },
        error: function(xhr) {
            const err = xhr.responseJSON ? xhr.responseJSON.error : 'Unknown error';
            $('#workspaceHeader').html(`<span class="text-danger"><i class="bi bi-exclamation-triangle me-2"></i>Error: ${err}</span>`);
            showToast(err, 'danger');
        }
    });
}

function disconnectUI() {
    currentSessionId = null;
    currentPath = '/';
    $('#workspaceHeader').html(`<span class="text-muted"><i class="bi bi-info-circle me-2"></i>Not connected</span>`);
    $('#welcomeArea').removeClass('d-none');
    $('#workspaceArea').addClass('d-none');
    
    // Dispose all Monaco models in open tabs
    openTabs.forEach(tab => {
            `);
            
            $item.click(function(e) {
                e.stopPropagation();
                selectItem(file.path, false);
                openFile(file.path, file.name);
            });
            
function deleteItem(path, isDir) {
    const itemType = isDir ? 'folder' : 'file';
    showConfirmModal(
        `Delete ${itemType === 'folder' ? 'Folder' : 'File'}`,
        `Are you sure you want to delete this ${itemType} "${path}"?`,
        'Delete',
        'btn-danger',
        function() {
            $.ajax({
                url: 'api/delete',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({path: path, isDir: isDir}),
                success: function(res) {
                    if(res.success) {
                        loadFiles(currentPath);
                        if(currentOpenedFile === path) {
                            editor.setValue('');
                            currentOpenedFile = null;
                            $('#currentEditorFile').html(`<i class="bi bi-file-earmark me-2"></i>No file opened`);
                            $('#btnSaveFile').addClass('d-none');
                        }
                    }
                    else showToast(res.error, 'danger');
                }
            });
        }
    );
}
                editor.setModel(tab.model);
            }
        }
    } else {
        currentOpenedFile = null;
        $('#editorPlaceholder').removeClass('d-none').html(`
            <i class="bi bi-file-earmark-code mb-3 opacity-25" style="font-size: 4rem;"></i>
            <span class="opacity-50">Select a file to start editing</span>
        `);
        $('#btnSaveFile').addClass('d-none');
        if (editor) {
            editor.setModel(null);
        }
    }
}

function closeTab(path) {
    const index = openTabs.findIndex(t => t.path === path);
    if (index === -1) return;
    
    const tab = openTabs[index];
    if (tab.model) {
        tab.model.dispose();
    }
    
    openTabs.splice(index, 1);
    renderTabs();
    
    if (currentOpenedFile === path) {
        if (openTabs.length > 0) {
            const newIndex = Math.min(index, openTabs.length - 1);
            switchTab(openTabs[newIndex].path);
        } else {
            switchTab(null);
        }
    }
}

function openFile(path, name) {
    const existingIndex = openTabs.findIndex(t => t.path === path);
    if (existingIndex > -1) {
        switchTab(path);
        return;
    }
    
    if (openTabs.some(t => t.path === path && t.isLoading)) {
        return;
    }
    
    const loadingTab = {
        path: path,
        name: name,
        isLoading: true
    };
    openTabs.unshift(loadingTab);
    renderTabs();
    switchTab(path);
    
    $.ajax({
        url: 'api/read_file',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({file: path}),
        success: function(res) {
            if (res.success) {
                const idx = openTabs.findIndex(t => t.path === path);
                if (idx > -1) {
                    const lang = getLanguageFromExtension(name);
                    const model = monaco.editor.createModel(res.content, lang);
                    
                    openTabs[idx] = {
                        path: path,
                        name: name,
                        model: model,
                        isLoading: false
                    };
                    
                    renderTabs();
                    switchTab(path);
                }
            } else {
                closeTab(path);
                showToast(res.error, 'danger');
            }
        },
        error: function() {
            closeTab(path);
            showToast('Failed to load file', 'danger');
        }
    });
}

function saveCurrentFile() {
    if (!currentOpenedFile || !editor) return;
    
    const activeTab = openTabs.find(t => t.path === currentOpenedFile);
    if (!activeTab || !activeTab.model) return;
    
    const content = activeTab.model.getValue();
    const btn = $('#btnSaveFile');
    btn.html('<i class="bi bi-arrow-repeat spin"></i>');
    
    $.ajax({
        url: 'api/write_file',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({file: currentOpenedFile, content: content}),
        success: function(res) {
            if (res.success) {
                showToast('File saved successfully');
            } else {
                showToast('Failed to save file: ' + res.error, 'danger');
            }
        },
        complete: function() {
            btn.html('<i class="bi bi-floppy-fill"></i>');
        }
    });
}

// --- File Operations (Create, Rename, Delete) ---









        if (tabEl) {
            tabEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
    }
    
    const tab = openTabs.find(t => t.path === path);
    if (tab) {
        if (tab.isLoading) {
            $('#editorPlaceholder').removeClass('d-none').html(`
                <div class="spinner-border text-primary mb-3" role="status"></div>
                <span>Loading ${tab.name}...</span>
            `);
            $('#btnSaveFile').addClass('d-none');
        } else {
            $('#editorPlaceholder').addClass('d-none');
            $('#btnSaveFile').removeClass('d-none');
            
            if (editor && tab.model) {
                editor.setModel(tab.model);
            }
        }
    } else {
        currentOpenedFile = null;
        $('#editorPlaceholder').removeClass('d-none').html(`
            <i class="bi bi-file-earmark-code mb-3 opacity-25" style="font-size: 4rem;"></i>
            <span class="opacity-50">Select a file to start editing</span>
        `);
        $('#btnSaveFile').addClass('d-none');
        if (editor) {
            editor.setModel(null);
        }
    }
}

function closeTab(path) {
    const index = openTabs.findIndex(t => t.path === path);
                if(res.success) {
                    loadFiles(currentPath);
                    
                    const tab = openTabs.find(t => t.path === oldPath);
                    if (tab) {
                        tab.path = newPath;
                        tab.name = newName;
                        if (tab.model) {
                            const newLang = getLanguageFromExtension(newName);
                            monaco.editor.setModelLanguage(tab.model, newLang);
                        }
                        renderTabs();
                    }
                    if(currentOpenedFile === oldPath) {
                        currentOpenedFile = newPath;
                    }
                }
                else showToast(res.error, 'danger');
            }
        });
    });
}

function deleteItem(path, isDir) {
    const itemType = isDir ? 'folder' : 'file';
    showConfirmModal(
        `Delete ${itemType === 'folder' ? 'Folder' : 'File'}`,
        `Are you sure you want to delete this ${itemType} "${path}"?`,
        'Delete',
        'btn-danger',
        function() {
            $.ajax({
                url: 'api/delete',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({path: path, isDir: isDir}),
                success: function(res) {
                    if(res.success) {
                        loadFiles(currentPath);
                        
                        if (isDir) {
                            const prefix = path.endsWith('/') ? path : path + '/';
                            const tabsToClose = openTabs.filter(t => t.path.startsWith(prefix));
                            tabsToClose.forEach(t => closeTab(t.path));
                        } else {
                            closeTab(path);
                        }
                    }
                    else showToast(res.error, 'danger');
                }
            });
        }
    );
}



        'sql': 'bi-filetype-sql text-warning',
        'xml': 'bi-filetype-xml text-muted',
        'yaml': 'bi-filetype-yml text-muted',
        'yml': 'bi-filetype-yml text-muted'
    };
    return map[ext] || 'bi-file-earmark-text text-secondary';
}

function renderTabs() {
    const $container = $('#editorTabs');
    $container.empty();
    
    openTabs.forEach((tab, index) => {
        const iconClass = tab.isLoading ? 'bi-arrow-repeat spin' : getFileIconClass(tab.name);
        const isActive = tab.path === currentOpenedFile;
        
        const $tab = $(`
            <div class="editor-tab ${isActive ? 'active' : ''}" draggable="true" data-path="${tab.path}" title="${tab.path}">
                <i class="bi ${iconClass} me-2 fs-6"></i>
                <span class="tab-name text-truncate" style="max-width: 120px;">${tab.name}</span>
                <span class="btn-close-tab" title="Close"><i class="bi bi-x"></i></span>
            </div>
        `);
        
        // Tab click to switch
        $tab.click(function(e) {
            if (!$(e.target).closest('.btn-close-tab').length) {
                switchTab(tab.path);
            }
        });
        
        // Close button click
        $tab.find('.btn-close-tab').click(function(e) {
            e.stopPropagation();
            closeTab(tab.path);
        });
        
        $container.append($tab);
    });
    
    bindTabDragEvents();
}

let draggedIndex = null;
function bindTabDragEvents() {
    $('.editor-tab').off('dragstart dragend dragover dragenter dragleave drop');

    $('.editor-tab').on('dragstart', function(e) {
        draggedIndex = $(this).index();
        $(this).addClass('dragging');
        e.originalEvent.dataTransfer.effectAllowed = 'move';
        e.originalEvent.dataTransfer.setData('text/plain', draggedIndex);
    });

    $('.editor-tab').on('dragend', function() {
        $('.editor-tab').removeClass('dragging over-left over-right');
    });

    $('.editor-tab').on('dragover', function(e) {
        e.preventDefault();
        return false;
    });

    $('.editor-tab').on('dragenter', function(e) {
        const targetIndex = $(this).index();
        if (targetIndex === draggedIndex) return;
        
        $('.editor-tab').removeClass('over-left over-right');
        if (targetIndex < draggedIndex) {
            $(this).addClass('over-left');
        } else {
            $(this).addClass('over-right');
        }
    });

    $('.editor-tab').on('dragleave', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.originalEvent.clientX;
        const y = e.originalEvent.clientY;
        if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
            $(this).removeClass('over-left over-right');
        }
    });

    $('.editor-tab').on('drop', function(e) {
        e.preventDefault();
        const targetIndex = $(this).index();
        if (draggedIndex !== null && targetIndex !== drag
            const draggedTab = openTabs.splice(draggedIndex, 1)[0];
            openTabs.splice(targetIndex, 0, draggedTab);
            renderTabs();
            $(`.editor-tab[data-path="${CSS.escape(currentOpenedFile)}"]`).addClass('active');
        }
        draggedIndex = null;
    });
}

function switchTab(path) {
    currentOpenedFile = path;
    
    $('.editor-tab').removeClass('active');
    if (path) {
        $(`.editor-tab[data-path="${CSS.escape(path)}"]`).addClass('active');
        const tabEl = document.querySelector(`.editor-tab[data-path="${CSS.escape(path)}"]`);
        if (tabEl) {
            tabEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
    }
    
    const tab = openTabs.find(t => t.path === path);
    if (tab) {
        if (tab.isLoading) {
            $('#editorPlaceholder').removeClass('d-none').html(`
                <div class="spinner-border text-primary mb-3" role="status"></div>
                <span>Loading ${tab.name}...</span>
            `);
            $('#floatingActionPanel').addClass('d-none');
        } else {
            $('#editorPlaceholder').addClass('d-none');
            $('#floatingActionPanel').removeClass('d-none');
            
            if (editor && tab.model) {
                editor.setModel(tab.model);
            }
        }
    } else {
        currentOpenedFile = null;
        $('#editorPlaceholder').removeClass('d-none').html(`
            <i class="bi bi-file-earmark-code mb-3 opacity-25" style="font-size: 4rem;"></i>
            <span class="opacity-50">Select a file to start editing</span>
        `);
        $('#floatingActionPanel').addClass('d-none');
        if (editor) {
            edit













                data: JSON.stringify({path: path, isDir: isDir}),
                success: function(res) {
                    if(res.success) {
                        expandAndRefreshFolder(parent);
                        
                        if (isDir) {
                            const prefix = path.endsWith('/') ? path : path + '/';
                            const tabsToClose = openTabs.filter(t => t.path.startsWith(prefix));
                            tabsToClose.forEach(t => closeTab(t.path));
                        } else {
                            closeTab(path);
                        }
                    }
                    else showToast(res.error, 'danger');
                }
            });
        }
    );
}

// --- Context Menu ---
function initContextMenu() {
    $.contextMenu({
        selector: '.tree-item',
        isHtmlName: true,
        build: function($trigger, e) {
            const path = $trigger.attr('data-path');
            const name = $trigger.attr('data-name');
            const isDir = $trigger.attr('data-isdir') === 'true';
            
            selectItem(path, isDir);
            
            const openIcon = isDir ? 'bi-folder-open' : 'bi-pencil-square';
            
            return {
                isHtmlName: true,
                items: {
                    "open": {
                        name: `<i class="bi ${openIcon} me-2"></i> Open`, 
                        callback: function() {
                            if(isDir) {
                                const $children = $trigger.next();
                                toggleFolder(path, $trigger, $children);
                            }
                            else openFile(path, name);
                        }
                    },
                    "rename": {
                        name: `<i class="bi bi-input-cursor-text me-2"></i> Rename`, 
                        callback: function() { renameItem(path, name); }
                    },
                    "sep1": "---------",
                    "delete": {
                        name: `<i class="bi bi-trash3 text-danger me-2"></i> <span class="text-danger">Delete</span>`, 
                        callback: function() { deleteItem(path, isDir); }
                    }
                }
            };
        }
    });

    $.contextMenu({
        selector: '.file-explorer',
        isHtmlName: true,
        build: function($trigger, e) {
            if ($(e.target).closest('.tree-item').length > 0) {
                return false; 
            }
            return {
                isHtmlName: true,
                items: {
                    "new_file": {
                        name: `<i class="bi bi-file-earmark-plus me-2"></i> New File`, 
                        callback: function() { 
                            selectItem('/', true);
                            promptInput('New File Name:', createNewFile); 
                        }
                    },
                    "new_folder": {
                        name: `<i class="bi bi-folder-plus me-2"></i> New Folder`, 
                        callback: function() { 
                            selectItem('/', true);
                            promptInput('New Folder Name:', createNewFolder); 
                        }
                    },
                    "sep1": "---------",
                    "refresh": {
                        name: `<i class="bi bi-arrow-clockwise me-2"></i> Refresh`, 
                        callback: function() { 
                            loadRoot();
                        }
                    }
                }
            };
        }
    });
}












        contentType: 'application/json',
        data: JSON.stringify({file: path, content: ''}),
        success: function(res) {
            if (res.success) {
                expandAndRefreshFolder(parent, function() {
                    openFile(path, name);
                    selectItem(path, false);
                });
            } else showToast(res.error, 'danger');
        }
    });
}

function createNewFolder(name) {
    const parent = selectedIsDir ? selectedPath : getParentPath(selectedPath);
    const path = parent === '/' ? `/${name}` : `${parent}/${name}`;
    $.ajax({
        url: 'api/create_dir',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({dir: path}),
        success: function(res) {
            if (res.success) {
                expandAndRefreshFolder(parent, function() {
                    selectItem(path, true);
                });
            } else showToast(res.error, 'danger');
        }
    });
}

function renameItem(oldPath, oldName) {
    promptInput(`Rename ${oldName} to:`, function(newName) {
        if(newName === oldName) return;
        const parent = getParentPath(oldPath);
        const newPath = parent === '/' ? `/${newName}` : `${parent}/${newName}`;
        
        $.ajax({
            url: 'api/rename',
            type: 'POST',
            contentType: 'appli



















                        currentOpenedFile = newPath;
                    }
                }
                else showToast(res.error, 'danger');
            }
        });
    });
}

function deleteItem(path, isDir) {
    const itemType = isDir ? 'folder' : 'file';
    showConfirmModal(
        `Delete ${itemType === 'folder' ? 'Folder' : 'File'}`,
        `Are you sure you want to delete this ${itemType} "${path}"?`,
        'Delete',
        'btn-danger',
        function() {
            const parent = getParentPath(path);
            $.ajax({
                url: 'api/delete',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({path: path, isDir: isDir}),
                success: function(res) {
                    if(res.success) {
                        expandAndRefreshFolder(parent);
                        
                        if (isDir) {
                            const prefix = path.endsWith('/') ? path : path + '/';
                            const tabsToClose = openTabs.filter(t => t.path.startsWith(prefix));
                            tabsToClose.forEach(t => closeTab(t.path));
                        } else {
                            closeTab(path);
                        }
                    }
                    else showToast(res.error, 'danger');
                }
            });
        }
    );
}

// --- Context Menu ---
function initContextMenu() {
    $.contextMenu({
        selector: '.tree-item',
        build: function($trigger, e) {
            const path = $trigger.attr('data-path');
            const name = $trigger.attr('data-name');
            const isDir = $trigger.attr('data-isdir') === 'true';
            
            selectItem(path, isDir);
            
            const items = {
                "open": {
                    name: isDir ? 'Open Folder' : 'Open File',
                    icon: isDir ? 'bi-folder-open' : 'bi-pencil-square',
                    className: 'ctx-item-open',
                    callback: function() {
                        if (isDir) {
                            const $folderChildren = $trigger.next('.folder-children');
                            toggleFolder(path, $trigger, $folderChildren);
                        } else {
                            openFile(path, name);
                        }
                    }
                },
                "rename": {
                    name: 'Rename',
                    icon: 'bi-pencil',
                    className: 'ctx-item-rename',
                    callback: function() { renameItem(path, name); }
                }
            };

            if (!isDir) {
                items['download'] = {
                    name: 'Download',
                    icon: 'bi-d















        }
    });

    $.contextMenu({
        selector: '.file-explorer',
        isHtmlName: true,
        build: function($trigger, e) {
            if ($(e.target).closest('.tree-item').length > 0) {
                return false;
            }
            return {
                items: {
                    new_file: {
                        name: `${ctxIcon('bi-file-earmark-plus')} New File`,
                        callback: function() {
                            selectItem('/', true);
                            promptInput('New File Name:', createNewFile);
                        }
                    },
                    new_folder: {
                        name: `${ctxIcon('bi-folder-plus')} New Folder`,
                        callback: function() {
                            selectItem('/', true);
                            promptInput('New Folder Name:', createNewFolder);
                        }
                    },
                    sep1: '--------',
                    refresh: {
                        name: `${ctxIcon('bi-arrow-clockwise')} Refresh`,
                        callback: function() { loadRoot(); }
                    }
                }
            };
        }
    });
}

function downloadFile(path, name) {
    const url = `api/download_file?file=${encodeURIComponent(path)}`;
    const a   = document.createElement('a');
    a.href    = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`Downloading ${name}...`);
}

