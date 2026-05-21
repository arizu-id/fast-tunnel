import { state } from './state.js';
import { showToast } from './ui.js';
let currentDb = '';
let currentTable = '';
let currentPage = 1;
const limit = 50;
export function connectMysql(sessionId, session) {
    state.currentSessionId = sessionId;
    state.currentProtocol = 'mysql';
    const password = session.password ? atob(session.password) : '';
    showToast('Connecting to MySQL...', 'info');
    fetch('api.php?action=mysql_connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            host: session.host,
            port: session.port,
            user: session.user,
            password: password,
            db_name: session.db_name || ''
        })
    })
    .then(r => {
        if (!r.ok) return r.json().then(e => { throw new Error(e.error || 'Connection failed'); });
        return r.json();
    })
    .then(res => {
        showToast('Connected to MySQL successfully');
        $('#connectionStatus').html(`<span class="text-success"><i class="bi bi-link-45deg me-2 fs-5"></i>Connected to ${session.name}</span>`);
        $('#welcomeArea').addClass('d-none');
        $('#workspaceArea').removeClass('d-none');
        $('#ftpSidebar').addClass('d-none');
        $('#sshSidebar').addClass('d-none').removeClass('d-flex');
        $('#dbSidebar').removeClass('d-none');
        setupDbSidebar(res.databases, res.db_name);
        if (res.db_name) {
            currentDb = res.db_name;
            renderTables(res.tables);
        } else {
            currentDb = '';
            $('#dbTableList').empty();
        }
        setupDbWorkspace();
    })
    .catch(err => {
        showToast(err.message || 'Connection failed', 'danger');
        $('#connectionStatus').html(`<span class="text-danger"><i class="bi bi-x-circle me-2"></i>${err.message}</span>`);
        state.currentProtocol = null;
    });
}
function setupDbSidebar(databases, selectedDb) {
    const $dbSelect = $('#dbDatabaseSelect');
    $dbSelect.empty();
    if (!databases || databases.length === 0) {
        $dbSelect.append('<option value="">No databases</option>');
    } else {
        databases.forEach(db => {
            const opt = $(`<option value="${db}">${db}</option>`);
            if (db === selectedDb) opt.prop('selected', true);
            $dbSelect.append(opt);
        });
    }
    $dbSelect.off('change').on('change', function() {
        const db = $(this).val();
        if (db) selectDatabase(db);
    });
}
function selectDatabase(db) {
    currentDb = db;
    currentTable = '';
    fetch('api.php?action=mysql_select_db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ db_name: db })
    })
    .then(r => r.json())
    .then(res => {
        if (res.success) {
            renderTables(res.tables);
        } else {
            showToast(res.error || 'Failed to select database', 'danger');
        }
    })
    .catch(() => showToast('Failed to select database', 'danger'));
}
function renderTables(tables) {
    const $list = $('#dbTableList');
    $list.empty();
    if (!tables || tables.length === 0) {
        $list.append('<div class="text-muted small text-center p-3 opacity-50">No tables found</div>');
        return;
    }
    tables.forEach(table => {
        const $item = $(`
            <div class="db-table-item d-flex align-items-center" data-table="${table}">
                <i class="bi bi-table me-2 text-info"></i>
                <span class="text-truncate">${table}</span>
            </div>
        `);
        $item.click(function() {
            $('.db-table-item').removeClass('active');
            $(this).addClass('active');
            currentTable = table;
            currentPage = 1;
            browseTable(table, 1);
        });
        $list.append($item);
    });
}
function setupDbWorkspace() {
    $('.db-tab-btn').off('click').on('click', function() {
        const tab = $(this).data('tab');
        $('.db-tab-btn').removeClass('active');
        $(this).addClass('active');
        if (tab === 'browse' && currentTable) {
            browseTable(currentTable, currentPage);
        } else if (tab === 'structure' && currentTable) {
            loadTableStructure(currentTable);
        } else if (tab === 'query') {
            showQueryEditor();
        }
    });
    $('#btnRunQuery').off('click').on('click', runQuery);
}
function browseTable(table, page) {
    currentTable = table;
    currentPage = page;
    const $area = $('#dbContentArea');
    $area.html('<div class="d-flex justify-content-center p-5"><div class="spinner-border text-primary"></div></div>');
    fetch('api.php?action=mysql_browse_table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: table, page: page, limit: limit })
    })
    .then(r => r.json())
    .then(data => {
        if (!data.success) {
            $area.html(`<div class="text-danger p-3">${data.error || 'Error loading table'}</div>`);
            return;
        }
        renderTableData($area, data, table);
    })
    .catch(() => {
        $area.html('<div class="text-danger p-3">Failed to load table data</div>');
    });
}
function renderTableData($area, data, tableName) {
    const cols = data.columns || [];
    const rows = data.rows || [];
    const total = data.total || 0;
    const totalPages = Math.ceil(total / limit);
    let headerHtml = '<th style="width:40px;"></th>';
    cols.forEach(col => {
        headerHtml += `<th class="text-nowrap" style="font-size:0.8rem;">${col}</th>`;
    });
    let bodyHtml = '';
    if (rows.length === 0) {
        bodyHtml = `<tr><td colspan="${cols.length + 1}" class="text-center text-muted p-4">Empty result set</td></tr>`;
    } else {
        rows.forEach((row, ri) => {
            bodyHtml += '<tr>';
            bodyHtml += `<td class="text-center"><input type="checkbox" class="form-check-input db-row-check" data-row="${ri}"></td>`;
            cols.forEach(col => {
                const val = row[col];
                const display = val === null ? '<em class="text-muted" style="opacity:.5;">NULL</em>' : $('<div>').text(String(val)).html();
                bodyHtml += `<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.83rem;" data-col="${col}" data-raw="${val === null ? '' : String(val).replace(/"/g,'&quot;')}">${display}</td>`;
            });
            bodyHtml += '</tr>';
        });
    }
    let paginationHtml = '';
    if (totalPages > 1) {
        const prevDis = currentPage === 1 ? 'disabled' : '';
        const nextDis = currentPage === totalPages ? 'disabled' : '';
        paginationHtml = `
            <div class="d-flex align-items-center gap-2">
                <button class="btn btn-sm btn-outline-secondary px-2 py-1 db-prev-page" ${prevDis}><i class="bi bi-chevron-left"></i></button>
                <span class="text-muted" style="font-size:0.8rem;">Page ${currentPage} / ${totalPages} &nbsp;(${total} rows)</span>
                <button class="btn btn-sm btn-outline-secondary px-2 py-1 db-next-page" ${nextDis}><i class="bi bi-chevron-right"></i></button>
            </div>
        `;
    } else {
        paginationHtml = `<span class="text-muted" style="font-size:0.8rem;">${total} row${total !== 1 ? 's' : ''}</span>`;
    }
    $area.html(`
        <div class="d-flex justify-content-between align-items-center mb-2 px-1">
            <span class="text-muted" style="font-size:0.78rem;text-transform:uppercase;letter-spacing:.4px;">${tableName}</span>
            ${paginationHtml}
        </div>
        <div class="db-table-scroll">
            <table class="table table-sm table-hover table-dark db-data-table mb-0">
                <thead><tr>${headerHtml}</tr></thead>
                <tbody>${bodyHtml}</tbody>
            </table>
        </div>
    `);
    $area.find('.db-prev-page').click(() => browseTable(tableName, currentPage - 1));
    $area.find('.db-next-page').click(() => browseTable(tableName, currentPage + 1));
}
function loadTableStructure(table) {
    const $area = $('#dbContentArea');
    $area.html('<div class="d-flex justify-content-center p-5"><div class="spinner-border text-primary"></div></div>');
    fetch('api.php?action=mysql_table_structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: table })
    })
    .then(r => r.json())
    .then(data => {
        if (!data.success) {
            $area.html(`<div class="text-danger p-3">${data.error || 'Error'}</div>`);
            return;
        }
        const cols = data.columns || [];
        let rows = '';
        cols.forEach(col => {
            rows += `<tr>
                <td>${col.Field}</td>
                <td><code>${col.Type}</code></td>
                <td>${col.Null}</td>
                <td>${col.Key || ''}</td>
                <td>${col.Default !== null ? col.Default : '<em class="text-muted">NULL</em>'}</td>
                <td>${col.Extra || ''}</td>
            </tr>`;
        });
        $area.html(`
            <div class="text-muted mb-2 px-1" style="font-size:0.78rem;text-transform:uppercase;letter-spacing:.4px;">Structure: ${table}</div>
            <div class="db-table-scroll">
                <table class="table table-sm table-hover table-dark mb-0">
                    <thead><tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `);
    })
    .catch(() => $area.html('<div class="text-danger p-3">Failed to load structure</div>'));
}
function showQueryEditor() {
    const $area = $('#dbContentArea');
    $area.html(`
        <div class="p-2">
            <textarea id="dbQueryInput" class="form-control bg-dark text-light mb-2" rows="5" placeholder="SELECT * FROM table_name LIMIT 100;" style="font-family:monospace;font-size:0.9rem;border-color:#3f3f46;"></textarea>
            <button class="btn btn-sm btn-primary" id="btnRunQuery"><i class="bi bi-play-fill me-1"></i>Run Query</button>
        </div>
        <div id="dbQueryResult" class="mt-2"></div>
    `);
    $('#btnRunQuery').off('click').on('click', runQuery);
}
function runQuery() {
    const sql = $('#dbQueryInput').val().trim();
    if (!sql) return;
    const $result = $('#dbQueryResult');
    $result.html('<div class="d-flex justify-content-center p-3"><div class="spinner-border spinner-border-sm text-primary"></div></div>');
    fetch('api.php?action=mysql_query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sql, db_name: currentDb })
    })
    .then(r => r.json())
    .then(data => {
        if (!data.success) {
            $result.html(`<div class="alert alert-danger m-2" style="font-size:0.85rem;">${data.error || 'Query error'}</div>`);
            return;
        }
        if (data.rows) {
            const cols = data.columns || [];
            let headerHtml = cols.map(c => `<th>${c}</th>`).join('');
            let bodyHtml = '';
            if (data.rows.length === 0) {
                bodyHtml = `<tr><td colspan="${cols.length}" class="text-center text-muted p-3">Empty result</td></tr>`;
            } else {
                data.rows.forEach(row => {
                    bodyHtml += '<tr>' + cols.map(col => {
                        const v = row[col];
                        return `<td style="font-size:0.83rem;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${v === null ? '<em class="text-muted">NULL</em>' : $('<div>').text(String(v)).html()}</td>`;
                    }).join('') + '</tr>';
                });
            }
            $result.html(`
                <div class="db-table-scroll">
                    <table class="table table-sm table-hover table-dark mb-0">
                        <thead><tr>${headerHtml}</tr></thead>
                        <tbody>${bodyHtml}</tbody>
                    </table>
                </div>
                <div class="text-muted p-2" style="font-size:0.78rem;">${data.rows.length} row(s) returned</div>
            `);
        } else {
            $result.html(`<div class="alert alert-success m-2" style="font-size:0.85rem;">${data.affected_rows || 0} row(s) affected</div>`);
        }
    })
    .catch(() => $result.html('<div class="alert alert-danger m-2">Query failed</div>'));
}