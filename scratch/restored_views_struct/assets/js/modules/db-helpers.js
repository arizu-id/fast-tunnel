// db-helpers.js — Shared state and utility functions for database module

// ─── Shared State ────────────────────────────────────────────────────────────
export const dbState = {
    currentDb: '',
    currentBrowseTable: '',
    currentBrowsePage: 1,
    currentBrowseLimit: 50,
    currentBrowseTotalRows: 0,
    allBrowseRows: [],
    confirmCallback: null,
};

// ─── Utilities ───────────────────────────────────────────────────────────────

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
    // Hide all panes — also strip any display class added previously
    $('.db-tab-pane').addClass('d-none').removeClass('d-flex');
    const $pane = $(`#dbPane${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
    $pane.removeClass('d-none');
    // Browse pane is a flex column — restore d-flex so children stretch correctly
    if (tab === 'browse') $pane.addClass('d-flex');
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
