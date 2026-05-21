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
