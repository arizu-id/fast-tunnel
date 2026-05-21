        const $td = $row.find(`td:eq(${i + 2})`);
        rowData[col] = $td.data('raw');
    });

    $('#dbEditRowTitle').text('Edit Row');
    $('#dbEditRowSubtitle').text(`Table: ${tableName}`);
    $('#dbEditRowPkInfo').text(`${browsePkColumn} = ${pkVal}`);

    const body = $('#dbEditRowBody');
    body.empty();

    browseColumns.forEach(col => {
        const isPk = col === browsePkColumn;
        const val = rowData[col];
        const isNull = val === null || val === undefined;
        const displayVal = isNull ? '' : String(val);

        const group = $(`
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <label class="form-label small fw-semibold mb-0" style="color: ${isPk ? '#a78bfa' : '#a1a1aa'}; letter-spacing:.3px; text-transform:uppercase; font-size:.72rem;">
                        ${isPk ? '<i class="bi bi-key-fill me-1"></i>' : ''}${col}${isPk ? ' <span class="text-muted">(PK)</span>' : ''}
                    </label>
                    <div class="form-check form-switch mb-0">
                        <input class="form-check-input edit-null-toggle" type="checkbox" id="nullToggle_${col}" role="switch" ${isNull ? 'checked' : ''} ${isPk ? 'disabled' : ''}>
                        <label class="form-check-label text-muted" style="font-size:0.72rem;" for="nullToggle_${col}">NULL</label>
                    </div>
                </div>
  
                    value="${escapeHtml(displayVal)}"
                    ${isPk ? 'readonly style="opacity:0.5; cursor:not-allowed;"' : ''}
                    ${isNull ? 'placeholder="NULL" disabled' : ''}
                    style="font-size:0.83rem; border-radius:7px;"
                >
            </div>
        `);

        // Wire null toggle
        group.find('.edit-null-toggle').on('change', function () {
            const $input = group.find('.edit-row-field');
            if ($(this).is(':checked')) {
                $input.val('').prop('disabled', true).attr('placeholder', 'NULL');
            } else {
                $input.prop('disabled', false).attr('placeholder', '').focus();
            }
        });

        body.append(group);
    });

    // Wire save button
    $('#btnDbSaveRow').off('click').on('click', function () {
        saveRowEdit(tableName, pkVal);
    });

    new bootstrap.Modal(document.getElementById('dbEditRowModal')).show();
}

function saveRowEdit(tableName, pkVal) {
    const rowData = {};
    let hasError = false;

    $('#dbEditRowBody .edit-row-field').each(function () {
        const col = $(this).data('col');
        if (col === browsePkColumn) return; // skip PK
        const nullToggle = $(`#nullToggle_${col}`);
        if (nullToggle.is(':checked')) {
            rowData[col] = '__NULL__';
        } else {
            rowData[col] = $(this).val();
        }
    });

    if (hasError) return;

    const $btn = $('#btnDbSaveRow');
    $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>Saving...');




































































































































                tr.addClass('table-active');
            } else {
                selectedRowKeys.delete(pkStr);
                tr.removeClass('table-active');
            }
            updateSelectionBar();
        });
        tr.append(cbCell);

        // Edit button cell — subtle icon-only style, no loud colors
        const editCell = $(`
            <td class="px-2 py-1" style="vertical-align:middle; width:52px;">
                <button class="btn btn-xs btn-browse-edit" title="Edit row" style="padding:3px 7px; font-size:0.75rem; border-radius:5px; background:rgba(255,255,255,0.06); border:1px solid #3f3f46; color:#a1a1aa;">
                    <i class="bi bi-pencil"></i>
                </button>
            </td>
        `);
        editCell.find('button').on('click', (e) => {
            e.stopPropagation();
            openEditRowModal(dbState.currentBrowseTable, pkStr);
        });
        tr.append(editCell);

        // Data cells
        browseColumns.forEach(col => {
            const val = row[col];
            const isPk = col === browsePkColumn;
            const display = val === null
                ? '<em class="text-muted" style="font-size:0.8rem;">NULL</em>'
                : `<span style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-block;" title="${escapeHtml(val)}">${escapeHtml(val)}</span>`;
            const td = $(`<td class="px-3 py-1" style="vertical-align:middle; ${isPk ? 'color:#8b5cf6;' : ''} white-space:nowrap;">${display}</td>`);
            td.data('raw', val);
            tr.append(td);
        });

        // Row click to toggle select
        tr.on('click', function (e) {
            if ($(e.target).is('input, button, i')) return;
            const $cb = $(this).find('.browse-row-cb');
            $cb.prop('checked', !$cb.is(':checked')).trigger('change');
        });



















        const $td = $row.find(`td:eq(${i + 2})`);
        rowData[col] = $td.data('raw');
    });

    $('#dbEditRowTitle').text('Edit Row');
    $('#dbEditRowSubtitle').text(`Table: ${tableName}`);
    $('#dbEditRowPkInfo').text(`${browsePkColumn} = ${pkVal}`);

    const body = $('#dbEditRowBody');
    body.empty();

    browseColumns.forEach(col => {
        const isPk = col === browsePkColumn;
        const val = rowData[col];
        const isNull = val === null || val === undefined;
        const displayVal = isNull ? '' : String(val);

        const group = $(`
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <label class="form-label small fw-semibold mb-0" style="color: ${isPk ? '#a78bfa' : '#a1a1aa'}; letter-spacing:.3px; text-transform:uppercase; font-size:.72rem;">
                        ${isPk ? '<i class="bi bi-key-fill me-1"></i>' : ''}${col}${isPk ? ' <span class="text-muted">(PK)</span>' : ''}
                    </label>
                    <div class="form-check form-switch mb-0">
                        <input class="form-check-input edit-null-toggle" type="checkbox" id="nullToggle_${col}" role="switch" ${isNull ? 'checked' : ''} ${isPk ? 'disabled' : ''}>
                        <label class="form-check-label text-muted" style="font-size:0.72rem;" for="nullToggle_${col}">NULL</label>
                    </div>
                </div>
  



                    value="${escapeHtml(displayVal)}"
                    ${isPk ? 'readonly style="opacity:0.5; cursor:not-allowed;"' : ''}
                    ${isNull ? 'placeholder="NULL" disabled' : ''}
                    style="font-size:0.83rem; border-radius:7px;"
                >
            </div>
        `);

        // Wire null toggle
        group.find('.edit-null-toggle').on('change', function () {
            const $input = group.find('.edit-row-field');
            if ($(this).is(':checked')) {
                $input.val('').prop('disabled', true).attr('placeholder', 'NULL');
            } else {
                $input.prop('disabled', false).attr('placeholder', '').focus();
            }
        });

        body.append(group);
    });

    // Wire save button
    $('#btnDbSaveRow').off('click').on('click', function () {
        saveRowEdit(tableName, pkVal);
    });

    new bootstrap.Modal(document.getElementById('dbEditRowModal')).show();
}

function saveRowEdit(tableName, pkVal) {
    const rowData = {};
    let hasError = false;

    $('#dbEditRowBody .edit-row-field').each(function () {
        const col = $(this).data('col');
        if (col === browsePkColumn) return; // skip PK
        const nullToggle = $(`#nullToggle_${col}`);
        if (nullToggle.is(':checked')) {
            rowData[col] = '__NULL__';
        } else {
            rowData[col] = $(this).val();
        }
    });

    if (hasError) return;

    const $btn = $('#btnDbSaveRow');
    $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>Saving...');

    fetch('api.php?action=mysql_update_row', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            db_name: dbState.currentDb,
            table: tableName,
            pk_column: browsePkColumn,
            pk_value: pkVal,
            row_data: rowData
        })
    })
    .then(r => r.json())
    .then(res => {
        $btn.prop('disabled', false).html('<i class="bi bi-check-lg me-1"></i>Save Changes');
        if (res.success) {
            bootstrap.Modal.getInstance(document.getElementById('dbEditRowModal')).hide();
            showToast(`Row updated successfully (${res.affected} affected)`);
            browseTable(tableName, dbState.currentBrowsePage);
        } else {
            showToast(res.error || 'Update failed', 'danger');
        }
    })
    .catch(err => {
        $btn.prop('disabled', false).html('<i class="bi bi-check-lg me-1"></i>Save Changes');
        showToast(err.message, 'danger');
    });
}

function deleteSelectedRows(tableName, pkValues) {
    fetch('api.php?action=mysql_delete_rows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            db_name: dbState.currentDb,
            table: tableName,
            pk_column: browsePkColumn,
            pk_values: pkValues
        })
    })
    .then(r => r.json())
    .then(res => {
        if (res.success) {
            showToast(`Deleted ${res.affected} row${res.affected !== 1 ? 's' : ''} from ${tableName}`);
            selectedRowKeys.clear();
            browseTable(tableName, dbState.currentBrowsePage);




    .catch(err => showToast(err.message, 'danger'));
}

// ─── Table Columns (Structure) Tab ───────────────────────────────────────────

export function loadTableStructure(tableName) {
    setActiveTable(tableName);
    switchDbTab('columns');

    $('#dbColumnsPlaceholder').addClass('d-none');
    $('#dbColumnsContent').removeClass('d-none');
    $('#dbColumnsTableTitle').text(tableName);
    $('#dbColumnsTbody').html(`<tr><td colspan="7" class="text-center text-muted py-3"><div class="spinner-border spinner-border-sm me-2"></div>Loading...</td></tr>`);

    fetch('api.php?action=mysql_table_structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ db_name: dbState.currentDb, table: tableName })
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
            else if (key.toLowerCase() === 'mul') keyBadge = '<span class="key-badge mul">MUL<













                    <td class="px-3 py-2 font-monospace text-info" style="font-size:0.8rem;">${escapeHtml(col.Type || col.type)}</td>
                    <td class="px-3 py-2 font-monospace text-info" style="font-size:0.8rem;">${escapeHtml(col.Type || col.type)}</td>
                    <td class="px-3 py-2">${nullable}</td>
                    <td class="px-3 py-2">${keyBadge}</td>
                    <td class="px-3 py-2 text-muted">${defaultVal}</td>
                    <td class="px-3 py-2 text-muted" style="font-size:0.78rem;">${escapeHtml(col.Extra || col.extra || '')}</td>
                </tr>
            `);
        });
    })
    .catch(err => {
        $('#dbColumnsTbody').html(`<tr><td colspan="7" class="text-danger px-3 py-3">${err.message}</td></tr>`);
    });
}

// ─── DDL Actions ─────────────────────────────────────────────────────────────

export function truncateTable(tableName) {
    fetch('api.php?action=mysql_truncate_table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ db_name: dbState.currentDb, table: tableName })
    })
    .then(r => r.json())
    .then(res => {
        if (res.success) {
            showToast(`Table "${tableName}" emptied successfully`);
            import('./db.js').then(m => m.loadDbStructure());
        } else {
            showToast(res.error, 'danger');
        }
    })
    .catch(err => showToast(err.message, 'danger'));
}

export function dropTable(tableName) {
    fetch('api.php?action=mysql_drop_table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ db_name: dbState.currentDb, table: tableName })
    })
    .then(r => r.json())
    .then(res => {
        if (res.success) {
            showToast(`Table "${tableName}" dropped`);
            if (dbState.currentBrowseTable === tableName) {
                dbState.currentBrowseTable = '';
                $('#dbActiveTableBadge').hide();
            }
            import('./db.js').then(m => m.loadDbStructure());
        } else {
            showToast(res.error, 'danger');
        }
    })
    .catch(err => showToast(err.message, 'danger'));
}





























































































































































































































                length: length,
                nullable: nullable,
                default_type: defaultType,
                default_value: defaultValue,
                ai: ai,
                index: index
            })
        })
        .then(r => r.json())
        .then(res => {
            $btn.prop('disabled', false).html('<i class="bi bi-check-lg me-1"></i>Save Column');
            if (res.success) {
                bootstrap.Modal.getInstance(document.getElementById('dbColumnModal')).hide();
                showToast(isEdit ? `Column "${colName}" modified successfully` : `Column "${colName}" added successfully`);
                loadTableStructure(tableName);
            } else {
                showToast(res.error || 'Save failed', 'danger');
            }
        })
        .catch(err => {
            $btn.prop('disabled', false).html('<i class="bi bi-check-lg me-1"></i>Save Column');
            showToast(err.message, 'danger');
        });
    });

    new bootstrap.Modal(document.getElementById('dbColumnModal')).show();
}

// ─── DDL Actions ─────────────────────────────────────────────────────────────

export function truncateTable(tableName) {
    fetch('api.php?action=mysql_truncate_table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ db_name: dbState.currentDb, table: tableName })
    })
    .then(r => r.json())
    .then(res => {
        if (res.success) {
            showToast(`Table "${tableName}" emptied successfully`);
            import('./db.js').then(m => m.loadDbStructure());
        } else {
            showToast(res.error, 'danger');
        }
    })
    .catch(err => showToast(err.message, 'danger'));
}

export function dropTable(tableName) {
    fetch('api.php?action=mysql_drop_table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ db_name: dbState.currentDb, table: tableName })
    })
    .then(r => r.json())
    .then(res => {
        if (res.success) {
            showToast(`Table "${tableName}" dropped`);
            if (dbState.currentBrowseTable === tableName) {
                dbState.currentBrowseTable = '';
                $('#dbActiveTableBadge').hide();
            }
            import('./db.js').then(m => m.loadDbStructure());
        } else {
            showToast(res.error, 'danger');
        }
    })
    .catch(err => showToast(err.message, 'danger'));
}
