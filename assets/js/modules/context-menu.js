import { state } from './state.js';
import { selectItem } from './helpers.js';
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
                    name: `${ctxIcon('bi-folder2-open')} Open Folder`,
                    isHtmlName: true,
                    callback: function() {
                        const $children = $trigger.find('.tree-children').first();
                        toggleFolder(path, $trigger, $children);
                    }
                };
                items.new_file = {
                    name: `${ctxIcon('bi-file-earmark-plus')} New File`,
                    isHtmlName: true,
                    callback: function() {
                        promptInput('New File Name:', function(n) { createNewFile(path, n); });
                    }
                };
                items.new_folder = {
                    name: `${ctxIcon('bi-folder-plus')} New Folder`,
                    isHtmlName: true,
                    callback: function() {
                        promptInput('New Folder Name:', function(n) { createNewFolder(path, n); });
                    }
                };
                items.refresh = {
                    name: `${ctxIcon('bi-arrow-clockwise')} Refresh`,
                    isHtmlName: true,
                    callback: function() { expandAndRefreshFolder(path); }
                };
            } else {
                items.open = {
                    name: `${ctxIcon('bi-pencil-square')} Open File`,
                    isHtmlName: true,
                    callback: function() { openFile(path, name); }
                };
            }
            items.rename = {
                name: `${ctxIcon('bi-pen')} Rename`,
                isHtmlName: true,
                callback: function() {
                    promptInput('New Name:', function(newName) {
                        renameItem(path, newName, isDir);
                    });
                }
            };
            items.sep1 = '--------';
            items.delete = {
                name: `${ctxIcon('bi-trash3', 'text-danger')} <span style="color:#f87171;">Delete</span>`,
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
                        name: `${ctxIcon('bi-file-earmark-plus')} New File`,
                        isHtmlName: true,
                        callback: function() {
                            const path = state.selectedPath || '/';
                            promptInput('New File Name:', function(n) { createNewFile(path, n); });
                        }
                    },
                    new_folder: {
                        name: `${ctxIcon('bi-folder-plus')} New Folder`,
                        isHtmlName: true,
                        callback: function() {
                            const path = state.selectedPath || '/';
                            promptInput('New Folder Name:', function(n) { createNewFolder(path, n); });
                        }
                    },
                    sep1: '--------',
                    refresh: {
                        name: `${ctxIcon('bi-arrow-clockwise')} Refresh`,
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
                        name: `${ctxIcon('bi-link-45deg')} Connect`,
                        isHtmlName: true,
                        callback: function() {
                            $trigger.click();
                        }
                    },
                    edit: {
                        name: `${ctxIcon('bi-pencil-square')} Edit`,
                        isHtmlName: true,
                        callback: function() {
                            editSession(id);
                        }
                    },
                    export: {
                        name: `${ctxIcon('bi-box-arrow-up')} Export`,
                        isHtmlName: true,
                        callback: function() {
                            exportSingleSession(id);
                        }
                    },
                    sep1: '--------',
                    delete: {
                        name: `${ctxIcon('bi-trash3', 'text-danger')} <span style="color:#f87171;">Delete</span>`,
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