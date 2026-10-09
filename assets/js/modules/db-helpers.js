import { finishModalAction } from './loading.js';
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
export function escapeAttr(text) {
    return String(text ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
export function switchDbTab(tab) {
    $('.db-tab-btn').removeClass('active');
    $(`.db-tab-btn[data-tab="${tab}"]`).addClass('active');
    $('.db-tab-pane').addClass('d-none');
    $(`#dbPane${tab.charAt(0).toUpperCase() + tab.slice(1)}`).removeClass('d-none');
}
export function showDbConfirm(title, message, onConfirm, opts = {}) {
    dbState.confirmCallback = onConfirm;
    $('#dbConfirmTitle').text(title);
    const $body = $('#dbConfirmBody').html(message);
    const $ok = $('#dbConfirmOk').prop('disabled', false);
    if (opts.typeName) {
        // Destructive action: require typing the exact name before OK is enabled
        const $wrap = $('<div class="mt-3"><label class="form-label small text-muted mb-1"></label>' +
            '<input type="text" class="form-control bg-darker border-secondary text-light shadow-none" autocomplete="off" spellcheck="false"></div>');
        $wrap.find('label').append('Type ', $('<code></code>').text(opts.typeName), ' to confirm');
        $wrap.find('input').on('input', function() {
            $ok.prop('disabled', $(this).val() !== opts.typeName);
        });
        $body.append($wrap);
        $ok.prop('disabled', true);
    }
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('dbConfirmModal'));
    modal.show();
}
export function setActiveTable(tableName) {
    dbState.currentBrowseTable = tableName;
    $('#dbActiveTableName').text(tableName);
    $('#dbActiveTableBadge').show();
}
$(document).on('click', '#dbConfirmOk', function() {
    const cb = dbState.confirmCallback;
    finishModalAction('dbConfirmModal', $(this), cb ? cb() : null);
});
