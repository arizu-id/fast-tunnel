import { state } from './state.js';
import { showToast } from './ui.js';
import { escapeHtml, dbState, switchDbTab, showDbConfirm, setActiveTable, formatBytes } from './db-helpers.js';
let currentDb = '';
let currentTable = '';
let currentPage = 1;
const limit = 50;
export function connectMysql(sessionId, session) {
    if (state.isConnecting) {
        showToast('Connection in progress, please wait...', 'warning');
        return;
    }
    state.isConnecting = true;
    state.currentSessionId = sessionId;
    state.currentProtocol = 'mysql';
    const password = session.password ? atob(session.password) : '';
    showToast('Connecting to MySQL...', 'info');
    $('.session-item').addClass('pe-none opacity-50');
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
        $('#dbSidebar').removeClass('d-none').addClass('d-flex flex-column');
        $('#terminal-container').addClass('d-none').removeClass('d-flex');
        $('#monaco-container').addClass('d-none');
        $('#editorPlaceholder').addClass('d-none');
        $('#db-container').removeClass('d-none').addClass('d-flex');
        setupDbSidebar(res.databases, res.db_name);
        if (res.db_name) {
            currentDb = res.db_name;
            renderTables(res.tables);
        } else {
            currentDb = '';
            $('#dbTableList').empty();
        }
        setupDbWorkspace();
        state.isConnecting = false;
        $('.session-item').removeClass('pe-none opacity-50');
    })
    .catch(err => {
        showToast(err.message || 'Connection failed', 'danger');
        $('#connectionStatus').html(`<span class="text-danger"><i class="bi bi-x-circle me-2"></i>${err.message}</span>`);
        state.currentProtocol = null;
        state.isConnecting = false;
        $('.session-item').removeClass('pe-none opacity-50');
    });
}
function setupDbSidebar(databases, selectedDb) {
    const $dbSelect = $('#dbSelector');
    $dbSelect.empty().append('<option value="">-- Select Database --</option>');
    if (databases && databases.length > 0) {
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
    $('.btn-db-disconnect').off('click').on('click', () => {
        $('#workspaceArea').addClass('d-none');
        $('#welcomeArea').removeClass('d-none');
        $('#dbSidebar').addClass('d-none').removeClass('d-flex flex-column');
        $('#db-container').addClass('d-none').removeClass('d-flex');
        $('#connectionStatus').html('');
        state.currentSessionId = null;
        state.currentProtocol = null;
        showToast('Disconnected from MySQL');
    });
}
function selectDatabase(db) {
    currentDb = db;
    currentTable = '';
    fetch('api.php?action=mysql_list_tables', {
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
            setActiveTable(table);
            switchDbTab('browse');
            browseTable(table, 1);
        });
        $list.append($item);
    });
}
function setupDbWorkspace() {
    $('.db-tab-btn').off('click').on('click', function() {
        const tab = $(this).data('tab');
        switchDbTab(tab);
        if (tab === 'browse' && currentTable) {
            browseTable(currentTable, currentPage);
        } else if (tab === 'columns' && currentTable) {
            loadTableStructure(currentTable);
        }
    });
    $('#btnRunSql').off('click').on('click', runQuery);
    $('#btnRunSqlExplain').off('click').on('click', () => {
        const sql = $('#sqlQueryInput').val().trim();
        if (sql) {
            $('#sqlQueryInput').val('EXPLAIN ' + sql);
            runQuery();
        }
    });
    $('#btnClearSql').off('click').on('click', () => {
        $('#sqlQueryInput').val('');
        $('#sqlResultArea').html('<div class="text-center text-muted py-4"><i class="bi bi-terminal mb-2 opacity-25" style="font-size:2.5rem;display:block;"></i><span class="opacity-50">Run a query to see the output</span></div>');
    });
    $('#btnNewQuery').off('click').on('click', () => {
        switchDbTab('sql');
    });
    $('#btnRefreshStructure').off('click').on('click', () => {
        if (currentDb) selectDatabase(currentDb);
    });
}
function browseTable(table, page) {
    currentTable = table;
    currentPage = page;
    setActiveTable(table);
    $('#dbBrowsePlaceholder').addClass('d-none');
    $('#dbBrowseContent').removeClass('d-none');
    $('#dbBrowseTableTitle').text(table);
    const $thead = $('#dbBrowseThead');
    const $tbody = $('#dbBrowseTbody');
    $thead.empty();
    $tbody.html('<tr><td colspan="99" class="text-center p-4"><div class="spinner-border text-primary"></div></td></tr>');
    fetch('api.php?action=mysql_table_data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: table, page: page, limit: limit, db_name: currentDb })
    })
    .then(r => r.json())
    .then(data => {
        if (!data.success) {
            $tbody.html(`<tr><td colspan="99" class="text-danger p-3">${data.error || 'Error'}</td></tr>`);
            return;
        }
        const cols = data.columns || [];
        const rows = data.rows || [];
        const total = data.total || 0;
        const totalPages = Math.ceil(total / limit);
        let thHtml = '<tr style="background:#27272a;border-bottom:1px solid #3f3f46;">';
        thHtml += '<th class="px-3 py-2 text-center" style="width:40px;"><input type="checkbox" class="form-check-input" id="dbBrowseSelectAll"></th>';
        thHtml += '<th class="px-3 py-2" style="color:#a1a1aa;font-weight:600;font-size:.72rem;text-transform:uppercase;width:50px;">#</th>';
        cols.forEach(col => {
            thHtml += `<th class="px-3 py-2 text-nowrap" style="color:#a1a1aa;font-weight:600;font-size:.72rem;text-transform:uppercase;letter-spacing:.5px;">${col}</th>`;
        });
        thHtml += '</tr>';
        $thead.html(thHtml);
        if (rows.length === 0) {
            $tbody.html(`<tr><td colspan="${cols.length + 2}" class="text-center text-muted p-4">Empty result set</td></tr>`);
        } else {
            let bodyHtml = '';
            rows.forEach((row, ri) => {
                bodyHtml += '<tr>';
                bodyHtml += `<td class="px-3 py-2 text-center"><input type="checkbox" class="form-check-input db-row-check" data-row="${ri}"></td>`;
                bodyHtml += `<td class="px-3 py-2 text-muted" style="font-size:.78rem;">${(page - 1) * limit + ri + 1}</td>`;
                cols.forEach(col => {
                    const val = row[col];
                    const display = val === null ? '<em class="text-muted" style="opacity:.5;">NULL</em>' : escapeHtml(String(val));
                    bodyHtml += `<td class="px-3 py-2" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.83rem;" data-col="${col}" data-raw="${val === null ? '' : String(val).replace(/"/g,'&quot;')}">${display}</td>`;
                });
                bodyHtml += '</tr>';
            });
            $tbody.html(bodyHtml);
        }
        $('#dbBrowsePaginationInfo').text(`${total} row${total !== 1 ? 's' : ''} · Page ${page}/${totalPages || 1}`);
        const $pBtns = $('#dbBrowsePaginationBtns');
        $pBtns.empty();
        if (totalPages > 1) {
            const prevBtn = $(`<button class="btn btn-sm btn-outline-secondary" ${page <= 1 ? 'disabled' : ''}><i class="bi bi-chevron-left"></i></button>`);
            prevBtn.click(() => browseTable(table, page - 1));
            const nextBtn = $(`<button class="btn btn-sm btn-outline-secondary" ${page >= totalPages ? 'disabled' : ''}><i class="bi bi-chevron-right"></i></button>`);
            nextBtn.click(() => browseTable(table, page + 1));
            $pBtns.append(prevBtn, nextBtn);
        }
        dbState.allBrowseRows = rows;
        $('#dbBrowseSelectAll').off('change').on('change', function() {
            const checked = $(this).is(':checked');
            $tbody.find('.db-row-check').prop('checked', checked);
            updateBrowseSelection();
        });
        $tbody.find('.db-row-check').off('change').on('change', updateBrowseSelection);
    })
    .catch(() => {
        $tbody.html('<tr><td colspan="99" class="text-danger p-3">Failed to load table data</td></tr>');
    });
}
function updateBrowseSelection() {
    const count = $('#dbBrowseTbody .db-row-check:checked').length;
    if (count > 0) {
        $('#dbBrowseSelectionBar').removeClass('d-none').addClass('d-flex');
        $('#dbBrowseSelectedCount').text(`${count} selected`);
    } else {
        $('#dbBrowseSelectionBar').addClass('d-none').removeClass('d-flex');
    }
}
function loadTableStructure(table) {
    $('#dbColumnsPlaceholder').addClass('d-none');
    $('#dbColumnsContent').removeClass('d-none');
    $('#dbColumnsTableTitle').text(table);
    const $tbody = $('#dbColumnsTbody');
    $tbody.html('<tr><td colspan="99" class="text-center p-4"><div class="spinner-border text-primary"></div></td></tr>');
    fetch('api.php?action=mysql_table_structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: table, db_name: currentDb })
    })
    .then(r => r.json())
    .then(data => {
        if (!data.success) {
            $tbody.html(`<tr><td colspan="99" class="text-danger p-3">${data.error || 'Error'}</td></tr>`);
            return;
        }
        const cols = data.columns || [];
        let html = '';
        cols.forEach((col, i) => {
            const keyBadge = col.Key === 'PRI' ? '<span class="badge bg-warning text-dark" style="font-size:.65rem;">PRI</span>' :
                col.Key === 'UNI' ? '<span class="badge bg-info text-dark" style="font-size:.65rem;">UNI</span>' :
                col.Key === 'MUL' ? '<span class="badge bg-secondary" style="font-size:.65rem;">MUL</span>' : (col.Key || '');
            html += `<tr>
                <td class="px-3 py-2 text-center"><input type="checkbox" class="form-check-input db-col-check" data-col="${col.Field}"></td>
                <td class="px-3 py-2 text-muted" style="font-size:.78rem;">${i + 1}</td>
                <td class="px-3 py-2 fw-semibold">${col.Field}</td>
                <td class="px-3 py-2"><code style="font-size:.8rem;">${col.Type}</code></td>
                <td class="px-3 py-2">${col.Null === 'YES' ? '<span class="text-success">Yes</span>' : '<span class="text-danger">No</span>'}</td>
                <td class="px-3 py-2">${keyBadge}</td>
                <td class="px-3 py-2 text-muted">${col.Default !== null && col.Default !== undefined ? col.Default : '<em class="opacity-50">NULL</em>'}</td>
                <td class="px-3 py-2 text-muted">${col.Extra || ''}</td>
                <td class="px-3 py-2 text-center">
                    <button class="btn btn-sm btn-icon text-info btn-edit-col" data-col="${col.Field}" title="Edit"><i class="bi bi-pencil"></i></button>
                </td>
            </tr>`;
        });
        $tbody.html(html);
    })
    .catch(() => $tbody.html('<tr><td colspan="99" class="text-danger p-3">Failed to load structure</td></tr>'));
}
function runQuery() {
    const sql = $('#sqlQueryInput').val().trim();
    if (!sql) return;
    const $result = $('#sqlResultArea');
    $result.html('<div class="d-flex justify-content-center p-3"><div class="spinner-border spinner-border-sm text-primary"></div></div>');
    fetch('api.php?action=mysql_run_query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sql, db_name: currentDb })
    })
    .then(r => r.json())
    .then(data => {
        if (!data.success) {
            $result.html(`<div class="alert alert-danger m-0" style="font-size:.85rem;border-radius:8px;">${data.error || 'Query error'}</div>`);
            return;
        }
        if (data.rows) {
            const cols = data.columns || [];
            let headerHtml = cols.map(c => `<th class="px-3 py-2" style="color:#a1a1aa;font-weight:600;font-size:.72rem;text-transform:uppercase;">${c}</th>`).join('');
            let bodyHtml = '';
            if (data.rows.length === 0) {
                bodyHtml = `<tr><td colspan="${cols.length}" class="text-center text-muted p-4">Empty result</td></tr>`;
            } else {
                data.rows.forEach(row => {
                    bodyHtml += '<tr>' + cols.map(col => {
                        const v = row[col];
                        return `<td class="px-3 py-2" style="font-size:.83rem;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${v === null ? '<em class="text-muted">NULL</em>' : escapeHtml(String(v))}</td>`;
                    }).join('') + '</tr>';
                });
            }
            $result.html(`
                <div class="card border-secondary" style="background:rgba(30,30,35,0.8);border-radius:10px;overflow:hidden;">
                    <div class="table-responsive" style="max-width:100%;">
                        <table class="table table-dark table-hover mb-0" style="font-size:.82rem;width:max-content;min-width:100%;">
                            <thead><tr style="background:#27272a;border-bottom:1px solid #3f3f46;">${headerHtml}</tr></thead>
                            <tbody>${bodyHtml}</tbody>
                        </table>
                    </div>
                </div>
                <div class="text-muted p-2" style="font-size:.78rem;">${data.rows.length} row(s) returned</div>
            `);
        } else {
            $result.html(`<div class="alert alert-success m-0" style="font-size:.85rem;border-radius:8px;">${data.affected_rows || 0} row(s) affected</div>`);
        }
    })
    .catch(() => $result.html('<div class="alert alert-danger m-0">Query failed</div>'));
}