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
        setupDbSidebar(res.databases, res.db_name);
        if (res.db_name) {
            currentDb = res.db_name;
            renderTables(res.tables);
        } else {
            currentDb = '';
            $('#dbTableList').empty();
        }
        
        $('#ftpSidebar').addClass('d-none');
        $('#sshSidebar').addClass('d-none');
        $('#dbSidebar').remove
        
        
        });
    }
    
    const tbody = card.find('.db-tbody');
    if (!data.rows || data.rows.length === 0) {
        tbody.append(`<tr><td colspan="${data.columns.length || 1}" class="text-center text-muted p-4">Empty result set</td></tr>`);
    } else {
        data.rows.forEach(row => {
            const tr = $('<tr></tr>');
            data.columns.forEach(col => {
                const val = row[col];
                const displayVal = val === null ? '<em class="text-muted">NULL</em>' : $('<div></div>').text(val).html();
                tr.append(`<td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${displayVal}</td>`);
            });
            tbody.append(tr);
        });
    }
    
    if (data.total !== undefined && data.total > limit) {
        const pag = card.find('.db-pagination-container');
        const totalPages = Math.ceil(data.total / limit);
        const prevDisabled = currentPage === 1 ? 'disabled' : '';
        const nextDisabled = currentPage === totalPages ? 'disabled' : '';
        
        const prevBtn = $(`<button class="btn btn-sm btn-outline-secondary p-1 px-2" ${prevDisabled}><i class="bi bi-chevron-left"></i></button>`);
        const nextBtn = $(`<button class="btn btn-sm btn-outline-secondary p-1 px-2" ${nextDisabled}><i class="bi bi-chevron-right"></i></button>`);
        const label = $(`<span class="text-muted mx-2" style="font-size: 0.8rem;">Page ${currentPage} / ${totalPages}</span>`);
        
        prevBtn.click(() => browseTable(currentTable, currentPage - 1));
        nextBtn.click(() => browseTable(currentTable, currentPage + 1));
        
        pag.append(prevBtn).append(label).append(nextBtn);
    }
    
    area.append(card);
}


        // Wire up tab nav
        $('.db-tab-btn').off('click').on('click', function () {
            const tab = $(this).data('tab');
            if (tab === 'columns' && dbState.currentBrowseTable) {
                loadTableStructure(dbState.currentBrowseTable);
            } else if (tab === 'browse' && dbState.currentBrowseTable) {
                browseTable(dbState.currentBrowseTable, 1);
            } else if (tab === 'structure') {
                loadDbStructure();
                switchDbTab('structure');
            } else {
                switchDbTab(tab);
            }
        });

        // Wire up toolbar buttons
        $('#btnRefreshStructure').off('click').on('click', () => loadDbStructure());
        $('#btnNewQuery').off('click').on('click', () => {
            switchDbTab('sql');
            $('#sqlQueryInput').val('').focus();
        });
        $('#btnClearSql').off('click').on('click', () => $('#sqlQueryInput').val(''));

        // Format SQL (basic keyword wrapping)
        $('#btnFormatSql').off('click').on('click', () => {
            const val = $('#sqlQueryInput').val().trim();
            const formatted = val.replace(/\s+/g, ' ')
                .replace(/ (SELECT|FROM|WHERE|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|ON|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET|UNION|INSERT INTO|VALUES|UPDATE|SET|DELETE FROM|CREATE TABLE|ALTER TABLE|DROP TABLE) /gi, '\n$1 ');
            $('#sqlQueryInput').val(formatted.trim());
        });

        $('#btnRunSql').off('click').on('click', () => runCustomQuery());
        $('#btnRunSqlExplain').off('click').on('click', () => {
            const sql = $('#sqlQueryInput').val().trim();
            if (sql) { $('#sqlQueryInput').val(`EXPLAIN ${sql}`); runCustomQuery(); }
        });

        // Browse filter
        $('#dbBrowseSearch').off('input').on('input', function () {
            const q = $(this).val().toLowerCase();
            if (!q) {
                renderBrowseRows(dbState.allBrowseRows);
            } else {
                const filtered = dbState.allBrowseRows.filter(row =>
                    Object.values(row).some(v => v !== null && String(v).toLowerCase().includes(q))
                );
                renderBrowseRows(filtered);
            }
        });

        $('#btnBrowseFromColumns').off('click').on('click', () => {
            if (dbState.currentBrowseTable) browseTable(dbState.currentBrowseTable, 1);
        });

        // Load initial structure
        if (res.db_name) {
            dbState.currentDb = res.db_name;
            loadDbStructure();
        } else {
            dbState.currentDb = '';
        }

        switchDbTab('structure');
    })
    .catch(err => {
        $('#connectionStatus').html(`<span class="text-danger"><i class="bi bi-exclamation-triangle me-2"></i>Connection failed: ${err.message}</span>`);
        showToast(err.message, 'danger');
    });
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function setupDbSidebar(databases, selectedDb) {
    const select = $('#dbSelector');
    select.empty();
            if (currentBrowseTable) browseTable(currentBrowseTable, 1);
        });

        // Load database structure if db already selected
        if (res.db_name) {
            currentDb = res.db_name;
            loadDbStructure();
        } else {
            currentDb = '';
}

function renderSidebarTables(tables) {
    const list = $('#dbTableList');
    list.empty();
    if (!tables || tables.length === 0) {
        list.html('<div class="text-muted small px-2 py-2 opacity-50">No tables</div>');
        return;
    }
    tables.forEach(t => {
        const name = typeof t === 'string' ? t : (t.Name || t.name);
        const item = $(`
            <div class="db-table-item d-flex align-items-center gap-2 px-2 py-1 rounded" data-table="${name}"
                 style="cursor:pointer; font-size:0.82rem; transition:background 0.12s; color:#a1a1aa;">
                <i class="bi bi-table text-success opacity-50" style="font-size:0.78rem;"></i>
                <span class="flex-grow-1 text-truncate" title="${name}">${name}</span>
            </div>
        `);
        item.hover(
            function() { $(this).css('background', 'rgba(255,255,255,0.06)').css('color', '#e4e4e7'); },
            function() { $(this).css('background', '').css('color', '#a1a1aa'); }
        );
        item.on('click', function() {
            $('.db-table-item').css('background', '').css('color', '#a1a1aa');
            $(this).css('background', 'rgba(16,185,129,0.1)').css('color', '#34d399');
            browseTable(name, 1);
        });
        item.on('contextmenu', function(e) {
            e.preventDefault();
            loadTableStructure(name);
        });
        list.append(item);
    });
}

// ─── Structure Tab ───────────────────────────────────────────────────────────

export function loadDbStructure() {
    if (!dbState.currentDb) return;

    $('#dbStructureBody').html(`
        <tr><td colspan="6" class="text-center text-muted py-4">
            <div class="spinner-border spinner-border-sm text-success me-2"></div>Loading structure...
        </td></tr>
    `);
    $('#dbStructurePlaceholder').addClass('d-none');
    $('#dbStructureContent').removeClass('d-none');
    $('#dbStructureDbName').text(dbState.currentDb);

    fetch('api.php?action=mysql_db_structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ db_name: dbState.currentDb })
    })
    .then(r => r.json())
    .then(res => {
        if (!res.success) throw new Error(res.error);
        renderStructureTable(res.tables);
        renderSidebarTables(res.tables);
    })
    .catch(err => {
        $('#dbStructureBody').html(`<tr><td colspan="6" class="text-danger text-center py-3">${err.message}</td></tr>`);
    });
}

function renderStructureTable(tables) {
    const tbody = $('#dbStructureBody');
    tbody.empty();

    let totalRows = 0;
    let totalSize = 0;

    tables.forEach(t => {
        const name = t.Name || t.name;
        const rows = parseInt(t.Rows || t.rows || 0);
        const engine = t.Engine || t.engine || '—';
        const collation = t.Collation || t.collation || '—';
        const dataLen = parseInt(t.Data_length || t.data_length || 0);
        const indexLen = parseInt(t.Index_length || t.index_length || 0);
        const size = dataLen + indexLen;

        totalRows += rows;
        totalSize += size;

        const tr = $(`
            <tr style="transition: background 0.12s;">
                <td class="px-3 py-2">
                    <a href="#" class="text-success fw-bold text-decoration-none db-browse-link" data-table="${name}">
                        <i class="bi bi-table me-1 opacity-50"></i>${name}
                    </a>
                </td>
                <td class="px-3 py-2 text-muted">${rows.toLocaleString()}</td>
                <td class="px-3 py-2 text-muted">${engine}</td>
                <td class="px-3 py-2 text-muted" style="font-size:0.78rem;">${collation}</td>
                <td class="px-3 py-2 text-muted">${formatBytes(size)}</td>
                <td class="px-3 py-2">
                    <div class="d-flex gap-1">
                        <button class="btn-db-action browse db-action-browse" data-table="${name}"><i class="bi bi-table me-1"></i>Browse</button>
                        <button class="btn-db-action struct db-action-struct" data-table="${name}"><i class="bi bi-list-columns-reverse me-1"></i>Structure</button>
                        <button class="btn-db-action empty db-action-empty" data-table="${name}"><i class="bi bi-eraser me-1"></i>Empty</button>
                        <button class="btn-db-action drop db-action-drop" data-table="${name}"><i class="bi bi-trash me-1"></i>Drop</button>
                    </div>
                </td>
            </tr>
        `);
        tbody.append(tr);
    });

    $('#dbStructureSumLabel').text(`${tables.length} table${tables.length !== 1 ? 's' : ''}`);
    $('#dbStructureSumRows').text(totalRows.toLocaleString() + ' rows');
    $('#dbStructureSumSize').text(formatBytes(totalSize));

    tbody.find('.db-browse-link').off('click').on('click', function (e) {
        e.preventDefault();
        browseTable($(this).data('table'), 1);
    });
    tbody.find('.db-action-browse').off('click').on('click', function () {
        browseTable($(this).data('table'), 1);
    });
    tbody.find('.db-action-struct').off('click').on('click', function () {
        loadTableStructure($(this).data('table'));
    });
    tbody.find('.db-action-empty').off('click').on('click', function () {
        const t = $(this).data('table');
        showDbConfirm('Empty Table',
            `<div class="alert alert-warning mb-0"><i class="bi bi-exclamation-triangle-fill me-2"></i>Delete all rows from <code>${t}</code>? This cannot be undone.</div>`,
            () => truncateTable(t)
        );
    });
    tbody.find('.db-action-drop').off('click').on('click', function () {
        const t = $(this).data('table');



























































            </div>
        `);
    });
}

function renderQueryGrid(data) {
    const area = $('#sqlResultArea');

    const card = $(`
        <div>
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="text-success small fw-bold">
                    <i class="bi bi-grid-3x3-gap me-1"></i>${data.rows.length} row${data.rows.length !== 1 ? 's' : ''} returned ${data.total !== undefined ? `(${data.total} total)` : ''}
                </span>
            </div>
            <div class="card border-secondary" style="background:rgba(18,18,22,0.7);border-radius:10px;overflow:hidden;">
                <div class="table-responsive" style="max-height: 400px;">
                    <table class="table table-dark table-hover mb-0" style="font-size:0.82rem;">
                        <thead id="sqlGridThead"></thead>
                        <tbody id="sqlGridTbody"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `);

    area.empty().append(card);

    const headerRow = $('<tr style="background:#27272a;position:sticky;top:0;z-index:5;"></tr>');
    data.columns.forEach(col => {
        headerRow.append(`<th class="px-3 py-2" style="color:#a1a1aa;font-weight:600;font-size:.72rem;text-transform:uppercase;letter-spacing:.5px;white-space:nowrap;border-bottom:2px solid #3f3f46;">${escapeHtml(col)}</th>`);
    });
    area.find('#sqlGridThead').append(headerRow);

    const tbody = area.find('#sqlGridTbody');
    if (!data.rows || data.rows.length === 0) {
        tbody.html(`<tr><td colspan="${data.columns.length}" class="text-center text-muted py-4">Empty result set</td></tr>`);
    } else {
        data.rows.forEach(row => {
            const tr = $('<tr></tr>');
            data.columns.forEach(col => {
                const val = row[col];
                const display = val === null
                    ? '<em class="text-muted" style="font-size:0.8rem;">NULL</em>'
                    : `<span style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-block;" title="${escapeHtml(val)}">${escapeHtml(val)}</span>`;
                tr.append(`<td class="px-3 py-1">${display}</td>`);
            });
            tbody.append(tr);
        });
    }


        pag.append(prevBtn).append(nextBtn);
    }
}

function renderBrowseRows(rows) {
    const tbody = $('#dbBrowseTbody');
    tbody.empty();
    if (!rows || rows.length === 0) {
        const cols = $('#dbBrowseThead tr th').length || 1;
        tbody.html(`<tr><td colspan="${cols}" class="text-center text-muted py-4">No rows found</td></tr>`);
        return;
    }
    rows.forEach(row => {
        const tr = $('<tr></tr>');
        Object.values(row).forEach(val => {
            const display = val === null
                ? '<em class="text-muted" style="font-size:0.8rem;">NULL</em>'
                : `<span style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-block;" title="${escapeHtml(val)}">${escapeHtml(val)}</span>`;
            tr.append(`<td class="px-3 py-1" style="vertical-align:middle;">${display}</td>`);
        });
        tbody.append(tr);
    });
}

// ─── Table Columns Tab ──────────────────────────────────────────────────────

function loadTableStructure(tableName) {
    setActiveTable(tableName);
    switchTab('columns');

    $('#dbColumnsPlaceholder').addClass('d-none');
    $('#dbColumnsContent').removeClass('d-none');
    $('#dbColumnsTableTitle').text(tableName);
    $('#dbColumnsTbody').html(`<tr><td colspan="7" class="text-center text-muted py-3"><div class="spinner-border spinner-border-sm me-2"></div>Loading...</td></tr>`);

    fetch('api.php?action=mysql_table_structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ db_name: currentDb, table: tableName })
    })
    .then(r => r.json())
    .then(res => {
        if (!res.success) throw new Error(res.error);
        const tbody = $('#dbColumnsTbody');
        tbody.empty();
        res.columns.forEach((col, idx) => {
            const key = col.Key || col.key || '';
            let keyBadge = '';
            if (key.toLowerCase() === 'pri') keyBadge = '<span class="key-badge pri">PRI</span>';
            else if (key.toLowerCase() === 'uni') keyBadge = '<span class="key-badge uni">UNI</span>';
            else if (key.toLowerCase() === 'mul') keyBadge = '<span class="key-badge mul">MUL</span>';

            const nullable = (col.Null || col.null || 'NO').toUpperCase() === 'YES'
                ? '<span class="text-success">YES</span>'
                : '<span class="text-muted">NO</span>';

            const defaultVal = col.Default !== null && col.Default !== undefined
                ? escapeHtml(col.Default)
                : '<em class="text-muted">NULL</em>';

            tbody.append(`
                <tr>
                    <td class="px-3 py-2 text-muted">${idx + 1}</td>
                    <td class="px-3 py-2 text-light fw-bold">${escapeHtml(col.Field || col.field)}</td>
                    <td class="px-3 py-2 font-monospace text-info" style="font-size:0.8rem;">${escapeHtml(col.Type || col.type)}</td>
         
























































































































            });
            tbody.append(tr);
        });
    }
}

// ─── DDL Actions ─────────────────────────────────────────────────────────────

function truncateTable(tableName) {
    fetch('api.php?action=mysql_truncate_table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ db_name: currentDb, table: tableName })
    })
    .then(r => r.json())
    .then(res => {
        if (res.success) {
            showToast(`Table "${tableName}" emptied successfully`);
            loadDbStructure();
        } else {
            showToast(res.error, 'danger');
        }
    })
    .catch(err => showToast(err.message, 'danger'));
}

function dropTable(tableName) {
    fetch('api.php?action=mysql_drop_table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ db_name: currentDb, table: tableName })
    })
    .then(r => r.json())
    .then(res => {
        if (res.success) {
            showToast(`Table "${tableName}" dropped`);
            if (currentBrowseTable === tableName) {
                currentBrowseTable = '';
                $('#dbActiveTableBadge').hide();
            }
            loadDbStructure();
        } else {
            showToast(res.error, 'danger');
        }
    })
    .catch(err => showToast(err.message, 'danger'));
}

export function browseTableFromSidebar(tableName) {
    browseTable(tableName, 1);
}
