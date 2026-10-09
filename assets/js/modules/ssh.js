import { state } from './state.js';
import { showToast } from './ui.js';
import { setLoading } from './loading.js';
let term = null;
let fitAddon = null;
let sseSource = null;
export function connectSsh(sessionId, session) {
    if (state.isConnecting) {
        showToast('Connection in progress, please wait...', 'warning');
        return;
    }
    state.isConnecting = true;
    state.currentSessionId = sessionId;
    state.currentProtocol = 'ssh';
    const password = session.password ? atob(session.password) : '';
    showToast('Connecting to SSH...', 'info');
    $('.session-item').addClass('pe-none opacity-50');
    setLoading($('.session-item.active'), true);
    $('#connectionStatus').html(`<span class="text-info"><i class="bi bi-arrow-repeat spin me-2 d-inline-block"></i>Connecting to ${session.name}...</span>`);
    fetch('/api/ssh_connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            host: session.host,
            port: session.port,
            user: session.user,
            password: password,
            cols: 80,
            rows: 24
        })
    })
    .then(r => {
        if (!r.ok) return r.json().then(e => { throw new Error(e.error || 'Connection failed'); });
        return r.json();
    })
    .then(res => {
        if (!res.success) throw new Error(res.error || 'Connection failed');
        showToast('SSH connected — terminal ready');
        $('#connectionStatus').html(`<span class="text-success"><i class="bi bi-link-45deg me-2 fs-5"></i>Connected to ${session.name}</span>`);
        $('#welcomeArea').addClass('d-none');
        $('#workspaceArea').removeClass('d-none');
        $('#ftpSidebar').addClass('d-none');
        $('#dbSidebar').addClass('d-none');
        $('#sshSidebar').removeClass('d-none').addClass('d-flex');
        buildSshSidebar(session);
        if (state.openTabs && state.openTabs.length > 0) {
            state.openTabs.forEach(t => { if (t.model) t.model.dispose(); });
            state.openTabs = [];
            state.currentOpenedFile = null;
        }
        $('#editorTabs').empty();
        $('.editor-tabs-container').addClass('d-none');
        $('#monaco-container').addClass('d-none');
        $('#floatingActionPanel').addClass('d-none');
        $('#editorPlaceholder').addClass('d-none');
        $('#db-container').addClass('d-none');
        $('#terminal-container').removeClass('d-none').addClass('d-flex');
        initTerminal(session);
        loadServerInfo();
        state.isConnecting = false;
        $('.session-item').removeClass('pe-none opacity-50');
        setLoading($('.session-item'), false);
    })
    .catch(err => {
        showToast(err.message || 'SSH connection failed', 'danger');
        $('#connectionStatus').html(`<span class="text-danger"><i class="bi bi-x-circle me-2"></i>${err.message || 'Connection failed'}</span>`);
        state.isConnecting = false;
        state.currentProtocol = null;
        state.currentSessionId = null;
        $('.session-item').removeClass('pe-none opacity-50');
        setLoading($('.session-item'), false);
    });
}
function buildSshSidebar(session) {
    const $sidebar = $('#sshSidebar');
    $sidebar.empty().html(`
        <div class="p-2 border-bottom border-secondary d-flex justify-content-between align-items-center bg-dark panel-header">
            <span class="small text-muted text-uppercase fw-semibold ms-2" style="letter-spacing:0.5px;">Server Info</span>
            <button class="btn btn-sm btn-icon text-danger btn-ssh-disconnect" title="Disconnect"><i class="bi bi-power"></i></button>
        </div>
        <div class="flex-grow-1 overflow-auto p-3" id="sshServerInfo">
            <div class="text-muted small p-2 opacity-50"><i class="bi bi-arrow-repeat spin me-1"></i>Loading server info...</div>
        </div>
        <div class="p-2 border-top border-secondary" style="flex-shrink:0;">
            <button class="btn btn-sm btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2 btn-ssh-disconnect-bottom" style="border-radius:8px;padding:8px 0;font-size:0.82rem;">
                <i class="bi bi-box-arrow-left"></i>Disconnect
            </button>
        </div>
    `);
    $sidebar.find('.btn-ssh-disconnect, .btn-ssh-disconnect-bottom').on('click', () => disconnectSsh());
}
function loadServerInfo() {
    fetch('/api/ssh_get_server_info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
    })
    .then(r => r.json())
    .then(res => {
        if (!res.success) return;
        const i = res.info;
        const disk = (i.disk || '').split('||');
        const diskTotal = disk[0] || '?';
        const diskUsed = disk[1] || '?';
        const diskPercent = disk[2] || '?';
        let html = `
            <div class="mb-2 pb-2 border-bottom border-secondary">
                <div class="ssh-info-label">Hostname</div>
                <div class="text-light" style="font-size:0.82rem;font-weight:600;">${i.hostname || 'Unknown'}</div>
            </div>
            <div class="mb-2 pb-2 border-bottom border-secondary">
                <div class="ssh-info-label">System</div>
                <div class="text-light" style="font-size:0.78rem;">${i.distro || i.os}</div>
                <div class="text-muted" style="font-size:0.72rem;">Kernel: ${i.kernel} · ${i.arch}</div>
            </div>
            <div class="mb-2 pb-2 border-bottom border-secondary">
                <div class="ssh-info-label">CPU</div>
                <div class="text-light" style="font-size:0.78rem;">${i.cpu}</div>
                <div class="text-muted" style="font-size:0.72rem;">${i.cores} core${i.cores !== '1' ? 's' : ''} · Load: ${i.load}</div>
            </div>
            <div class="mb-2 pb-2 border-bottom border-secondary">
                <div class="ssh-info-label">Memory</div>
                <div class="d-flex justify-content-between">
                    <span class="text-light" style="font-size:0.78rem;">Total: <strong>${i.ram}</strong></span>
                    <span style="font-size:0.78rem;color:var(--accent);">Used: <strong>${i.ram_used}</strong></span>
                </div>
            </div>
            <div class="mb-2 pb-2 border-bottom border-secondary">
                <div class="ssh-info-label">Disk (root)</div>
                <div class="d-flex justify-content-between">
                    <span class="text-light" style="font-size:0.78rem;">Total: <strong>${diskTotal}</strong></span>
                    <span style="font-size:0.78rem;color:var(--accent);">Used: <strong>${diskUsed}</strong> (${diskPercent})</span>
                </div>
            </div>
            <div class="mb-2 pb-2 border-bottom border-secondary">
                <div class="ssh-info-label">Uptime</div>
                <div class="text-light" style="font-size:0.78rem;">${i.uptime}</div>
            </div>`;
        if (i.ipinfo) {
            const ip = i.ipinfo;
            const flag = ip.country_code ? String.fromCodePoint(...[...ip.country_code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)) : '';
            html += `
            <div class="mb-2 pb-2 border-bottom border-secondary">
                <div class="ssh-info-label">Public IP</div>
                <div class="text-light" style="font-size:0.82rem;font-weight:600;font-family:monospace;">${ip.ip || '?'}</div>
                <div class="text-muted" style="font-size:0.72rem;">${ip.type || ''}</div>
            </div>
            <div class="mb-2 pb-2 border-bottom border-secondary">
                <div class="ssh-info-label">Location ${flag}</div>
                <div class="text-light" style="font-size:0.78rem;">${ip.city || '?'}, ${ip.region || '?'}</div>
                <div class="text-muted" style="font-size:0.72rem;">${ip.country || '?'} (${ip.country_code || '?'})</div>
                <div class="text-muted" style="font-size:0.72rem;">Lat: ${ip.latitude || '?'} · Lon: ${ip.longitude || '?'}</div>
            </div>
            <div class="mb-2 pb-2 border-bottom border-secondary">
                <div class="ssh-info-label">ISP / Network</div>
                <div class="text-light" style="font-size:0.78rem;">${ip.connection?.isp || ip.isp || '?'}</div>
                <div class="text-muted" style="font-size:0.72rem;">ASN: ${ip.connection?.asn || ip.asn || '?'} · ${ip.connection?.org || ip.org || ''}</div>
            </div>
            <div class="mb-2">
                <div class="ssh-info-label">Timezone</div>
                <div class="text-light" style="font-size:0.78rem;">${ip.timezone?.id || ip.timezone || '?'}</div>
                <div class="text-muted" style="font-size:0.72rem;">UTC${ip.timezone?.utc || ''}</div>
            </div>`;
        }
        $('#sshServerInfo').html(html);
    })
    .catch(() => {
        $('#sshServerInfo').html('<div class="text-muted small p-2 opacity-50">Could not load server info</div>');
    });
}
function initTerminal(session) {
    const container = document.getElementById('sshTerminal');
    if (!container) return;
    if (term) { term.dispose(); term = null; }
    if (sseSource) { sseSource.close(); sseSource = null; }
    term = new Terminal({
        cursorBlink: true,
        fontFamily: 'Consolas, "Cascadia Code", "JetBrains Mono", "Courier New", monospace',
        fontSize: 13,
        lineHeight: 1.4,
        theme: {
            background: '#0f0f12',
            foreground: '#e4e4e7',
            cursor: '#10b981',
            cursorAccent: '#0f0f12',
            black: '#18181b',
            red: '#ef4444',
            green: '#10b981',
            yellow: '#f59e0b',
            blue: '#3b82f6',
            magenta: '#a855f7',
            cyan: '#06b6d4',
            white: '#e4e4e7',
            brightBlack: '#3f3f46',
            brightRed: '#f87171',
            brightGreen: '#34d399',
            brightYellow: '#fbbf24',
            brightBlue: '#60a5fa',
            brightMagenta: '#c084fc',
            brightCyan: '#22d3ee',
            brightWhite: '#fafafa',
        },
        scrollback: 5000,
        allowTransparency: true,
        convertEol: false,
    });
    fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);
    term.open(container);
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            try {
                fitAddon.fit();
                sendResize(term.cols, term.rows);
            } catch(e) {}
        });
    });
    let resizeTimer = null;
    const resizeObserver = new ResizeObserver(() => {
        if (fitAddon && term) {
            try { fitAddon.fit(); } catch(e) {}
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (term) sendResize(term.cols, term.rows);
            }, 200);
        }
    });
    resizeObserver.observe(container);
    term.write('\x1b[1;32mWelcome to Fast Tunnel · Realtime SSH Terminal\x1b[0m\r\n');
    term.write(`\x1b[0;90mConnected to \x1b[0;36m${session.user}@${session.host}\x1b[0;90m via PTY\x1b[0m\r\n\r\n`);
    connectSSE();
    term.onData(data => {
        if (data === '\x03' && term.hasSelection()) {
            try {
                navigator.clipboard.writeText(term.getSelection());
                term.clearSelection();
            } catch(e) {}
            return;
        }
        sendInput(data);
    });
    term.onKey(({ key, domEvent }) => {
        if (domEvent.ctrlKey && domEvent.key === 'v') {
            navigator.clipboard.readText().then(text => {
                sendInput(text);
            }).catch(() => {});
        }
    });
    container.addEventListener('click', () => { term.focus(); });
}
function connectSSE() {
    if (sseSource) { sseSource.close(); sseSource = null; }
    sseSource = new EventSource('/api/ssh_stream_output');
    sseSource.onmessage = function(e) {
        try {
            const msg = JSON.parse(e.data);
            if (msg.output && term) {
                term.write(msg.output);
            } else if (msg.closed) {
                if (term) term.write('\r\n\x1b[1;31m[Connection closed]\x1b[0m\r\n');
                sseSource.close();
                sseSource = null;
            } else if (msg.error) {
                if (term) term.write('\r\n\x1b[1;31m[Error: ' + msg.error + ']\x1b[0m\r\n');
                sseSource.close();
                sseSource = null;
            }
        } catch(err) {}
    };
    sseSource.onerror = function() {
        if (sseSource && sseSource.readyState === EventSource.CLOSED) {
            if (term) term.write('\r\n\x1b[1;31m[SSE connection lost]\x1b[0m\r\n');
            sseSource = null;
        }
    };
}
function disconnectSsh() {
    if (sseSource) { sseSource.close(); sseSource = null; }
    if (term) { term.dispose(); term = null; }
    fetch('/api/ssh_disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
    }).catch(() => {});
    $('#terminal-container').addClass('d-none').removeClass('d-flex');
    $('#workspaceArea').addClass('d-none');
    $('#welcomeArea').removeClass('d-none');
    $('#sshSidebar').addClass('d-none').removeClass('d-flex');
    $('#connectionStatus').html('');
    state.currentSessionId = null;
    state.currentProtocol = null;
    showToast('Disconnected from SSH');
}
function sendInput(data) {
    fetch('/api/ssh_send_input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: data })
    }).catch(() => {});
}
function sendResize(cols, rows) {
    fetch('/api/ssh_resize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cols: cols, rows: rows })
    }).catch(() => {});
}