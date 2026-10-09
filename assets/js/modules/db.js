import { state } from './state.js';
import { showToast } from './ui.js';
import { api } from './api.js';
import { setLoading, withLoading } from './loading.js';
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
    setLoading($('.session-item.active'), true);
    fetch('/api/mysql_connect', {
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
        $('#floatingActionPanel').addClass('d-none');
        $('.editor-tabs-container').addClass('d-none');
        $('#db-container').removeClass('d-none').addClass('d-flex');
        setupDbSidebar(res.databases, res.db_name);
        if (res.db_name) {
            currentDb = res.db_name;
        } else {
            currentDb = '';
        }
        setupDbWorkspace();
        state.isConnecting = false;
        $('.session-item').removeClass('pe-none opacity-50');
        setLoading($('.session-item'), false);
    })
    .catch(err => {
        showToast(err.message || 'Connection failed', 'danger');
        $('#connectionStatus').html(`<span class="text-danger"><i class="bi bi-x-circle me-2"></i>${err.message}</span>`);
        state.currentProtocol = null;
        state.isConnecting = false;
        $('.session-item').removeClass('pe-none opacity-50');
        setLoading($('.session-item'), false);
    });
}
function setupDbSidebar(databases, selectedDb) {
    const $tree = $('#dbTreeContainer');
    $tree.empty();
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
    if (!databases || databases.length === 0) {
        $tree.append('<div class="text-muted small text-center p-3 opacity-50">No databases found</div>');
        return;
    }
    databases.forEach(db => {
        const $dbItem = $(`
            <div class="tree-item folder-item db-tree-db" data-db="${db}">
                <div class="tree-row d-flex align-items-center">
                    <span class="chevron-icon me-1"><i class="bi bi-chevron-right"></i></span>
                    <i class="bi bi-database me-2" style="color:var(--accent-amber);"></i>
                    <span class="item-name text-truncate flex-grow-1">${escapeHtml(db)}</span>
                    <button class="btn btn-sm btn-icon text-danger p-0 ms-1 btn-drop-db" title="Drop database"><i class="bi bi-trash3"></i></button>
                </div>
                <div class="tree-children ps-3" style="display:none;"></div>
            </div>
        `);
        const $row = $dbItem.find('.tree-row');
        $row.find('.btn-drop-db').click(function(e) {
            e.stopPropagation();
            dropDatabase(db, $dbItem);
        });
        const $children = $dbItem.find('.tree-children');
        const $chevron = $dbItem.find('.chevron-icon i');
        $row.click(function(e) {
            e.stopPropagation();
            const expanded = $dbItem.attr('data-expanded') === 'true';
            if (expanded) {
                $children.slideUp(150);
                $chevron.css('transform', 'rotate(0deg)');
                $dbItem.attr('data-expanded', 'false');
            } else {
                $chevron.css('transform', 'rotate(90deg)');
                $dbItem.attr('data-expanded', 'true');
                $children.html('<div class="tree-empty text-muted small ps-2 opacity-50"><i class="bi bi-arrow-repeat spin me-1"></i>Loading...</div>');
                $children.slideDown(150);
                currentDb = db;
                selectDatabase(db);
            }
        });
        $tree.append($dbItem);
        if (db === selectedDb) {
            $row.trigger('click');
        }
    });
}
function renderSidebarTables(db, tables, $container) {
    $container.empty();
    if (!tables || tables.length === 0) {
        $container.append('<div class="tree-empty text-muted small ps-2 opacity-50">No tables</div>');
        return;
    }
    tables.forEach(table => {
        const $tblItem = $(`
            <div class="tree-item file-item db-tree-table">
                <div class="tree-row d-flex align-items-center">
                    <i class="bi bi-table me-2 text-info" style="font-size:0.85rem;"></i>
                    <span class="item-name text-truncate flex-grow-1"></span>
                    <button class="btn btn-sm btn-icon text-danger p-0 ms-1 btn-drop-table" title="Drop table"><i class="bi bi-trash3"></i></button>
                </div>
            </div>
        `);
        $tblItem.attr({ 'data-db': db, 'data-table': table });
        $tblItem.find('.item-name').text(table);
        $tblItem.find('.btn-drop-table').click(function(e) {
            e.stopPropagation();
            dropTable(db, table);
        });
        $tblItem.find('.tree-row').click(function(e) {
            e.stopPropagation();
            $('.db-tree-table').removeClass('selected');
            $tblItem.addClass('selected');
            currentDb = db;
            currentTable = table;
            currentPage = 1;
            setActiveTable(table);
            switchDbTab('browse');
            browseTable(table, 1);
        });
        $container.append($tblItem);
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
        if (currentDb) selectDatabase(currentDb, $('#btnRefreshStructure'));
    });
    $('#btnDeleteSelectedRows').off('click').on('click', deleteSelectedRows);
    $('#btnEditSelectedRows').off('click').on('click', editSelectedRow);
    $('#btnClearBrowseSelection').off('click').on('click', () => {
        $('#dbBrowseTbody .db-row-check, #dbBrowseSelectAll').prop('checked', false);
        updateBrowseSelection();
    });
    $('#dbBrowseSearch').off('input').on('input', function() {
        const q = $(this).val().toLowerCase();
        $('#dbBrowseTbody tr').each(function() {
            $(this).toggle(!q || $(this).text().toLowerCase().includes(q));
        });
    });
    $('#btnBrowseFromColumns').off('click').on('click', () => {
        if (!currentTable) return;
        switchDbTab('browse');
        browseTable(currentTable, 1);
    });
    $('#btnAddColumn').off('click').on('click', () => openColumnModal(null));
    $('#dbColDefaultType').off('change').on('change', function() {
        $('#dbColDefaultValueWrapper').toggleClass('d-none', $(this).val() !== 'USER_DEFINED');
    });
    $('#btnDbSaveColumn').off('click').on('click', saveColumn);
    $('#btnDbSaveRow').off('click').on('click', saveEditedRow);
    $('#dbColSelectAll').off('change').on('change', function() {
        $('#dbColumnsTbody .db-col-check').prop('checked', $(this).is(':checked'));
        updateColumnSelection();
    });
    $('#dbColumnsTbody').off('change.sel click.act')
        .on('change.sel', '.db-col-check', updateColumnSelection)
        .on('click.act', '.btn-edit-col', function() { openColumnModal($(this).data('col')); })
        .on('click.act', '.btn-drop-col', function() { dropColumns([$(this).data('col')]); });
    $('#btnDropSelectedColumns').off('click').on('click', () => {
        const cols = $('#dbColumnsTbody .db-col-check:checked').map((_, el) => $(el).data('col')).get();
        dropColumns(cols);
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
    fetch('/api/mysql_table_data', {
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
    fetch('/api/mysql_table_structure', {
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
                <td class="px-3 py-2 text-center"><input type="checkbox" class="form-check-input db-col-check" data-col="${escapeHtml(col.Field)}"></td>
                <td class="px-3 py-2 text-muted" style="font-size:.78rem;">${i + 1}</td>
                <td class="px-3 py-2 fw-semibold">${col.Field}</td>
                <td class="px-3 py-2"><code style="font-size:.8rem;">${col.Type}</code></td>
                <td class="px-3 py-2">${col.Null === 'YES' ? '<span class="text-success">Yes</span>' : '<span class="text-danger">No</span>'}</td>
                <td class="px-3 py-2">${keyBadge}</td>
                <td class="px-3 py-2 text-muted">${col.Default !== null && col.Default !== undefined ? col.Default : '<em class="opacity-50">NULL</em>'}</td>
                <td class="px-3 py-2 text-muted">${col.Extra || ''}</td>
                <td class="px-3 py-2 text-center">
                    <button class="btn btn-sm btn-icon text-info btn-edit-col" data-col="${escapeHtml(col.Field)}" title="Edit"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-icon text-danger btn-drop-col" data-col="${escapeHtml(col.Field)}" title="Drop column"><i class="bi bi-trash3"></i></button>
                </td>
            </tr>`;
        });
        $tbody.html(html);
        dbState.currentColumns = cols;
        $('#dbColSelectAll').prop('checked', false);
        updateColumnSelection();
    })
    .catch(() => $tbody.html('<tr><td colspan="99" class="text-danger p-3">Failed to load structure</td></tr>'));
}
function runQuery() {
    const sql = $('#sqlQueryInput').val().trim();
    if (!sql) return;
    const $result = $('#sqlResultArea');
    $result.html('<div class="d-flex justify-content-center p-3"><div class="spinner-border spinner-border-sm text-primary"></div></div>');
    const $btns = $('#btnRunSql, #btnRunSqlExplain');
    setLoading($btns, true);
    api('mysql_run_query', { sql: sql, db_name: currentDb })
    .then(data => {
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
        // DDL may have changed the schema
        if (/^\s*(drop|create|alter|rename|truncate)\s/i.test(sql) && currentDb) refreshCurrentDb();
    })
    .catch(err => $result.html(`<div class="alert alert-danger m-0" style="font-size:.85rem;border-radius:8px;">${escapeHtml(err.message || 'Query failed')}</div>`))
    .finally(() => setLoading($btns, false));
}

// ───────────────────────── Actions with per-element loading ─────────────────────────

function sidebarDbItem(db) {
    return $('#dbTreeContainer .db-tree-db').filter((_, el) => $(el).attr('data-db') === db);
}

function refreshCurrentDb() {
    if (!currentDb) return;
    selectDatabase(currentDb);
}

export function selectDatabase(db, $trigger) {
    currentDb = db;
    $('#dbStructurePlaceholder').addClass('d-none');
    $('#dbStructureContent').removeClass('d-none');
    $('#dbStructureDbName').text(db);
    const $body = $('#dbStructureBody');
    if (!$body.children().length) {
        $body.html('<tr><td colspan="6" class="text-center p-4"><div class="spinner-border text-primary"></div></td></tr>');
    }
    const work = api('mysql_db_structure', { db_name: db }).then(res => {
        if (currentDb !== db) return;
        const tables = res.tables || [];
        // one request feeds both the sidebar tree and the Structure tab
        const $item = sidebarDbItem(db);
        if ($item.attr('data-expanded') === 'true') {
            renderSidebarTables(db, tables.map(t => t.Name), $item.find('.tree-children').first());
        }
        let totalRows = 0, totalSize = 0, html = '';
        tables.forEach(t => {
            const size = (parseInt(t.Data_length) || 0) + (parseInt(t.Index_length) || 0);
            totalRows += parseInt(t.Rows) || 0;
            totalSize += size;
            html += `<tr data-table="${escapeHtml(t.Name)}">
                <td class="px-3 py-2 fw-semibold"><i class="bi bi-table me-2 text-info"></i>${escapeHtml(t.Name)}</td>
                <td class="px-3 py-2">${escapeHtml(t.Rows ?? '')}</td>
                <td class="px-3 py-2 text-muted">${escapeHtml(t.Engine ?? '')}</td>
                <td class="px-3 py-2 text-muted">${escapeHtml(t.Collation ?? '')}</td>
                <td class="px-3 py-2">${formatBytes(size)}</td>
                <td class="px-3 py-2 text-nowrap">
                    <button class="btn btn-sm btn-icon text-success btn-st-browse" title="Browse"><i class="bi bi-table"></i></button>
                    <button class="btn btn-sm btn-icon text-info btn-st-columns" title="Structure"><i class="bi bi-list-columns-reverse"></i></button>
                    <button class="btn btn-sm btn-icon text-warning btn-st-truncate" title="Truncate"><i class="bi bi-eraser"></i></button>
                    <button class="btn btn-sm btn-icon text-danger btn-st-drop" title="Drop"><i class="bi bi-trash3"></i></button>
                </td>
            </tr>`;
        });
        $body.html(html || '<tr><td colspan="6" class="text-center text-muted p-4">No tables</td></tr>');
        $('#dbStructureSumLabel').text(`${tables.length} table(s)`);
        $('#dbStructureSumRows').text(totalRows);
        $('#dbStructureSumSize').text(formatBytes(totalSize));
    }).catch(err => {
        $body.html(`<tr><td colspan="6" class="text-danger p-3">${escapeHtml(err.message)}</td></tr>`);
        sidebarDbItem(db).find('.tree-children').first()
            .html('<div class="tree-empty text-muted small ps-2 opacity-50">Failed to load</div>');
    });
    return withLoading($trigger || [], work);
}

$(document).on('click', '#dbStructureBody .btn-st-browse, #dbStructureBody .btn-st-columns', function() {
    const table = $(this).closest('tr').data('table');
    const toColumns = $(this).hasClass('btn-st-columns');
    currentTable = table;
    currentPage = 1;
    setActiveTable(table);
    $('.db-tree-table').removeClass('selected')
        .filter((_, el) => $(el).attr('data-table') === table).addClass('selected');
    switchDbTab(toColumns ? 'columns' : 'browse');
    toColumns ? loadTableStructure(table) : browseTable(table, 1);
});
$(document).on('click', '#dbStructureBody .btn-st-drop', function() {
    dropTable(currentDb, $(this).closest('tr').data('table'));
});
$(document).on('click', '#dbStructureBody .btn-st-truncate', function() {
    truncateTable(currentDb, $(this).closest('tr').data('table'));
});

function resetTablePanes(table) {
    if (currentTable !== table) return;
    currentTable = '';
    dbState.currentBrowseTable = '';
    $('#dbActiveTableBadge').hide();
    $('#dbBrowseContent, #dbColumnsContent').addClass('d-none');
    $('#dbBrowsePlaceholder, #dbColumnsPlaceholder').removeClass('d-none');
    updateBrowseSelection();
}

function dropDatabase(db, $dbItem) {
    showDbConfirm(
        'Drop Database',
        `Drop database <strong>${escapeHtml(db)}</strong> and <strong>all of its tables and data</strong>? This cannot be undone.`,
        () => {
            const $row = $dbItem.find('> .tree-row');
            return withLoading($row, api('mysql_drop_database', { db_name: db, confirm_name: db }))
            .then(res => {
                $dbItem.slideUp(150, () => $dbItem.remove());
                if (currentDb === db) {
                    currentDb = '';
                    resetTablePanes(currentTable);
                    $('#dbStructureContent').addClass('d-none');
                    $('#dbStructurePlaceholder').removeClass('d-none');
                    $('#dbStructureBody').empty();
                }
                if (!$('#dbTreeContainer .db-tree-db').not($dbItem).length) {
                    $('#dbTreeContainer').append('<div class="text-muted small text-center p-3 opacity-50">No databases found</div>');
                }
                showToast(`Database "${db}" dropped`);
            })
            .catch(err => showToast(err.message, 'danger'));
        },
        { typeName: db }
    );
}

function dropTable(db, table) {
    showDbConfirm(
        'Drop Table',
        `Drop table <strong>${escapeHtml(table)}</strong>? All its data will be lost.`,
        () => {
            const $els = $('#dbTreeContainer .db-tree-table, #dbStructureBody tr').filter((_, el) =>
                ($(el).attr('data-table') || $(el).data('table')) === table &&
                (!$(el).attr('data-db') || $(el).attr('data-db') === db)
            );
            const $rows = $els.map((_, el) => ($(el).hasClass('db-tree-table') ? $(el).find('.tree-row')[0] : el)).get();
            return withLoading($rows, api('mysql_drop_table', { db_name: db, table }))
            .then(() => {
                $els.remove();
                resetTablePanes(table);
                showToast(`Table "${table}" dropped`);
                refreshCurrentDb();
            })
            .catch(err => showToast(err.message, 'danger'));
        }
    );
}

function truncateTable(db, table) {
    showDbConfirm(
        'Truncate Table',
        `Delete <strong>all rows</strong> of <strong>${escapeHtml(table)}</strong>? The table itself is kept.`,
        () => {
            const $row = $('#dbStructureBody tr').filter((_, el) => $(el).data('table') === table);
            return withLoading($row, api('mysql_truncate_table', { db_name: db, table }))
            .then(() => {
                showToast(`Table "${table}" truncated`);
                if (currentTable === table && !$('#dbPaneBrowse').hasClass('d-none')) browseTable(table, 1);
                selectDatabase(db);
            })
            .catch(err => showToast(err.message, 'danger'));
        }
    );
}

// Resolves to the list of primary-key column names (one or more)
function getPrimaryKey(table) {
    return api('mysql_table_structure', { table, db_name: currentDb }).then(res => {
        const pks = (res.columns || []).filter(c => c.Key === 'PRI').map(c => c.Field);
        if (!pks.length) throw new Error('This table has no primary key, use the SQL tab');
        return pks;
    });
}
const pickKey = (row, pks) => Object.fromEntries(pks.map(k => [k, row[k]]));

function selectedBrowseRows() {
    return $('#dbBrowseTbody .db-row-check:checked');
}

function deleteSelectedRows() {
    const table = currentTable;
    const $checked = selectedBrowseRows();
    if (!table || !$checked.length) return;
    const $trs = $checked.closest('tr');
    const idxs = $checked.map((_, el) => parseInt($(el).data('row'))).get();
    showDbConfirm(
        'Delete Rows',
        `Delete <strong>${idxs.length}</strong> selected row(s) from <strong>${escapeHtml(table)}</strong>?`,
        () => {
            const $btn = $('#btnDeleteSelectedRows');
            setLoading($trs, true);
            return withLoading($btn, getPrimaryKey(table).then(pks => {
                const pkRows = idxs.map(i => pickKey(dbState.allBrowseRows[i], pks));
                return api('mysql_delete_rows', { db_name: currentDb, table, pk_rows: pkRows });
            }))
            .then(res => {
                setLoading($trs, false);
                showToast(`${res.affected ?? idxs.length} row(s) deleted`);
                const page = (idxs.length >= dbState.allBrowseRows.length && currentPage > 1) ? currentPage - 1 : currentPage;
                browseTable(table, page);
            })
            .catch(err => { setLoading($trs, false); showToast(err.message, 'danger'); });
        }
    );
}

function dropColumns(cols) {
    if (!cols.length) return;
    const table = currentTable;
    const $trs = $('#dbColumnsTbody tr').filter((_, tr) => cols.includes($(tr).find('.db-col-check').data('col')));
    showDbConfirm(
        'Drop Column(s)',
        `Drop column(s) ${cols.map(c => `<strong>${escapeHtml(c)}</strong>`).join(', ')} from <strong>${escapeHtml(table)}</strong>? Their data will be lost.`,
        () => withLoading($trs, api('mysql_drop_columns', { db_name: currentDb, table, columns: cols }))
            .then(() => {
                showToast('Column(s) dropped');
                loadTableStructure(table);
            })
            .catch(err => showToast(err.message, 'danger'))
    );
}

function updateColumnSelection() {
    $('#dbColumnsMultiActions').toggleClass('d-none', $('#dbColumnsTbody .db-col-check:checked').length === 0);
}

function openColumnModal(colName) {
    const col = colName ? (dbState.currentColumns || []).find(c => c.Field === colName) : null;
    $('#dbColumnModalTitle').text(col ? 'Edit Column' : 'Add Column');
    $('#dbColumnModalSubtitle').text(currentTable);
    $('#dbColOriginalName').val(col ? col.Field : '');
    $('#dbColName').val(col ? col.Field : '');
    let type = 'INT', length = '';
    if (col) {
        const m = String(col.Type).match(/^([a-z]+)(?:\(([^)]*)\))?/i);
        if (m) { type = m[1].toUpperCase(); length = m[2] || ''; }
    }
    if (!$('#dbColType option[value="' + type + '"]').length) type = 'INT';
    $('#dbColType').val(type);
    $('#dbColLength').val(length);
    let defType = 'NONE', defVal = '';
    if (col && col.Default !== null && col.Default !== undefined) {
        if (/^current_timestamp/i.test(col.Default)) defType = 'CURRENT_TIMESTAMP';
        else { defType = 'USER_DEFINED'; defVal = col.Default; }
    } else if (col && col.Null === 'YES') defType = 'NULL';
    $('#dbColDefaultType').val(defType).trigger('change');
    $('#dbColDefaultValue').val(defVal);
    $('#dbColNull').prop('checked', col ? col.Null === 'YES' : true);
    $('#dbColAi').prop('checked', !!(col && /auto_increment/i.test(col.Extra || '')));
    $('#dbColIndex').val('NONE');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('dbColumnModal')).show();
}

function saveColumn() {
    const name = $('#dbColName').val().trim();
    if (!name) { showToast('Column name is required', 'danger'); return; }
    const $btn = $('#btnDbSaveColumn');
    withLoading($btn, api('mysql_save_column', {
        db_name: currentDb,
        table: currentTable,
        original_name: $('#dbColOriginalName').val(),
        name,
        type: $('#dbColType').val(),
        length: $('#dbColLength').val().trim(),
        nullable: $('#dbColNull').is(':checked'),
        default_type: $('#dbColDefaultType').val(),
        default_value: $('#dbColDefaultValue').val(),
        ai: $('#dbColAi').is(':checked'),
        index: $('#dbColIndex').val()
    }), { text: 'Saving...' })
    .then(() => {
        bootstrap.Modal.getInstance(document.getElementById('dbColumnModal')).hide();
        showToast('Column saved');
        loadTableStructure(currentTable);
    })
    .catch(err => showToast(err.message, 'danger'));
}

let editingRow = null;
function editSelectedRow() {
    const $checked = selectedBrowseRows();
    if ($checked.length !== 1) { showToast('Select exactly one row to edit', 'warning'); return; }
    const table = currentTable;
    const idx = parseInt($checked.data('row'));
    const row = dbState.allBrowseRows[idx];
    withLoading($('#btnEditSelectedRows'), getPrimaryKey(table))
    .then(pks => {
        editingRow = { table, pk: pickKey(row, pks), original: row };
        $('#dbEditRowSubtitle').text(table);
        $('#dbEditRowPkInfo').text(pks.map(k => `${k} = ${row[k]}`).join(', '));
        const $body = $('#dbEditRowBody').empty();
        Object.keys(row).forEach(col => {
            const $g = $('<div class="mb-3"><label class="form-label text-muted small fw-bold"></label><div class="input-group"><textarea class="form-control bg-darker border-secondary text-light shadow-none font-monospace" rows="1"></textarea><div class="input-group-text bg-dark border-secondary"><input type="checkbox" class="form-check-input mt-0 db-edit-null" title="NULL"><small class="ms-1 text-muted">NULL</small></div></div></div>');
            $g.find('label').text(col);
            const isNull = row[col] === null;
            $g.find('textarea').attr('data-col', col).val(isNull ? '' : row[col]).prop('disabled', isNull);
            $g.find('.db-edit-null').prop('checked', isNull).on('change', function() {
                $g.find('textarea').prop('disabled', this.checked);
            });
            $body.append($g);
        });
        bootstrap.Modal.getOrCreateInstance(document.getElementById('dbEditRowModal')).show();
    })
    .catch(err => showToast(err.message, 'danger'));
}

function saveEditedRow() {
    if (!editingRow) return;
    const { table, pk, original } = editingRow;
    const rowData = {};
    $('#dbEditRowBody textarea').each(function() {
        const col = $(this).attr('data-col');
        const isNull = $(this).closest('.input-group').find('.db-edit-null').is(':checked');
        const val = isNull ? '__NULL__' : $(this).val();
        const before = original[col] === null ? '__NULL__' : String(original[col]);
        if (val !== before) rowData[col] = val;
    });
    if (!Object.keys(rowData).length) {
        bootstrap.Modal.getInstance(document.getElementById('dbEditRowModal')).hide();
        return;
    }
    const $tr = $('#dbBrowseTbody .db-row-check:checked').closest('tr');
    setLoading($tr, true);
    withLoading($('#btnDbSaveRow'), api('mysql_update_row', { db_name: currentDb, table, pk, row_data: rowData }), { text: 'Saving...' })
    .then(() => {
        bootstrap.Modal.getInstance(document.getElementById('dbEditRowModal')).hide();
        showToast('Row updated');
        browseTable(table, currentPage);
    })
    .catch(err => showToast(err.message, 'danger'))
    .finally(() => setLoading($tr, false));
}
