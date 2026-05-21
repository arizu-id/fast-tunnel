import { state } from './state.js';
import { selectItem, getParentPath } from './helpers.js';
import { showToast, showConfirmModal, promptInput } from './ui.js';
import { openFile, closeTab, getFileIconClass, renderTabs, switchTab } from './editor.js';
export function connectSession(id, sessionData) {
    state.currentProtocol = 'ftp';
    $('#connectionStatus').html(`<span class="text-info"><i class="bi bi-arrow-repeat spin me-2 d-inline-block"></i>Connecting to ${sessionData.name}...</span>`);
    $.ajax({
        url: 'api.php?action=ftp_connect',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            host: sessionData.host,
            port: sessionData.port,
            user: sessionData.user,
            password: atob(sessionData.password),
            use_proxy: sessionData.use_proxy || false,
            proxy_host: sessionData.proxy_host || '',
            proxy_port: sessionData.proxy_port || 0,
            proxy_type: sessionData.proxy_type || '',
            proxy_user: sessionData.proxy_user || '',
            proxy_password: sessionData.proxy_password ? atob(sessionData.proxy_password) : ''
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
                loadRoot();
            } else {
                showToast(res.error || 'Connection failed', 'danger');
                $('#connectionStatus').html(`<span class="text-danger"><i class="bi bi-x-circle me-2"></i>${res.error || 'Connection failed'}</span>`);
            }
        },
        error: function() {
            showToast('Connection error', 'danger');
            $('#connectionStatus').html('<span class="text-danger"><i class="bi bi-x-circle me-2"></i>Connection error</span>');
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
    $('#fileTree').empty();
}
function loadRoot() {
    $.ajax({
        url: 'api.php?action=ftp_list',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ path: '/' }),
        success: function(res) {
            if (res.success) {
                const $tree = $('#fileTree');
                $tree.empty();
                state.currentPath = '/';
                renderTreeItems(res.items, $tree, '/');
            } else {
                showToast(res.error || 'Failed to load files', 'danger');
            }
        }
    });
}
function renderTreeItems(items, $container, parentPath) {
    if (!items || items.length === 0) {
        $container.append('<div class="tree-empty text-muted small ps-2 opacity-50">Empty</div>');
        return;
    }
    const sorted = [...items].sort((a, b) => {
        if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
        return a.name.localeCompare(b.name);
    });
    sorted.forEach(item => {
        const fullPath = (parentPath === '/' ? '' : parentPath) + '/' + item.name;
        if (item.isDir) {
            const $item = $(`
                <div class="tree-item folder-item" data-path="${fullPath}" data-expanded="false">
                    <div class="tree-row d-flex align-items-center">
                        <span class="chevron-icon me-1"><i class="bi bi-chevron-right"></i></span>
                        <i class="bi bi-folder2 me-2 text-warning"></i>
                        <span class="item-name text-truncate">${item.name}</span>
                    </div>
                    <div class="tree-children d-none ps-3"></div>
                </div>
            `);
            const $row = $item.find('.tree-row');
            const $children = $item.find('.tree-children');
            $row.click(function(e) {
                e.stopPropagation();
                selectItem(fullPath, true);
                toggleFolder(fullPath, $item, $children);
            });
            $container.append($item);
        } else {
            const iconClass = getFileIconClass(item.name);
            const $item = $(`
                <div class="tree-item file-item" data-path="${fullPath}" data-is-dir="false">
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
            $container.append($item);
        }
    });
}
export function toggleFolder(path, $item, $children) {
    const isExpanded = $item.attr('data-expanded') === 'true';
    const $chevron = $item.find('.chevron-icon i').first();
    if (isExpanded) {
        $item.attr('data-expanded', 'false');
        $chevron.removeClass('bi-chevron-down').addClass('bi-chevron-right');
        $children.slideUp(150);
    } else {
        $item.attr('data-expanded', 'true');
        $chevron.removeClass('bi-chevron-right').addClass('bi-chevron-down');
        $children.slideDown(150);
        if ($children.children().length === 0) {
            $children.html('<div class="text-muted small ps-2 py-1 opacity-50"><i class="bi bi-arrow-repeat spin me-1"></i>Loading...</div>');
            $.ajax({
                url: 'api.php?action=ftp_list',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ path: path }),
                success: function(res) {
                    $children.empty();
                    if (res.success) {
                        renderTreeItems(res.items, $children, path);
                    } else {
                        $children.html(`<div class="text-danger small ps-2 opacity-75">${res.error || 'Error'}</div>`);
                    }
                },
                error: function() {
                    $children.html('<div class="text-danger small ps-2 opacity-75">Load failed</div>');
                }
            });
        }
    }
}
export function expandAndRefreshFolder(path) {
    const $item = $(`.tree-item[data-path="${path}"]`);
    if ($item.length === 0) return;
    const $children = $item.find('.tree-children').first();
    $children.empty();
    $.ajax({
        url: 'api.php?action=ftp_list',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ path: path }),
        success: function(res) {
            if (res.success) {
                renderTreeItems(res.items, $children, path);
            }
        }
    });
}
export function createNewFile(path, name) {
    const fullPath = (path === '/' ? '' : path) + '/' + name;
    $.ajax({
        url: 'api.php?action=ftp_create_file',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ path: fullPath }),
        success: function(res) {
            if (res.success) {
                showToast('File created');
                expandAndRefreshFolder(path);
                openFile(fullPath, name);
            } else {
                showToast(res.error || 'Failed to create file', 'danger');
            }
        }
    });
}
export function createNewFolder(path, name) {
    const fullPath = (path === '/' ? '' : path) + '/' + name;
    $.ajax({
        url: 'api.php?action=ftp_mkdir',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ path: fullPath }),
        success: function(res) {
            if (res.success) {
                showToast('Folder created');
                expandAndRefreshFolder(path);
            } else {
                showToast(res.error || 'Failed to create folder', 'danger');
            }
        }
    });
}
export function renameItem(path, newName, isDir) {
    const parent = getParentPath(path);
    const newPath = (parent === '/' ? '' : parent) + '/' + newName;
    $.ajax({
        url: 'api.php?action=ftp_rename',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ from: path, to: newPath }),
        success: function(res) {
            if (res.success) {
                showToast('Renamed successfully');
                expandAndRefreshFolder(parent);
                const oldPath = path;
                if (!isDir) {
                    const tab = state.openTabs.find(t => t.path === oldPath);
                    if (tab) {
                        tab.path = newPath;
                        tab.name = newName;
                        if (tab.model) {
                            const newLang = getFileIconClass ? newName : newName;
                            try {
                                const langId = newName.split('.').pop().toLowerCase();
                                const langMap = {'js':'javascript','json':'json','ts':'typescript','html':'html','css':'css','php':'php','py':'python','md':'markdown','sql':'sql','xml':'xml','yml':'yaml','yaml':'yaml'};
                                monaco.editor.setModelLanguage(tab.model, langMap[langId] || 'plaintext');
                            } catch(e) {}
                        }
                        renderTabs();
                    }
                    if (state.currentOpenedFile === oldPath) {
                        state.currentOpenedFile = newPath;
                    }
                }
            } else {
                showToast(res.error || 'Rename failed', 'danger');
            }
        }
    });
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
            $.ajax({
                url: 'api.php?action=ftp_delete',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ path: path, isDir: isDir }),
                success: function(res) {
                    if (res.success) {
                        expandAndRefreshFolder(parent);
                        if (isDir) {
                            const prefix = path.endsWith('/') ? path : path + '/';
                            const tabsToClose = state.openTabs.filter(t => t.path.startsWith(prefix));
                            tabsToClose.forEach(t => closeTab(t.path));
                        } else {
                            closeTab(path);
                        }
                        showToast('Deleted successfully');
                    } else {
                        showToast(res.error || 'Delete failed', 'danger');
                    }
                }
            });
        }
    );
}