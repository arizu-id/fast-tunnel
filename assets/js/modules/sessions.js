import { state } from './state.js';
import { showToast, showConfirmModal } from './ui.js';
import { encryptData, decryptData, cryptoState } from './crypto.js';
import { setLoading, withLoading } from './loading.js';
import { connectSession, disconnectUI } from './ftp.js';
import { connectMysql } from './db.js';
import { connectSsh } from './ssh.js';
let sessionsCache = [];
function csrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.content || '';
}
function apiPost(url, body = {}) {
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken()
        },
        body: JSON.stringify(body)
    }).then(r => r.json());
}
export function loadSessions() {
    const $list = $('#sessionList');
    setLoading($list, true, { overlay: true });
    return fetch('/api/sessions_list')
    .then(r => r.json())
    .then(res => {
        if (!res.success) return;
        sessionsCache = res.sessions || [];
        renderSessionList(sessionsCache);
    })
    .catch(() => {
        $('#sessionList').html('<div class="text-muted small text-center p-3 opacity-50">Failed to load sessions</div>');
    })
    .finally(() => setLoading($list, false));
}
function renderSessionList(sessions) {
    const $list = $('#sessionList');
    $list.empty();
    if (sessions.length === 0) {
        $list.append('<div class="text-muted small text-center p-3 opacity-50">No saved sessions</div>');
        return;
    }
    sessions.forEach(session => {
        const proto = session.protocol || 'ftp';
        const protocolIcon = proto === 'mysql' ? 'bi-database' : proto === 'ssh' ? 'bi-terminal' : proto === 'sftp' ? 'bi-shield-lock' : 'bi-hdd-network';
        const protocolColor = proto === 'mysql' ? 'text-warning' : proto === 'ssh' ? 'text-success' : 'text-info';
        const item = $(`
            <div class="session-item d-flex justify-content-between align-items-center" data-id="${session.id}">
                <div class="d-flex align-items-center overflow-hidden">
                    <i class="bi ${protocolIcon} me-2 ${protocolColor} fs-5"></i>
                    <div class="d-flex flex-column text-truncate">
                        <strong class="text-truncate">${session.name}</strong>
                        <small class="text-muted" style="font-size: 0.7rem;">${proto.toUpperCase()}</small>
                    </div>
                </div>
                <div class="d-flex align-items-center gap-1">
                    <button class="btn btn-sm btn-icon text-danger btn-delete-session p-0" title="Delete">
                        <i class="bi bi-trash3"></i>
                    </button>
                </div>
            </div>
        `);
        item.click(function(e) {
            if (!$(e.target).closest('.btn-delete-session').length) {
                $('.session-item').removeClass('active');
                $(this).addClass('active');
                if (proto === 'ftp' || proto === 'sftp') {
                    connectSession(session.id, session);
                } else if (proto === 'mysql') {
                    connectMysql(session.id, session);
                } else if (proto === 'ssh') {
                    connectSsh(session.id, session);
                }
            }
        });
        item.find('.btn-delete-session').click(function(e) {
            e.stopPropagation();
            deleteSession(session.id);
        });
        $list.append(item);
    });
}
export function saveSession() {
    const protocol = $('#sessionProtocol').val() || 'ftp';
    const nameInput = $('input[name="name"]').val().trim();
    let host = '';
    let port = 21;
    let user = '';
    let password = '';
    let db_name = '';
    if (protocol === 'ftp' || protocol === 'sftp') {
        host = $('input[name="host"]').val();
        port = $('input[name="port"]').val();
        user = $('input[name="user"]').val();
        password = $('input[name="password"]').val();
    } else if (protocol === 'mysql') {
        host = $('input[name="mysql_host"]').val();
        port = $('input[name="mysql_port"]').val();
        user = $('input[name="mysql_user"]').val();
        password = $('input[name="mysql_password"]').val();
        db_name = $('input[name="mysql_db"]').val().trim();
    } else if (protocol === 'ssh') {
        host = $('input[name="ssh_host"]').val();
        port = $('input[name="ssh_port"]').val();
        user = $('input[name="ssh_user"]').val();
        password = $('input[name="ssh_password"]').val();
    }
    if (!host || !user) {
        showToast('Host and Username are required', 'danger');
        return;
    }
    const body = {
        protocol: protocol,
        name: nameInput || `${user}@${host} (${protocol.toUpperCase()})`,
        host: host,
        port: parseInt(port),
        user: user,
        password: password,
        db_name: db_name
    };
    const hasProxyPlugin = window.FAST_TUNNEL_PLUGINS && window.FAST_TUNNEL_PLUGINS.includes('proxy');
    if (hasProxyPlugin) {
        body.extra = {
            use_proxy: $('#useProxy').is(':checked'),
            proxy_host: $('input[name="proxy_host"]').val().trim(),
            proxy_port: parseInt($('input[name="proxy_port"]').val()) || 0,
            proxy_type: $('select[name="proxy_type"]').val(),
            proxy_user: $('input[name="proxy_user"]').val().trim(),
            proxy_password: $('input[name="proxy_password"]').val().trim()
        };
    }
    return withLoading($('#btnSaveSession'), apiPost('/api/sessions_create', body), { text: 'Saving...' })
    .then(res => {
        if (!res.success) throw new Error(res.error || 'Failed to save');
        bootstrap.Modal.getInstance(document.getElementById('addSessionModal')).hide();
        $('#addSessionForm')[0].reset();
        $('#proxyFields').addClass('d-none');
        showToast('Session saved');
        loadSessions();
    })
    .catch(err => showToast(err.message, 'danger'));
}
export function deleteSession(id) {
    showConfirmModal(
        'Delete Session',
        'Are you sure you want to delete this session?',
        'Delete',
        'btn-danger',
        function() {
            const $item = $('.session-item').filter((_, el) => $(el).attr('data-id') === id);
            return withLoading($item, apiPost('/api/sessions_delete', { id: id }))
            .then(res => {
                if (!res.success) throw new Error(res.error);
                showToast('Session deleted');
                loadSessions();
                if (state.currentSessionId === id) {
                    disconnectUI();
                }
            })
            .catch(err => showToast(err.message, 'danger'));
        }
    );
}
export function editSession(id) {
    const session = sessionsCache.find(s => s.id === id);
    if (!session) return;
    const proto = session.protocol || 'ftp';
    $('#editSessionId').val(id);
    $('#editSessionProtocol').val(proto);
    $('#editSessionName').val(session.name || '');
    $('.edit-protocol-group').addClass('d-none');
    if (proto === 'ftp' || proto === 'sftp') {
        $('#editFtpFields').removeClass('d-none');
        $('#editFtpHost').val(session.host || '');
        $('#editFtpPort').val(session.port || 21);
        $('#editFtpUser').val(session.user || '');
        $('#editFtpPassword').val('');
    } else if (proto === 'mysql') {
        $('#editMysqlFields').removeClass('d-none');
        $('#editMysqlHost').val(session.host || '');
        $('#editMysqlPort').val(session.port || 3306);
        $('#editMysqlUser').val(session.user || '');
        $('#editMysqlPassword').val('');
        $('#editMysqlDb').val(session.db_name || '');
    } else if (proto === 'ssh') {
        $('#editSshFields').removeClass('d-none');
        $('#editSshHost').val(session.host || '');
        $('#editSshPort').val(session.port || 22);
        $('#editSshUser').val(session.user || '');
        $('#editSshPassword').val('');
    }
    $('.edit-pw-toggle').off('click').on('click', function() {
        const target = $(this).data('target');
        const inp = $('#' + target);
        const isPass = inp.attr('type') === 'password';
        inp.attr('type', isPass ? 'text' : 'password');
        $(this).find('i').toggleClass('bi-eye bi-eye-slash');
    });
    $('#btnSaveEditSession').off('click').on('click', function() {
        saveEditSession();
    });
    new bootstrap.Modal(document.getElementById('editSessionModal')).show();
}
function saveEditSession() {
    const id = $('#editSessionId').val();
    if (!id) return;
    const session = sessionsCache.find(s => s.id === id);
    if (!session) return;
    const proto = session.protocol || 'ftp';
    const name = $('#editSessionName').val().trim();
    let host, port, user, password, dbName;
    if (proto === 'ftp' || proto === 'sftp') {
        host = $('#editFtpHost').val().trim();
        port = parseInt($('#editFtpPort').val()) || (proto === 'sftp' ? 22 : 21);
        user = $('#editFtpUser').val().trim();
        password = $('#editFtpPassword').val();
    } else if (proto === 'mysql') {
        host = $('#editMysqlHost').val().trim();
        port = parseInt($('#editMysqlPort').val()) || 3306;
        user = $('#editMysqlUser').val().trim();
        password = $('#editMysqlPassword').val();
        dbName = $('#editMysqlDb').val().trim();
    } else if (proto === 'ssh') {
        host = $('#editSshHost').val().trim();
        port = parseInt($('#editSshPort').val()) || 22;
        user = $('#editSshUser').val().trim();
        password = $('#editSshPassword').val();
    }
    if (!host || !user) {
        showToast('Host and Username are required', 'danger');
        return;
    }
    const body = { id: id, name: name || `${user}@${host} (${proto.toUpperCase()})`, host, port, user };
    if (password) body.password = password;
    if (proto === 'mysql' && dbName !== undefined) body.db_name = dbName;
    return withLoading($('#btnSaveEditSession'), apiPost('/api/sessions_update', body), { text: 'Saving...' })
    .then(res => {
        if (!res.success) throw new Error(res.error || 'Failed to update');
        bootstrap.Modal.getInstance(document.getElementById('editSessionModal')).hide();
        showToast('Session updated successfully');
        loadSessions();
    })
    .catch(err => showToast(err.message, 'danger'));
}
export function exportSessions() {
    if (sessionsCache.length === 0) {
        showToast('No sessions to export', 'danger');
        return;
    }
    new bootstrap.Modal(document.getElementById('exportPasswordModal')).show();
}
export function doExportWithPassword() {
    return withLoading($('#btnConfirmExport'), runExport(), { text: 'Exporting...' });
}
async function runExport() {
    const password = $('#exportPasswordInput').val();
    if (!password) {
        showToast('Please enter a password', 'danger');
        return;
    }
    try {
        const res = await fetch('/api/sessions_export', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken()
            },
            body: '{}'
        }).then(r => r.json());
        if (!res.success) throw new Error(res.error);
        const plainText = JSON.stringify({
            exported_at: new Date().toISOString(),
            app: 'Fast Tunnel - Arizu Studio',
            sessions: res.sessions
        });
        const encrypted = await encryptData(password, plainText);
        const payload = JSON.stringify({ encrypted: true, v: 1, data: encrypted });
        const blob = new Blob([payload], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ft-sessions-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        bootstrap.Modal.getInstance(document.getElementById('exportPasswordModal')).hide();
        showToast('Sessions exported successfully');
    } catch (err) {
        showToast('Export failed: ' + err.message, 'danger');
    }
}
export function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        try {
            const raw = JSON.parse(ev.target.result);
            if (raw.encrypted) {
                cryptoState.pendingImportData = raw;
                new bootstrap.Modal(document.getElementById('importPasswordModal')).show();
            } else {
                processImportData(raw);
            }
        } catch (err) {
            showToast('Invalid session file', 'danger');
        }
    };
    reader.readAsText(file);
}
export function doImportWithPassword() {
    return withLoading($('#btnConfirmImport'), runImport(), { text: 'Decrypting...' });
}
async function runImport() {
    const password = $('#importPasswordInput').val();
    if (!password || !cryptoState.pendingImportData) {
        showToast('Please enter the decryption password', 'danger');
        return;
    }
    try {
        const plainText = await decryptData(password, cryptoState.pendingImportData.data);
        const data = JSON.parse(plainText);
        bootstrap.Modal.getInstance(document.getElementById('importPasswordModal')).hide();
        processImportData(data);
    } catch (err) {
        showToast('Wrong password or corrupted file', 'danger');
    }
    cryptoState.pendingImportData = null;
}
export function processImportData(data) {
    const incoming = Array.isArray(data) ? data : (data.sessions || []);
    if (!Array.isArray(incoming) || incoming.length === 0) {
        showToast('Invalid or empty session file', 'danger');
        return;
    }
    const valid = incoming.filter(s => s.host && s.user);
    if (valid.length === 0) {
        showToast('No valid sessions found in file', 'danger');
        return;
    }
    const importPayload = valid.map(s => ({
        protocol: s.protocol || 'ftp',
        name: s.name || `${s.user}@${s.host}`,
        host: s.host,
        port: s.port || 21,
        user: s.user,
        password: s.password ? (atob(s.password)) : '',
        db_name: s.db_name || '',
        extra: s.extra || null
    }));
    return withLoading($('#sessionList'), apiPost('/api/sessions_import', { sessions: importPayload }), { overlay: true })
    .then(res => {
        if (!res.success) throw new Error(res.error);
        loadSessions();
        showToast(`Imported ${res.added} new session(s)`);
    })
    .catch(err => showToast(err.message, 'danger'));
}
export async function exportSingleSession(id) {
    const session = sessionsCache.find(s => s.id === id);
    if (!session) return;
    const password = prompt('Enter a password to encrypt the exported session:');
    if (!password) return;
    try {
        const plainText = JSON.stringify({
            exported_at: new Date().toISOString(),
            app: 'Fast Tunnel - Arizu Studio',
            sessions: [session]
        });
        const encrypted = await encryptData(password, plainText);
        const payload = JSON.stringify({ encrypted: true, v: 1, data: encrypted });
        const blob = new Blob([payload], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeName = (session.name || 'session').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        a.download = `session-${safeName}-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(`Session "${session.name}" exported successfully`);
    } catch (err) {
        showToast('Export failed: ' + err.message, 'danger');
    }
}