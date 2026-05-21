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
        $('#dbSidebar').addCla
        $('#s
                $input.val('');
            }
        }
    });
    $btn.on('click', () => {
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
    container.addEventListener('click', () => {
        $input.focus();
    });
}
function sendInputCommand(cmd) {
    fetch('api.php?action=ssh_send_input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: cmd })
    }).catch(() => {});
}


    area.find('.btn-ssh-disconnect').click(() => disconnectSsh());
}

function disconnectSsh() {
    // Close SSE stream
    if (sseSource) {
        sseSource.close();
        sseSource = null;
    }

    // Kill background process
    fetch('api.php?action=ssh_disconnect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    
    fitAddon = new window.FitAddon.FitAddon();
    term.loadAddon(fitAddon);
    term.open(container);
    fitAddon.fit();
    
    term.writeln('\x1b[1;33mWelcome to Fast Tunnel Web SSH Terminal\x1b[0m');
    term.writeln(`Connected to ${username}@${host}\r\n`);
    drawPrompt();
    
    term.onData(data => {
        if (commandRunning) return;
        
        const code = data.charCodeAt(0);
        if (data === '\r') {
            const cmd = currentLine.trim();
            term.write('\r\n');
            if (cmd) {
                history.push(cmd);
                historyIndex = -1;
                runCommand(cmd);
            } else {
                drawPrompt();
            }
            currentLine = '';
        } else if (data === '\x7f' || data === '\b') {
            if (currentLine.length > 0) {
                currentLine = currentLine.slice(0, -1);
                term.write('\b \b');
            const oldCursor = cursorIndex;
            currentLine = currentLine.slice(0, cursorIndex) + data + currentLine.slice(cursorIndex);
            cursorIndex += data.length;
            renderLine(oldCursor);
            return;
        }

        const code = data.charCodeAt(0);
        
        // Ctrl+C (SIGINT / Copy)
        if (data === '\x03') {
            if (term.hasSelection()) {
                try {
                    navigator.clipboard.writeText(term.getSelection());
                    term.clearSelection();
                } catch (e) {
                    console.error("Clipboard copy failed: ", e);
                }
                return;
            }
            term.write('^C\r\n');
            currentLine = '';
            cursorIndex = 0;
            drawPrompt();
            return;
                    <div class="text-muted" style="font-size:0.72rem;">${i.cores} core${i.cores !== '1' ? 's' : ''} · Load: ${i.load}</div>
                </div>

                <div class="mb-2 pb-2 border-bottom border-secondary">
                    <div class="text-muted mb-1" style="font-size:0.7rem; letter-spacing:.5px; text-transform:uppercase;">Memory</div>
                    <div class="d-flex justify-content-between">
                        <span class="text-light" style="font-size:0.78rem;">Total: <strong>${i.ram}</strong></span>
                    <div class="text-muted mb-1" style="font-size:0.7rem; letter-spacing:.5px; text-transform:uppercase;">Memory</div>
                    <div class="d-flex justify-content-between">
                        <span class="text-light" style="font-size:0.78rem;">Total: <strong>${i.ram}</strong></span>
                        <span style="font-size:0.78rem; color:var(--accent);">Used: <strong>${i.ram_used}</strong></span>
                    </div>
                </div>

                <div class="mb-2">
                    <div class="text-muted mb-1" style="font-size:0.7rem; letter-spacing:.5px; text-transform:uppercase;">Uptime</div>
                    <div class="text-light" style="font-size:0.78rem;">${i.uptime}</div>
                </div>
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

    // Clean up existing terminal and SSE
    if (term) { term.dispose(); term = null; }
    if (sseSource) { sseSource.close(); sseSource = null; }

    // Initialize xterm.js
    term = new Terminal({
        cursorBlink: true,
        fontFamily: 'Consolas, "Cascadia Code", "JetBrains Mono", "Courier New", monospace',
        fontSize: 13,
        lineHeight: 1.4,
        theme: {
            background:  '#0f0f12',
            foreground:  '#e4e4e7',
            cursor:      '#10b981',
            cursorAccent:'#0f0f12',
            black:       '#18181b',
            red:         '#ef4444',
            green:       '#10b981',
            yellow:      '#f59e0b',
            blue:        '#3b82f6',
            magenta:     '#a855f7',
            cyan:        '#06b6d4',
            white:       '#e4e4e7',
            brightBlack: '#3f3f46',
            brightRed:   '#f87171',
            brightGreen: '#34d399',
            brightYellow:'#fbbf24',
            brightBlue:  '#60a5fa',
            brightMagenta:'#c084fc',
            brightCyan:  '#22d3ee',
            brightWhite: '#fafafa',
        },
        scrollback: 5000,
        allowTransparency: true,
        convertEol: false,
    });

    fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);
    term.open(container);

    // Double rAF: ensure browser paints the container before xterm measures dimensions.
    // Without this, fitAddon.fit() sees 0px height and the terminal renders blank.
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            try { fitAddon.fit(); } catch(e) {}
        });
    });

    // Handle browser window resize
    const resizeObserver = new ResizeObserver(() => {
        if (fitAddon && term) {
            try { fitAddon.fit(); } catch(e) {}
        }
    });
    resizeObserver.observe(container);

    // ── Stream SSH output via SSE ──────────────────────────
        
        // Up Arrow (History Back)
        if (data === '\x1b[A') {
            if (history.length > 0 && historyIndex < history.length - 1) {
                const oldCursor = cursorIndex;
                historyIndex++;
                currentLine = history[history.length - 1 - historyIndex];
                cursorIndex = currentLine.length;
                renderLine(oldCursor);
            }
            return;
        }
        
        // Down Arrow (History Forward)
        if (data === '\x1b[B') {
            const oldCursor = cursorIndex;
            if (historyIndex > 0) {
                historyIndex--;
            return;
                historyIndex = -1;
                $input.val('');
            }
        }
    });
    $btn.on('click', () => {
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
    container.addEventListener('click', () => {
        $input.focus();
    });
}
function sendInputCommand(cmd) {
    fetch('api.php?action=ssh_send_input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: cmd })
    }).catch(() => {});
}

                // Printable characters (ASCII 32 to 126 or non-control unicode)
                const code = char.charCodeAt(0);
                if (code >= 32 || char === '\t') {
                    commandLineBuffer += char;
                    term.write(char);
                }
    });

    function executeConsoleCommand() {
        const cmd = $input.val();
        if (cmd.length === 0) return;
        
        // Send command to backend (the remote PTY will echo it back automatically)
        sendInputCommand(cmd + '\n');
        
        // Save to history
        if (commandHistory.length === 0 || commandHistory[commandHistory.length - 1] !== cmd) {
            commandHistory.push(cmd);
            if (commandHistory.length > 50) {
                commandHistory.shift();
            }
        }
        historyIndex = -1;
        
        // Clear input and refocus
        $input.val('').focus();
    }

    // ── Keyboard handler for direct xterm typing ─────────────────────────
    term.onData(data => {
        // If user presses Ctrl+C and has text selected, copy to clipboard
        if (data === '\x03' && term.hasSelection()) {
            try {
                navigator.clipboard.writeText(term.getSelection());
                term.clearSelection();
            } catch(e) {}
            return;
        }
        sendInputCommand(data);
    });

    // ── Handle paste via Ctrl+V on term ──────────────────────────────────
    term.onKey(({ key, domEvent }) => {
        if (domEvent.ctrlKey && domEvent.key === 'v') {
            navigator.clipboard.readText().then(text => {
                sendInputCommand(text);
            }).catch(() => {});
        }
    });

    // ── Welcome message ───────────────────────────────────────────────────
    term.write('\x1b[1;32mWelcome to Fast Tunnel · Realtime SSH Terminal\x1b[0m\r\n');
    term.write(`\x1b[0;90mConnected to \x1b[0;36m${session.user}@${session.host}\x1b[0;90m via PTY\x1b[0m\r\n\r\n`);

    // Redirect click anywhere inside terminal window to the input box
    container.addEventListener('click', () => {
        $input.focus();
    });
}

function sendInputCommand(cmd) {
    fetch('api.php?action=ssh_send_input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: cmd })
    }).catch(() => {});
}

    // ── Handle paste via Ctrl+V / Ctrl+Shift+V on term ───────────────────
    term.onKey(({ key, domEvent }) => {
        if (domEvent.ctrlKey && domEvent.key === 'v') {
            navigator.clipboard.readText().then(text => {
                commandLineBuffer += text;
                term.write(text);
            }).catch(() => {});
        }
    });

    // ── Welcome message ───────────────────────────────────────────────────
    term.write('\x1b[1;32mWelcome to Fast Tunnel · Realtime SSH Terminal\x1b[0m\r\n');
    term.write(`\x1b[0;90mConnected to \x1b[0;36m${session.user}@${session.host}\x1b[0;90m via PTY\x1b[0m\r\n\r\n`);

    // Redirect click anywhere inside terminal window to the input box
    container.addEventListener('click', () => {
        $input.focus();
    });
}

function sendInputCommand(cmd) {
    fetch('api.php?action=ssh_send_input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: cmd })
    }).catch(() => {});
}
