import { state } from './state.js';
export function getParentPath(path) {
    if (path === '/' || path === '') return '/';
    const parts = path.split('/');
    parts.pop();
    return parts.join('/') || '/';
}
export function selectItem(path, isDir) {
    state.selectedPath = path;
    state.selectedIsDir = isDir;
    $('.tree-item').removeClass('selected');
    $(`.tree-item[data-path="${CSS.escape(path)}"]`).addClass('selected');
    $('#currentPath').text(path).attr('title', path);
}
export function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}