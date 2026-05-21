export const dbState = {
    currentDb: '',
    currentBrowseTable: '',
    currentBrowsePage: 1,
    currentBrowseLimit: 50,
    currentBrowseTotalRows: 0,
    allBrowseRows: [],
    confirmCallback: null,
};
export function formatBytes(bytes) {
    if (!bytes || isNaN(bytes)) return '—';
    const b = parseInt(bytes);
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KiB';
    return (b / 1024 / 1024).toFixed(2) + ' MiB';
}
export function escapeHtml(text) {
    if (text === null || text === undefined) return '<em class="text-muted">NULL</em>';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
export function switchDbTab(tab) {
    $('.db-tab-btn').removeClass('active');
    $(`.db-tab-btn[data-tab="${tab}"]`).addClass('active');
    $('.db-tab-pane').addClass('d-none');
    $(`#dbPane${tab.charAt(0).toUpperCase() + tab.slice(1)}`).removeClass('d-none');
}
export function showDbConfirm(title, message, onConfirm) {
    dbState.confirmCallback = onConfirm;
    $('#dbConfirmTitle').text(title);
    $('#dbConfirmBody').html(message);
    const modal = new bootstrap.Modal(document.getElementById('dbConfirmModal'));
    modal.show();
}
export function setActiveTable(tableName) {
    dbState.currentBrowseTable = tableName;
    $('#dbActiveTableName').text(tableName);
    $('#dbActiveTableBadge').show();
}