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
        $('#dbSidebar').removeClass('d-none');
        $('#monaco-container').addClass('d-none');
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