import { SESSIONS_KEY, SESSION_EXPIRY_DAYS, state } from './state.js';
import { showToast, showConfirmModal } from './ui.js';
import { encryptData, decryptData, cryptoState } from './crypto.js';
import { connectSession, disconnectUI } from './ftp.js';
import { connectMysql } from './db.js';
import { connectSsh } from './ssh.js';
export function getSavedSessions() {
    try {
        const data = localStorage.getItem(SESSIONS_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}
export function setSavedSessions(sessions) {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}
export function loadSessions() {
    let sessions = getSavedSessions();
    if (sessions.length === 0) {
        const oldData = localStorage.getItem('ftp_manager_sessions');
        if (oldData) {
            localStorage.setItem('fast_tunnel_sessions', oldData);
            localStorage.removeItem('ftp_manager_sessions');
            sessions = JSON.parse(oldData);
        }
    }
    const now = Date.now();
    let updated = false;
    const validSessions = sessions.filter(session => {
        const ageMs = now - session.createdAt;
        const maxAgeMs = SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
        if (ageMs > maxAgeMs) {
            updated = true;
            return false;
        }
        return true;
    });
    if (updated) {
        sessions = validSessions;
        setSavedSessions(sessions);
    }
    const $list = $('#sessionList');
    $list.empty();
    if (sessions.length === 0) {
        $list.append('<div class="text-muted small text-center p-3 opacity-50">No saved sessions</div>');
        return;
    }
    sessions.forEach(session => {
        const proto = session.protocol || 'ftp';
        const protocolIcon = proto === 'mysql' ? 'bi-database' : proto === 'ssh' ? 'bi-terminal' : 'bi-hdd-network';
        const protocolColor = proto === 'mysql' ? 'text-warning' : proto === 'ssh' ? 'text-success' : 'text-info';
        const daysLeft = Math.max(0, Math.ceil((SESSION_EXPIRY_DAYS * 86400000 - (now - session.createdAt)) / 86400000));
        const expiryText = daysLeft <= 5 ? `Expires in ${daysLeft}d` : `${daysLeft}d left`;
        const item = $(`
            <div class="session-item d-flex justify-content-between align-items-center" data-id="${session.id}">
                <div class="d-flex align-items-center overflow-hidden">
                    <i class="bi ${protocolIcon} me-2 ${protocolColor} fs-5"></i>
                    <div class="d-flex flex-column text-truncate">
                        <strong class="text-truncate">${session.name}</strong>
                        <small class="text-muted" style="font-size: 0.7rem;">${expiryText}</small>
                    </div>
                </div>
                <div class="d-flex align-items-center gap-1">
                    <button class="btn btn-sm btn-icon btn-renew-session p-0" title="Renew 30 days" style="color: #71717a;">
                        <i class="bi bi-arrow-repeat"></i>
                    </button>
                    <button class="btn btn-sm btn-icon text-danger btn-delete-session p-0" title="Delete">
                        <i class="bi bi-trash3"></i>
                    </button>
                </div>
            </div>
        `);
        item.click(function(e) {
            if (!$(e.target).closest('.btn-delete-session').length && !$(e.target).closest('.btn-renew-session').length) {
                $('.session-item').removeClass('active');
                $(this).addClass('active');
                if (proto === 'ftp') {
                    connectSession(session.id, session);
                } else if (proto === 'mysql') {
                    connectMysql(session.id, session);
                } else if (proto === 'ssh') {
                    connectSsh(session.id, session);
                }
            }
        });
        item.find('.btn-renew-session').click(function(e) {
            e.stopPropagation();
            renewSession(session.id);
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
    if (protocol === 'ftp') {
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
    const hasProxyPlugin = window.FAST_TUNNEL_PLUGINS && window.FAST_TUNNEL_PLUGINS.includes('proxy');
    const useProxy = hasProxyPlugin ? $('#useProxy').is(':checked') : false;
    const proxyHost = hasProxyPlugin ? $('input[name="proxy_host"]').val().trim() : '';
    const proxyPort = hasProxyPlugin ? $('input[name="proxy_port"]').val().trim() : '';
    const proxyType = hasProxyPlugin ? $('select[name="proxy_type"]').val() : '';
    const proxyUser = hasProxyPlugin ? $('input[name="proxy_user"]').val().trim() : '';
    const proxyPassword = hasProxyPlugin ? $('input[name="proxy_password"]').val().trim() : '';
    if (!host || !user) {
        showToast('Host and Username are required', 'danger');
        return;
    }
    const sessions = getSavedSessions();
    const newSession = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        protocol: protocol,
        host: host,
        port: parseInt(port),
        user: user,
        password: btoa(password),
        name: nameInput || `${user}@${host} (${protocol.toUpperCase()})`,
        db_name: db_name,
        use_proxy: useProxy,
        proxy_host: proxyHost,
        proxy_port: proxyPort ? parseInt(proxyPort) : 0,
        proxy_type: proxyType,
        proxy_user: proxyUser,
        proxy_password: proxyPassword ? btoa(proxyPassword) : '',
        createdAt: Date.now()
    };
    sessions.push(newSession);
    setSavedSessions(sessions);
    bootstrap.Modal.getInstance(document.getElementById('addSessionModal')).hide();
    $('#addSessionForm')[0].reset();
    $('#proxyFields').addClass('d-none');
    showToast('Session saved locally');
    loadSessions();
}
export function deleteSession(id) {
    showConfirmModal(
        'Delete Session',
        'Are you sure you want to delete this session?',
        'Delete',
        'btn-danger',
        function() {
            let sessions = getSavedSessions();
            sessions = sessions.filter(s => s.id !== id);
            setSavedSessions(sessions);
            showToast('Session deleted');
            loadSessions();
            if (state.currentSessionId === id) {
                disconnectUI();
            }
        }
    );
}
export function renewSession(id) {
    let sessions = getSavedSessions();
    const idx = sessions.findIndex(s => s.id === id);
    if (idx === -1) return;
    sessions[idx].createdAt = Date.now();
    setSavedSessions(sessions);
    showToast(`Session "${sessions[idx].name}" renewed for 30 days`);
    loadSessions();
}
export function editSession(id) {
    const sessions = getSavedSessions();
    const session = sessions.find(s => s.id === id);
    if (!session) return;
    $('#editSessionId').val(id);
    $('#editSessionHost').val(session.host || '');
    $('#editSessionName').val(session.name || '');
    $('#editSessionPort').val(session.port || '');
    $('#editSessionUser').val(session.user || '');
    $('#editSessionPassword').val('');
    if ((session.protocol || 'ftp') === 'mysql') {
        $('#editSessionDbNameGroup').show();
        $('#editSessionDbName').val(session.db_name || '');
    } else {
        $('#editSessionDbNameGroup').hide();
        $('#editSessionDbName').val('');
    }
    $('#btnToggleEditPassword').off('click').on('click', function() {
        const inp = $('#editSessionPassword');
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
    let sessions = getSavedSessions();
    const idx = sessions.findIndex(s => s.id === id);
    if (idx === -1) return;
    const host = $('#editSessionHost').val().trim();
    const name = $('#editSessionName').val().trim();
    const port = parseInt($('#editSessionPort').val()) || sessions[idx].port;
    const user = $('#editSessionUser').val().trim();
    const password = $('#editSessionPassword').val();
    const dbName = $('#editSessionDbName').val().trim();
    if (!host || !user) {
        showToast('Host and Username are required', 'danger');
        return;
    }
    sessions[idx].name = name || `${user}@${host} (${(sessions[idx].protocol || 'ftp').toUpperCase()})`;
    sessions[idx].host = host;
    sessions[idx].port = port;
    sessions[idx].user = user;
    if (password) {
        sessions[idx].password = btoa(password);
    }
    if ((sessions[idx].protocol || 'ftp') === 'mysql') {
        sessions[idx].db_name = dbName;
    }
    setSavedSessions(sessions);
    bootstrap.Modal.getInstance(document.getElementById('editSessionModal')).hide();
    showToast('Session updated successfully');
    loadSessions();
}
export function exportSessions() {
    const sessions = getSavedSessions();
    if (sessions.length === 0) {
        showToast('No sessions to export', 'danger');
        return;
    }
    new bootstrap.Modal(document.getElementById('exportPasswordModal')).show();
}
export async function doExportWithPassword() {
    const password = $('#exportPasswordInput').val();
    if (!password) {
        showToast('Please enter a password', 'danger');
        return;
    }
    const sessions = getSavedSessions();
    const plainText = JSON.stringify({
        exported_at: new Date().toISOString(),
        app: 'Fast Tunnel - Arizu Studio',
        sessions
    });
    try {
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
export async function doImportWithPassword() {
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
    const valid = incoming.filter(s => s.host && s.user && s.password);
    if (valid.length === 0) {
        showToast('No valid sessions found in file', 'danger');
        return;
    }
    const existing = getSavedSessions();
    let added = 0;
    valid.forEach(s => {
        const dup = existing.find(e => e.host === s.host && e.user === s.user);
        if (!dup) {
            if (!s.id) s.id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
            if (!s.createdAt) s.createdAt = Date.now();
            if (!s.name) s.name = `${s.user}@${s.host}`;
            existing.push(s);
            added++;
        }
    });
    setSavedSessions(existing);
    loadSessions();
    showToast(`Imported ${added} new session(s)`);
}
export async function exportSingleSession(id) {
    const sessions = getSavedSessions();
    const session = sessions.find(s => s.id === id);
    if (!session) return;
    const { encryptData: enc } = await import('./crypto.js');
    const password = prompt('Enter a password to encrypt the exported session:');
    if (!password) return;
    try {
        const plainText = JSON.stringify({
            exported_at: new Date().toISOString(),
            app: 'Fast Tunnel - Arizu Studio',
            sessions: [session]
        });
        const encrypted = await enc(password, plainText);
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