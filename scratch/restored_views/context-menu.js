import { state } from './state.js';
import { selectItem } from './helpers.js';
import { promptInput } from './ui.js';
import { toggleFolder, loadRoot, downloadFile, createNewFile, createNewFolder, renameItem, deleteItem } from './ftp.js';
import { openFile } from './editor.js';

export function ctxIcon(biClass, extraClass) {
    const cls = extraClass ? ` ${extraClass}` : '';
    return `<i class="bi ${biClass} ctx-menu-icon${cls}"></i>`;
}

export function initContextMenu() {
    $.contextMenu({
        selector: '.tree-item',
        isHtmlName: true,
        build: function($trigger, e) {
            const path   = $trigger.attr('data-path');
            const name   = $trigger.attr('data-name');
            const isDir  = $trigger.attr('data-isdir') === 'true';

            selectItem(path, isDir);

            const openIcon = isDir ? 'bi-folder2-open' : 'bi-pencil-square';
            const openLabel = isDir ? 'Open Folder' : 'Open File';

            const items = {
                open: {
                    name: `${ctxIcon(openIcon)} ${openLabel}`,
                    callback: function() {
                        if (isDir) {
                            toggleFolder(path, $trigger, $trigger.next('.folder-children'));
                        } else {
                            openFile(path, name);
                        }
                    }
                },
                rename: {
       
                    callback: function() { renameItem(path, name); }
                    callback: function() { downloadFile(path, name); }
                };
            }

            items.sep1 = '--------';
            items.delete = {
                name: `${ctxIcon('bi-trash3', 'text-danger')} <span style="color:#f87171;">Delete</span>`,
                className: 'ctx-item-delete',
                callback: function() { deleteItem(path, isDir); }
            };

            return { items };
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

                }
            };
        }
    });
}
