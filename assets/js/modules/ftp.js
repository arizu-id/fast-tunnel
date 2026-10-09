import { state } from './state.js';
import { selectItem, getParentPath } from './helpers.js';
import { showToast, showConfirmModal, promptInput } from './ui.js';
import { api } from './api.js';
import { setLoading, withLoading } from './loading.js';
import { openFile, closeTab, getFileIconClass, renderTabs, switchTab } from './editor.js';
export function connectSession(id, sessionData) {
    if (state.isConnecting) {
        showToast('Connection in progress, please wait...', 'warning');
        return;
    }
    state.isConnecting = true;
    state.currentProtocol = 'ftp';
    $('#connectionStatus').html(`<span class="text-info"><i class="bi bi-arrow-repeat spin me-2 d-inline-block"></i>Connecting to ${sessionData.name}...</span>`);
    $('.session-item').addClass('pe-none opacity-50');
    setLoading($('.session-item.active'), true);
    $.ajax({
        url: '/api/connect',
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({
            host: sessionData.host,
            port: sessionData.port,
            user: sessionData.user,
            password: sessionData.password ? atob(sessionData.password) : '',
            use_proxy: (sessionData.extra && sessionData.extra.use_proxy) || sessionData.use_proxy || false,
            proxy_host: (sessionData.extra && sessionData.extra.proxy_host) || sessionData.proxy_host || '',
            proxy_port: (sessionData.extra && sessionData.extra.proxy_port) || sessionData.proxy_port || 0,
            proxy_type: (sessionData.extra && sessionData.extra.proxy_type) || sessionData.proxy_type || '',
            proxy_user: (sessionData.extra && sessionData.extra.proxy_user) || sessionData.proxy_user || '',
            proxy_password: (sessionData.extra && sessionData.extra.proxy_password) || (sessionData.proxy_password ? atob(sessionData.proxy_password) : ''),
            dir: '/'
        }),
        success: function(res) {
            if (res.success) {
                state.currentSessionId = id;
                state.currentPath = res.pwd || '/';
                state.selectedPath = '/';
                state.selectedIsDir = true;
                $('#currentPath').text('/').attr('title', '/');
                $('#connectionStatus').html(`<span class="text-success"><i class="bi bi-link-45deg me-2 fs-5"></i>Connected to ${sessionData.name}</span>`);
                $('#welcomeArea').addClass('d-none');
                $('#workspaceArea').removeClass('d-none');
                $('#ftpSidebar').removeClass('d-none');
                $('#dbSidebar').addClass('d-none');
                $('#sshSidebar').addClass('d-none').removeClass('d-flex');
                $('#terminal-container').addClass('d-none').removeClass('d-flex');
                $('#db-container').addClass('d-none');
                $('#monaco-container').removeClass('d-none');
                $('#editorPlaceholder').removeClass('d-none');
                const $tree = $('#fileList');
                $tree.empty();
                renderTreeItems(res.files || [], $tree, '/');
            } else {
                showToast(res.error || 'Connection failed', 'danger');
                $('#connectionStatus').html(`<span class="text-danger"><i class="bi bi-x-circle me-2"></i>${res.error || 'Connection failed'}</span>`);
            }
        },
        error: function(xhr) {
            let msg = 'Connection error';
            try { msg = JSON.parse(xhr.responseText).error || msg; } catch(e) {}
            showToast(msg, 'danger');
            $('#connectionStatus').html(`<span class="text-danger"><i class="bi bi-x-circle me-2"></i>${msg}</span>`);
        },
        complete: function() {
            state.isConnecting = false;
            $('.session-item').removeClass('pe-none opacity-50');
        setLoading($('.session-item'), false);
        }
    });
}
export function disconnectUI() {
    state.currentSessionId = null;
    state.currentProtocol = null;
    state.currentPath = '/';
    $('#workspaceArea').addClass('d-none');
    $('#welcomeArea').removeClass('d-none');
    $('#connectionStatus').html('');
    state.openTabs.forEach(tab => {
        if (tab.model) tab.model.dispose();
    });
    state.openTabs = [];
    state.currentOpenedFile = null;
    renderTabs();
    switchTab(null);
    $('#fileList').empty();
}
function renderTreeItems(files, $container, parentPath) {
    if (!files || files.length === 0) {
        $container.append('<div class="tree-empty text-muted small ps-2 opacity-50">Empty</div>');
        return;
    }
    files.forEach(item => {
        const fullPath = (parentPath === '/' ? '' : parentPath) + '/' + item.name;
        let $item;
        if (item.isDir) {
            $item = $(`
                <div class="tree-item folder-item" data-path="${fullPath}" data-is-dir="true" data-expanded="false" draggable="true">
                    <div class="tree-row d-flex align-items-center">
                        <span class="chevron-icon me-1"><i class="bi bi-chevron-right"></i></span>
                        <i class="bi bi-folder2 me-2 text-warning"></i>
                        <span class="item-name text-truncate">${item.name}</span>
                    </div>
                    <div class="tree-children ps-3" style="display:none;"></div>
                </div>
            `);
            const $row = $item.find('.tree-row');
            const $children = $item.find('.tree-children');
            $row.click(function(e) {
                e.stopPropagation();
                selectItem(fullPath, true);
                toggleFolder(fullPath, $item, $children);
            });

            // Drag over/leave/drop handlers for folders
            $item.on('dragover', function(e) {
                e.preventDefault();
                e.stopPropagation();
                $item.addClass('drag-hover');
            });
            $item.on('dragleave', function(e) {
                e.stopPropagation();
                $item.removeClass('drag-hover');
            });
            $item.on('drop', function(e) {
                e.preventDefault();
                e.stopPropagation();
                $item.removeClass('drag-hover');
                
                const files = e.originalEvent.dataTransfer.files;
                if (files && files.length > 0) {
                    uploadFiles(files, fullPath);
                } else {
                    const sourcePath = e.originalEvent.dataTransfer.getData('text/plain');
                    const itemType = e.originalEvent.dataTransfer.getData('item-type');
                    if (!sourcePath) return;
                    moveItem(sourcePath, fullPath, itemType === 'dir');
                }
            });
        } else {
            const iconClass = getFileIconClass(item.name);
            $item = $(`
                <div class="tree-item file-item" data-path="${fullPath}" data-is-dir="false" draggable="true">
                    <div class="tree-row d-flex align-items-center ps-3">
                        <i class="bi ${iconClass} me-2 text-secondary"></i>
                        <span class="item-name text-truncate">${item.name}</span>
                    </div>
                </div>
            `);
            $item.find('.tree-row').click(function(e) {
                e.stopPropagation();
                selectItem(fullPath, false);
                openFile(fullPath, item.name);
            });
        }

        // Drag start and end handlers for tree items
        $item.on('dragstart', function(e) {
            e.stopPropagation();
            e.originalEvent.dataTransfer.setData('text/plain', fullPath);
            e.originalEvent.dataTransfer.setData('item-type', item.isDir ? 'dir' : 'file');
            $item.addClass('dragging');
        });
        $item.on('dragend', function(e) {
            e.stopPropagation();
            $item.removeClass('dragging');
        });

        $container.append($item);
    });
}
export function toggleFolder(path, $item, $children) {
    const isExpanded = $item.attr('data-expanded') === 'true';
    const $chevron = $item.find('.chevron-icon i').first();
    if (isExpanded) {
        $item.attr('data-expanded', 'false');
        $chevron.removeClass('bi-chevron-down').addClass('bi-chevron-right');
        $children.stop(true).slideUp(150);
    } else {
        $item.attr('data-expanded', 'true');
        $chevron.removeClass('bi-chevron-right').addClass('bi-chevron-down');
        $children.stop(true).slideDown(150);
        if ($children.children().length === 0) {
            $children.html('<div class="text-muted small ps-2 py-1 opacity-50"><i class="bi bi-arrow-repeat spin me-1"></i>Loading...</div>');
            const $loadRow = $item.children('.tree-row').first();
            setLoading($loadRow, true);
            $.ajax({
                url: '/api/list',
                type: 'POST',
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify({ dir: path }),
                success: function(res) {
                    $children.empty();
                    if (res.success) {
                        renderTreeItems(res.files || [], $children, path);
                    } else {
                        $children.html(`<div class="text-danger small ps-2 opacity-75">${res.error || 'Error'}</div>`);
                    }
                },
                error: function() {
                    $children.html('<div class="text-danger small ps-2 opacity-75">Load failed</div>');
                },
                complete: function() { setLoading($loadRow, false); }
            });
        }
    }
}
function treeRow(path) {
    return $('.tree-item').filter((_, el) => $(el).attr('data-path') === path).children('.tree-row').first();
}
function folderTarget(path) {
    return path === '/' ? $('#fileList') : treeRow(path);
}
export function expandAndRefreshFolder(path) {
    if (path === '/') {
        const $tree = $('#fileList');
        setLoading($tree, true);
        $.ajax({
            url: '/api/list',
            type: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({ dir: '/' }),
            success: function(res) {
                if (res.success) {
                    $tree.empty();
                    renderTreeItems(res.files || [], $tree, '/');
                }
            },
            complete: function() { setLoading($tree, false); }
        });
        return;
    }
    const $item = $(`.tree-item[data-path="${path}"]`);
    if ($item.length === 0) return;
    const $children = $item.find('.tree-children').first();
    const $row = $item.children('.tree-row').first();
    $children.empty();
    setLoading($row, true);
    $.ajax({
        url: '/api/list',
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({ dir: path }),
        success: function(res) {
            if (res.success) {
                renderTreeItems(res.files || [], $children, path);
            }
        },
        complete: function() { setLoading($row, false); }
    });
}
export function createNewFile(path, name) {
    const fullPath = (path === '/' ? '' : path) + '/' + name;
    return withLoading(folderTarget(path), api('write_file', { file: fullPath, content: '' }))
    .then(() => {
        showToast('File created');
        expandAndRefreshFolder(path);
        openFile(fullPath, name);
    })
    .catch(err => showToast(err.message || 'Failed to create file', 'danger'));
}
export function createNewFolder(path, name) {
    const fullPath = (path === '/' ? '' : path) + '/' + name;
    return withLoading(folderTarget(path), api('create_dir', { dir: fullPath }))
    .then(() => {
        showToast('Folder created');
        expandAndRefreshFolder(path);
    })
    .catch(err => showToast(err.message || 'Failed to create folder', 'danger'));
}
export function renameItem(path, newName, isDir) {
    const parent = getParentPath(path);
    const newPath = (parent === '/' ? '' : parent) + '/' + newName;
    return withLoading(treeRow(path), api('rename', { old: path, new: newPath }))
    .then(() => {
        showToast('Renamed successfully');
        expandAndRefreshFolder(parent);
        if (!isDir) {
            const tab = state.openTabs.find(t => t.path === path);
            if (tab) {
                tab.path = newPath;
                tab.name = newName;
                if (tab.model) {
                    try {
                        const langId = newName.split('.').pop().toLowerCase();
                        const langMap = {'js':'javascript','json':'json','ts':'typescript','html':'html','css':'css','php':'php','py':'python','md':'markdown','sql':'sql','xml':'xml','yml':'yaml','yaml':'yaml'};
                        monaco.editor.setModelLanguage(tab.model, langMap[langId] || 'plaintext');
                    } catch(e) {}
                }
                renderTabs();
            }
            if (state.currentOpenedFile === path) {
                state.currentOpenedFile = newPath;
            }
        }
    })
    .catch(err => showToast(err.message || 'Rename failed', 'danger'));
}
export function deleteItem(path, isDir) {
    const itemType = isDir ? 'folder' : 'file';
    showConfirmModal(
        `Delete ${isDir ? 'Folder' : 'File'}`,
        `Are you sure you want to delete this ${itemType} "${path}"?`,
        'Delete',
        'btn-danger',
        function() {
            const parent = getParentPath(path);
            return withLoading(treeRow(path), api('delete', { path: path, isDir: !!isDir }))
            .then(() => {
                expandAndRefreshFolder(parent);
                if (isDir) {
                    const prefix = path.endsWith('/') ? path : path + '/';
                    state.openTabs.filter(t => t.path.startsWith(prefix)).forEach(t => closeTab(t.path));
                } else {
                    closeTab(path);
                }
                showToast('Deleted successfully');
            })
            .catch(err => showToast(err.message || 'Delete failed', 'danger'));
        }
    );
}

export function moveItem(sourcePath, destFolder, isDir) {
    if (sourcePath === destFolder) return;
    const name = sourcePath.split('/').pop();
    const sourceParent = getParentPath(sourcePath);
    if (sourceParent === destFolder) return;
    if (isDir && (destFolder === sourcePath || destFolder.startsWith(sourcePath + '/'))) {
        showToast('Cannot move a folder inside itself', 'danger');
        return;
    }
    const newPath = (destFolder === '/' ? '' : destFolder) + '/' + name;
    const $targets = treeRow(sourcePath).add(folderTarget(destFolder));
    return withLoading($targets, api('rename', { old: sourcePath, new: newPath }))
    .then(() => {
        showToast('Moved successfully');
        expandAndRefreshFolder(sourceParent);
        expandAndRefreshFolder(destFolder);
        if (!isDir) {
            const tab = state.openTabs.find(t => t.path === sourcePath);
            if (tab) {
                tab.path = newPath;
                if (state.currentOpenedFile === sourcePath) {
                    state.currentOpenedFile = newPath;
                }
                renderTabs();
            }
        }
    })
    .catch(err => showToast(err.message || 'Error moving item', 'danger'));
}

export function uploadFiles(files, destFolder) {
    if (!files || files.length === 0) return;
    const formData = new FormData();
    formData.append('dir', destFolder);
    for (let i = 0; i < files.length; i++) {
        formData.append('files[]', files[i]);
    }
    showToast(`Uploading ${files.length} file(s)...`, 'info');
    const $target = folderTarget(destFolder);
    setLoading($target, true);
    $.ajax({
        url: '/api/upload',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(res) {
            if (res.success) {
                showToast('Uploaded successfully', 'success');
                expandAndRefreshFolder(destFolder);
            } else {
                showToast(res.error || 'Upload failed', 'danger');
            }
        },
        error: function(xhr) {
            let msg = 'Upload failed';
            try { msg = JSON.parse(xhr.responseText).error || msg; } catch(e) {}
            showToast(msg, 'danger');
        },
        complete: function() { setLoading($target, false); }
    });
}

$(document).ready(function() {
    const $fileList = $('#fileList');
    $fileList.on('dragover', function(e) {
        e.preventDefault();
        $fileList.addClass('drag-hover');
    });
    $fileList.on('dragleave', function(e) {
        $fileList.removeClass('drag-hover');
    });
    $fileList.on('drop', function(e) {
        e.preventDefault();
        $fileList.removeClass('drag-hover');
        if ($(e.target).closest('.folder-item').length > 0) {
            return;
        }
        const files = e.originalEvent.dataTransfer.files;
        const destFolder = state.currentPath || '/';
        if (files && files.length > 0) {
            uploadFiles(files, destFolder);
        } else {
            const sourcePath = e.originalEvent.dataTransfer.getData('text/plain');
            const itemType = e.originalEvent.dataTransfer.getData('item-type');
            if (!sourcePath) return;
            moveItem(sourcePath, destFolder, itemType === 'dir');
        }
    });
});