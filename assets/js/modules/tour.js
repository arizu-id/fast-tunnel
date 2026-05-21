const TOUR_KEY = 'ft_tour_v1';

const STEPS = [
    {
        title: 'Welcome to Fast Tunnel',
        body: 'A modern web client for FTP, MySQL &amp; SSH connections — all in one browser tab. Here\'s a quick 30-second tour.',
        target: null,
    },
    {
        title: 'Add a Connection',
        body: 'Click the <strong>+</strong> button to add an FTP, MySQL, or SSH connection.',
        target: '#btnSidebarNewSession',
        position: 'right',
    },
    {
        title: 'Session List',
        body: 'Saved connections appear here. Click one to open it and start working instantly.',
        target: '#sessionList',
        position: 'right',
    },
    {
        title: 'Import &amp; Export',
        body: 'Back up all sessions to a JSON file. Exports can be password-protected for safe sharing.',
        target: '#btnExportSessions',
        position: 'right',
    },
    {
        title: 'Plugins',
        body: 'Extend Fast Tunnel with add-on plugins. The free <strong>Ping Monitor</strong> plugin is included out of the box.',
        target: '#btnPluginsManager',
        position: 'left',
    },
    {
        title: 'Settings',
        body: 'Change your login credentials, read our policies, or replay this tour from here anytime.',
        target: '#btnMoreSettings',
        position: 'left',
    },
    {
        title: "You're all set!",
        body: 'Start by clicking <strong>+</strong> in the sidebar to add your first connection.',
        target: null,
    },
];

const SAMPLE_SESSIONS = [
    { name: 'My Website',    proto: 'ftp',   icon: 'bi-hdd-network', color: 'text-info'    },
    { name: 'Production DB', proto: 'mysql', icon: 'bi-database',    color: 'text-warning' },
    { name: 'VPS Server',    proto: 'ssh',   icon: 'bi-terminal',    color: 'text-success' },
];

let idx = 0;
let $backdrop, $highlight, $tooltip;
let _savedListHTML = null;

export function startTour(force = false) {
    if (!force && localStorage.getItem(TOUR_KEY)) return;
    idx = 0;
    _injectSamples();
    _build();
    _render(0);
}

export function resetTour() {
    localStorage.removeItem(TOUR_KEY);
}

// ── Sample data ──────────────────────────────────────────────────────────────

function _injectSamples() {
    const $list = $('#sessionList');
    _savedListHTML = $list.html();
    $list.empty();
    SAMPLE_SESSIONS.forEach(s => {
        $list.append(`
            <div class="session-item d-flex justify-content-between align-items-center tour-sample"
                 style="pointer-events:none;opacity:.85">
                <div class="d-flex align-items-center overflow-hidden">
                    <i class="bi ${s.icon} me-2 ${s.color} fs-5"></i>
                    <div class="d-flex flex-column text-truncate">
                        <strong class="text-truncate">${s.name}</strong>
                        <small class="text-muted" style="font-size:.7rem">${s.proto.toUpperCase()}</small>
                    </div>
                </div>
                <div class="d-flex align-items-center gap-1">
                    <button class="btn btn-sm btn-icon text-danger p-0" style="pointer-events:none">
                        <i class="bi bi-trash3"></i>
                    </button>
                </div>
            </div>
        `);
    });
}

function _removeSamples() {
    if (_savedListHTML !== null) {
        $('#sessionList').html(_savedListHTML);
        _savedListHTML = null;
    }
}

// ── Overlay ──────────────────────────────────────────────────────────────────

function _build() {
    _destroy();
    $backdrop  = $('<div id="tourBackdrop">').appendTo('body');
    $highlight = $('<div id="tourHighlight">').appendTo('body');
    $tooltip   = $('<div id="tourTooltip">').appendTo('body');
    $backdrop.on('click', () => _end());
}

function _render(n) {
    idx = n;
    const step   = STEPS[n];
    const isLast = n === STEPS.length - 1;
    const dots   = STEPS.map((_, i) =>
        `<span class="tour-dot${i === n ? ' active' : i < n ? ' done' : ''}"></span>`
    ).join('');

    $tooltip.html(`
        <div class="tour-header">
            <span class="tour-step-label">Step ${n + 1} / ${STEPS.length}</span>
            <button class="tour-close" id="tourClose">&#x2715;</button>
        </div>
        <div class="tour-title">${step.title}</div>
        <div class="tour-body">${step.body}</div>
        <div class="tour-footer">
            <div class="tour-dots">${dots}</div>
            <div class="tour-actions">
                ${n > 0 ? '<button class="tour-btn tour-btn-ghost" id="tourBack">Back</button>' : ''}
                <button class="tour-btn tour-btn-primary" id="tourNext">${isLast ? 'Get Started' : 'Next'}</button>
            </div>
        </div>
    `);

    $('#tourClose').on('click', () => _end());
    $('#tourNext').on('click',  () => isLast ? _end() : _render(n + 1));
    if (n > 0) $('#tourBack').on('click', () => _render(n - 1));

    _position(step);
}

function _position(step) {
    // ── No target: dim entire screen, centre the tooltip ──
    if (!step.target) {
        $highlight.hide();
        $backdrop.css({ background: 'rgba(0,0,0,.6)', 'pointer-events': 'all' });
        $tooltip.css({ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' });
        return;
    }

    const $el = $(step.target).first();
    if (!$el.length) {
        // Fallback to centred if element not found
        $highlight.hide();
        $backdrop.css({ background: 'rgba(0,0,0,.6)', 'pointer-events': 'all' });
        $tooltip.css({ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' });
        return;
    }

    // ── Spotlight: backdrop MUST be transparent so app shows through highlight ──
    $backdrop.css({ background: 'transparent', 'pointer-events': 'none' });

    const r   = $el[0].getBoundingClientRect();
    const pad = 8;

    $highlight.show().css({
        top:    r.top    - pad,
        left:   r.left   - pad,
        width:  r.width  + pad * 2,
        height: r.height + pad * 2,
    });

    // Position tooltip beside the highlighted element
    const TW = 290, TH = 220, mg = 14;
    const pos = step.position || 'right';
    let top, left;

    if (pos === 'right')  { top = r.top + r.height / 2 - TH / 2; left = r.right  + mg; }
    else if (pos === 'left')   { top = r.top + r.height / 2 - TH / 2; left = r.left   - TW - mg; }
    else if (pos === 'bottom') { top = r.bottom + mg;                   left = r.left   + r.width / 2 - TW / 2; }
    else                       { top = r.top - TH - mg;                 left = r.left   + r.width / 2 - TW / 2; }

    top  = Math.max(8, Math.min(top,  window.innerHeight - TH - 8));
    left = Math.max(8, Math.min(left, window.innerWidth  - TW - 8));

    $tooltip.css({ position: 'fixed', transform: 'none', top, left });
}

function _end() {
    localStorage.setItem(TOUR_KEY, '1');
    _removeSamples();
    _destroy();
}

function _destroy() {
    $('#tourBackdrop, #tourHighlight, #tourTooltip').remove();
    $backdrop = $highlight = $tooltip = null;
}
