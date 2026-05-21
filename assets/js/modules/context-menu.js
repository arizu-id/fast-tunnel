import { state } from './state.js';
import { selectItem, getParentPath } from './helpers.js';
import { promptInput } from './ui.js';
import { toggleFolder, expandAndRefreshFolder, createNewFile, createNewFolder, renameItem, deleteItem } from './ftp.js';
import { openFile } from './editor.js';
import { editSession, deleteSession, exportSingleSession } from './sessions.js';

export function ctxIcon(biClass, extraClass) {
    const cls = extraClass ? ` ${extraClass}` : '';
    return `<i class="bi ${biClass} ctx-menu-icon${cls}"></i>`;
}

export function initContextMenu() {
    if (typeof $.contextMenu !== 'function') return;

    $.contextMenu({
        selector: '.tree-item',
        build: function($trigger, e) {
            const path = $trigger.attr('data-path');
            const name = path ? path.split('/').pop() : '';
            const isDir = $trigger.attr('data-is-dir') === 'true' || $trigger.hasClass('folder-item');
            selectItem(path, isDir);
            const items = {};
            if (isDir) {
                items.open = {
                    name: `${ctxIcon('bi-folder2-open')} ${window.__ft_translate('open_folder', 'Open Folder')}`,
                    isHtmlName: true,
                    callback: function() {
                        const $children = $trigger.find('.tree-children').first();
                        toggleFolder(path, $trigger, $children);
                    }
                };
                items.new_file = {
                    name: `${ctxIcon('bi-file-earmark-plus')} ${window.__ft_translate('new_file', 'New File')}`,
                    isHtmlName: true,
                    callback: function() {
                        promptInput('New File Name:', function(n) { createNewFile(path, n); });
                    }
                };
                items.new_folder = {
                    name: `${ctxIcon('bi-folder-plus')} ${window.__ft_translate('new_folder', 'New Folder')}`,
                    isHtmlName: true,
                    callback: function() {
                        promptInput('New Folder Name:', function(n) { createNewFolder(path, n); });
                    }
                };
                items.upload_file = {
                    name: `${ctxIcon('bi-upload')} ${window.__ft_translate('upload_file', 'Upload File')}`,
                    isHtmlName: true,
                    callback: function() {
                        state.uploadDestFolder = path;
                        $('#fileUploadInput').trigger('click');
                    }
                };
                items.refresh = {
                    name: `${ctxIcon('bi-arrow-clockwise')} ${window.__ft_translate('refresh', 'Refresh')}`,
                    isHtmlName: true,
                    callback: function() { expandAndRefreshFolder(path); }
                };
            } else {
                items.open = {
                    name: `${ctxIcon('bi-pencil-square')} ${window.__ft_translate('open_file', 'Open File')}`,
                    isHtmlName: true,
                    callback: function() { openFile(path, name); }
                };
                items.upload_file = {
                    name: `${ctxIcon('bi-upload')} ${window.__ft_translate('upload_file', 'Upload File')}`,
                    isHtmlName: true,
                    callback: function() {
                        state.uploadDestFolder = getParentPath(path);
                        $('#fileUploadInput').trigger('click');
                    }
                };
            }
            items.rename = {
                name: `${ctxIcon('bi-pen')} ${window.__ft_translate('rename', 'Rename')}`,
                isHtmlName: true,
                callback: function() {
                    promptInput('New Name:', function(newName) {
                        renameItem(path, newName, isDir);
                    });
                }
            };
            items.sep1 = '--------';
            items.delete = {
                name: `${ctxIcon('bi-trash3', 'text-danger')} <span style="color:#f87171;">${window.__ft_translate('delete', 'Delete')}</span>`,
                isHtmlName: true,
                className: 'ctx-item-delete',
                callback: function() { deleteItem(path, isDir); }
            };
            return { items };
        }
    });

    $.contextMenu({
        selector: '.file-explorer',
        build: function($trigger, e) {
            if ($(e.target).closest('.tree-item').length > 0) {
                return false;
            }
            return {
                items: {
                    new_file: {
                        name: `${ctxIcon('bi-file-earmark-plus')} ${window.__ft_translate('new_file', 'New File')}`,
                        isHtmlName: true,
                        callback: function() {
                            const path = state.selectedPath || '/';
                            promptInput('New File Name:', function(n) { createNewFile(path, n); });
                        }
                    },
                    new_folder: {
                        name: `${ctxIcon('bi-folder-plus')} ${window.__ft_translate('new_folder', 'New Folder')}`,
                        isHtmlName: true,
                        callback: function() {
                            const path = state.selectedPath || '/';
                            promptInput('New Folder Name:', function(n) { createNewFolder(path, n); });
                        }
                    },
                    upload_file: {
                        name: `${ctxIcon('bi-upload')} ${window.__ft_translate('upload_file', 'Upload File')}`,
                        isHtmlName: true,
                        callback: function() {
                            state.uploadDestFolder = state.currentPath || '/';
                            $('#fileUploadInput').trigger('click');
                        }
                    },
                    sep1: '--------',
                    refresh: {
                        name: `${ctxIcon('bi-arrow-clockwise')} ${window.__ft_translate('refresh', 'Refresh')}`,
                        isHtmlName: true,
                        callback: function() { expandAndRefreshFolder(state.currentPath || '/'); }
                    }
                }
            };
        }
    });

    $.contextMenu({
        selector: '.session-item',
        build: function($trigger, e) {
            const id = $trigger.attr('data-id');
            return {
                items: {
                    connect: {
                        name: `${ctxIcon('bi-link-45deg')} ${window.__ft_translate('connect', 'Connect')}`,
                        isHtmlName: true,
                        callback: function() {
                            $trigger.click();
                        }
                    },
                    edit: {
                        name: `${ctxIcon('bi-pencil-square')} ${window.__ft_translate('edit', 'Edit')}`,
                        isHtmlName: true,
                        callback: function() {
                            editSession(id);
                        }
                    },
                    export: {
                        name: `${ctxIcon('bi-box-arrow-up')} ${window.__ft_translate('export', 'Export')}`,
                        isHtmlName: true,
                        callback: function() {
                            exportSingleSession(id);
                        }
                    },
                    sep1: '--------',
                    delete: {
                        name: `${ctxIcon('bi-trash3', 'text-danger')} <span style="color:#f87171;">${window.__ft_translate('delete', 'Delete')}</span>`,
                        isHtmlName: true,
                        className: 'ctx-item-delete',
                        callback: function() {
                            deleteSession(id);
                        }
                    }
                }
            };
        }
    });
}