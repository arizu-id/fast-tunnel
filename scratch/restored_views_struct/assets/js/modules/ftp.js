import { state } from './state.js';
import { selectItem, getParentPath } from './helpers.js';
import { showToast, showConfirmModal, promptInput } from './ui.js';
import { openFile, closeTab, getFileIconClass, renderTabs, switchTab } from './editor.js';

export function connectSession(id, sessionData) {
    $('#connectionStatus').html(`<span class="text-info"><i class="bi bi-arrow-repeat spin me-2 d-inline-block"></i>Connecting to ${sessionData.name}...</span>`);

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
                state.currentSessionId = id;
                state.currentPath = res.pwd;
                state.selectedPath = '/';
                state.selectedIsDir = true;
                $('#currentPath').text('/').attr('title', '/');

                $('#connectionStatus').html(`<span class="text-success"><i class="bi bi-link-45deg me-2 fs-5"></i>Connected to ${sessionData.name}</span>`);
                $('#welcomeArea').addClass('d-none');
                $('#workspaceArea').removeClass('d-none');

                loadRoot();
            } else {
        
                        if (tab.model) {
                            const newLang = getLanguageFromExtension(newName);
                            monaco.editor.setModelLanguage(tab.model, newLang);
                        }
                        renderTabs();
                    }
                    if (state.currentOpenedFile === oldPath) {
                        state.currentOpenedFile = newPath;
                    }
                } else showToast(res.error, 'danger');
            }
        });
    });
}

export function deleteItem(path, isDir) {
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
                    } else showToast(res.error, 'danger');
                }
            });
        }
    );
}

    $('#workspaceArea').addClass('d-none');

    state.openTabs.forEach(tab => {
        if (tab.model) tab.model.dispose();
    });
    state.openTabs = [];
    state.currentOpenedFile = null;
    renderTabs();
    switchTab(null);
}

export function toggleFolder(path, $item, $children) {
    const isExpanded = $item.attr('data-expanded') === 'true';
    const $chevron = $item.find('.chevron-icon i');

    if (isExpanded) {
        $item.attr('data-expanded', 'false');
        $chevron.removeClass('bi-chevron-down').addClass('bi-chevron-right');
        $children.slideUp(150);


















































































































































































































                        if (tab.model) {
                            const newLang = getLanguageFromExtension(newName);
                            monaco.editor.setModelLanguage(tab.model, newLang);
                        }
                        renderTabs();
                    }
                    if (state.currentOpenedFile === oldPath) {
                        state.currentOpenedFile = newPath;
                    }
                } else showToast(res.error, 'danger');
            }
        });
    });
}

export function deleteItem(path, isDir) {
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
                    } else showToast(res.error, 'danger');
                }
            });
        }
    );
}
