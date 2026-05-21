import { state } from './state.js';
import { showToast } from './ui.js';
let term = null;
let fitAddon = null;
let sseSource = null;
let commandHistory = [];
let historyIndex = -1;
export function connectSsh(sessionId, session) {
    state.isConnecting = true;
    state.currentSessionId = sessionId;
    state.currentProtocol = 'ssh';
    const password = session.password ? atob(session.password) : '';
    showToast('Connecting to SSH...', 'info');
    $('#connectionStatus').html(`<span class="text-info"><i class="bi bi-arrow-repeat spin me-2 d-inline-block"></i>Connecting to ${session.name}...</span>`);
    fetch('api.php?action=ssh_connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            host: session.host,
            port: session.port,
            user: session.user,
            password: password
        })
    })
    .then(r => {
        if (!r.ok) return r.json().then(e => { throw new Error(e.error || 'Connection failed'); });
        return r.json();
    })
    .then(res => {
        showToast('SSH connected — realtime PTY active');
        $('#connectionStatus').html(`<span class="text-success"><i class="bi bi-link-45deg me-2 fs-5"></i>Connected to ${session.name}</span>`);
        $('#welcomeArea').addClass('d-none');
        $('#workspaceArea').removeClass('d-none');
        $('#ftpSidebar').addClass('d-none');
        $('#dbSidebar').addClass('d-none');
        $('#sshSidebar').removeClass('d-none').addClass('d-flex');
        buildSshSidebar(session);
        $('#fileList').empty();
        $('#currentPath').text('/');
        if (state.openTabs && state.openTabs.length > 0) {
            state.openTabs.forEach(t => { if (t.model) t.model.dispose(); });
            state.openTabs = [];
            state.currentOpenedFile = null;
        }
        $('#editorTabs').empty();
        $('.editor-tabs-container').addClass('d-none');
        $('#monaco-container').addClass('d-none');
        $('#terminal-container').removeClass('d-none').addClass('d-flex');
        $('#editorPlaceholder').addClass('d-none');
        $('#db-container').addClass('d-none');
        initTerminal(session);
        loadServerInfo();
    })
    .catch(err => {
        showToast(err.message || 'SSH connection failed', 'danger');
        $('#connectionStatus').html(`<span class="text-danger"><i class="bi bi-x-circle me-2"></i>${err.message || 'Connection failed'}</span>`);
        state.isConnecting = false;
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
    `);
    $sidebar.find('.btn-ssh-disconnect').on('click', () => disconnectSsh());
}
function loadServerInfo() {
    fetch('api.php?action=ssh_get_server_info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
    })
    .then(r => r.json())
    .then(res => {
        if (!res.success) return;
        const i = res.info;
        $('#sshServerInfo').html(`
            <div class="mb-2 pb-2 border-bottom border-secondary">
                <div class="text-muted mb-1" style="font-size:0.7rem;letter-spacing:.5px;text-transform:uppercase;">System</div>
                <div class="text-light" style="font-size:0.78rem;">${i.distro || i.os}</div>
                <div class="text-muted" style="font-size:0.72rem;">Kernel: ${i.kernel} · ${i.arch}</div>
            </div>
            <div class="mb-2 pb-2 border-bottom border-secondary">
                <div class="text-muted mb-1" style="font-size:0.7rem;letter-spacing:.5px;text-transform:uppercase;">CPU</div>
                <div class="text-light" style="font-size:0.78rem;">${i.cpu}</div>
                <div class="text-muted" style="font-size:0.72rem;">${i.cores} core${i.cores !== '1' ? 's' : ''} · Load: ${i.load}</div>
            </div>
            <div class="mb-2 pb-2 border-bottom border-secondary">
                <div class="text-muted mb-1" style="font-size:0.7rem;letter-spacing:.5px;text-transform:uppercase;">Memory</div>
                <div class="d-flex justify-content-between">
                    <span class="text-light" style="font-size:0.78rem;">Total: <strong>${i.ram}</strong></span>
                    <span style="font-size:0.78rem;color:var(--accent);">Used: <strong>${i.ram_used}</strong></span>
                </div>
            </div>
            <div class="mb-2">
                <div class="text-muted mb-1" style="font-size:0.7rem;letter-spacing:.5px;text-transform:uppercase;">Uptime</div>
                <div class="text-light" style="font-size:0.78rem;">${i.uptime}</div>
            </div>
        `);
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
            try { fitAddon.fit(); } catch(e) {}
        });
    });
    const resizeObserver = new ResizeObserver(() => {
        if (fitAddon && term) {
            try { fitAddon.fit(); } catch(e) {}
        }
    });
    resizeObserver.observe(container);
    sseSource = new EventSource('api.php?action=ssh_stream_output');
    sseSource.onmessage = function(e) {
        const msg = JSON.parse(e.data);
        if (msg.output) {
            term.write(msg.output);
        } else if (msg.closed) {
            term.write('\r\n\x1b[1;31m[Connection closed]\x1b[0m\r\n');
            sseSource.close();
            sseSource = null;
        } else if (msg.error) {
            term.write('\r\n\x1b[1;31m[Error: ' + msg.error + ']\x1b[0m\r\n');
            sseSource.close();
            sseSource = null;
        }
    };
    sseSource.onerror = function() {
        if (sseSource && sseSource.readyState === EventSource.CLOSED) {
            term.write('\r\n\x1b[1;31m[Connection lost]\x1b[0m\r\n');
            sseSource = null;
        }
    };
    term.onData(data => {
        if (data === '\x03' && term.hasSelection()) {
            try {
                navigator.clipboard.writeText(term.getSelection());
                term.clearSelection();
            } catch(e) {}
            return;
        }
        sendInputCommand(data);
    });
    term.onKey(({ key, domEvent }) => {
        if (domEvent.ctrlKey && domEvent.key === 'v') {
            navigator.clipboard.readText().then(text => {
                sendInputCommand(text);
            }).catch(() => {});
        }
    });
    term.write('\x1b[1;32mWelcome to Fast Tunnel · Realtime SSH Terminal\x1b[0m\r\n');
    term.write(`\x1b[0;90mConnected to \x1b[0;36m${session.user}@${session.host}\x1b[0;90m via PTY\x1b[0m\r\n\r\n`);
    const $input = $('#sshConsoleInput');
    const $btn = $('#btnSshSendCmd');
    $input.off('keydown').on('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            executeConsoleCommand();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
                historyIndex++;
                $input.val(commandHistory[commandHistory.length - 1 - historyIndex]);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                $input.val(commandHistory[commandHistory.length - 1 - historyIndex]);
            } else {
                historyIndex = -1;
                $input.val('');
            }
        }
    });
    $btn.off('click').on('click', () => {
        executeConsoleCommand();
    });
    function executeConsoleCommand() {
        const cmd = $input.val();
        if (cmd.length === 0) return;
        sendInputCommand(cmd + '\n');
        if (commandHistory.length === 0 || commandHistory[commandHistory.length - 1] !== cmd) {
            commandHistory.push(cmd);
            if (commandHistory.length > 50) {
                commandHistory.shift();
            }
        }
        historyIndex = -1;
        $input.val('').focus();
    }
    container.addEventListener('click', () => {
        term.focus();
    });
}
function disconnectSsh() {
    if (sseSource) {
        sseSource.close();
        sseSource = null;
    }
    if (term) {
        term.dispose();
        term = null;
    }
    fetch('api.php?action=ssh_disconnect', {
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
function sendInputCommand(cmd) {
    fetch('api.php?action=ssh_send_input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: cmd })
    }).catch(() => {});
}