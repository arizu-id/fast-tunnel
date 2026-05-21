Created At: 2026-05-21T06:24:29Z
Completed At: 2026-05-21T06:24:29Z
File Path: `file:///c:/xampp/htdocs/assets/js/modules/ssh.js`
Total Lines: 409
Total Bytes: 15874
Showing lines 1 to 409
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
1: import { state } from './state.js';
2: import { showToast } from './ui.js';
3: 
4: let term = null;
5: let fitAddon = null;
6: let sseSource = null;   // EventSource for real-time SSH output
7: let commandLineBuffer = '';
8: let commandHistory = [];
9: let historyIndex = -1;
10: 
11: export function connectSsh(sessionId, session) {
12:     state.isConnecting = true;
13:     state.currentSessionId = sessionId;
14:     state.currentProtocol = 'ssh';
15:     commandLineBuffer = '';
16: 
17:     const password = session.password ? atob(session.password) : '';
18: 
19:     showToast('Connecting to SSH...', 'info');
20:     $('#connectionStatus').html(`<span class="text-info"><i class="bi bi-arrow-repeat spin me-2 d-inline-block"></i>Connecting to ${session.name}...</span>`);
21: 
22:     fetch('api.php?action=ssh_connect', {
23:         method: 'POST',
24:         headers: { 'Content-Type': 'application/json' },
25:         body: JSON.stringify(
























371:                 }
372:             } else {
373:                 const code = char.charCodeAt(0);
374:                 if (code >= 32 || char === '\t') {
375:                     commandLineBuffer += char;
376:                     term.write(char);
377:                 }
378:             }
379:         }
380:     });
381: 
382:     // ── Handle paste via Ctrl+V / Ctrl+Shift+V on term ───────────────────
383:     term.onKey(({ key, domEvent }) => {
384:         if (domEvent.ctrlKey && domEvent.key === 'v') {
385:             navigator.clipboard.readText().then(text => {
386:                 commandLineBuffer += text;
387:                 term.write(text);
388:             }).catch(() => {});
389:         }
390:     });
391: 
392:     // ── Welcome message ───────────────────────────────────────────────────
393:     term.write('\x1b[1;32mWelcome to Fast Tunnel · Realtime SSH Terminal\x1b[0m\r\n');
394:     term.write(`\x1b[0;90mConnected to \x1b[0;36m${session.user}@${session.host}\x1b[0;90m via PTY\x1b[0m\r\n\r\n`);
395: 
396:     // Redirect click anywhere inside terminal window to the input box
397:     container.addEventListener('click', () => {
398:         $input.focus();
399:     });
400: }
401: 
402: function sendInputCommand(cmd) {
403:     fetch('api.php?action=ssh_send_input', {
404:         method: 'POST',
405:         headers: { 'Content-Type': 'application/json' },
406:         body: JSON.stringify({ input: cmd })
407:     }).catch(() => {});
408: }
409: 
The above content shows the entire, complete file contents of the requested file.
