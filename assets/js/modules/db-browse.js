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
        if (col === browsePkColumn) return; 
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