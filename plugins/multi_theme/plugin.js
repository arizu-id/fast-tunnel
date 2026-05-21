$(document).ready(function () {
    /* ═══════════════════════════════════════════════════════════════
       10 Full Color Palette Themes
       Each theme overrides ALL CSS custom properties from style.css
       ═══════════════════════════════════════════════════════════════ */
    const THEMES = {
        obsidian: {
            name: 'Obsidian',
            desc: 'Clean, professional dark',
            vars: {
                '--surface-0':'#101012','--surface-1':'#18181b','--surface-2':'#1e1e22',
                '--surface-3':'#27272a','--surface-4':'#2e2e33','--surface-5':'#3f3f46',
                '--border':'#3f3f46','--border-lite':'#52525b',
                '--text-base':'#e4e4e7','--text-muted':'#a1a1aa','--text-dim':'#71717a','--text-faint':'#52525b',
                '--accent':'#10b981','--accent-glow':'rgba(16,185,129,0.15)','--accent-dim':'rgba(16,185,129,0.08)',
                '--accent-blue':'#3b82f6','--accent-purple':'#8b5cf6','--accent-amber':'#f59e0b','--accent-red':'#ef4444'
            },
            preview: ['#18181b','#27272a','#3f3f46','#10b981']
        },
        midnight: {
            name: 'Midnight Ocean',
            desc: 'Deep navy, calming cyan',
            vars: {
                '--surface-0':'#070d1a','--surface-1':'#0f172a','--surface-2':'#151d30',
                '--surface-3':'#1e293b','--surface-4':'#263348','--surface-5':'#334155',
                '--border':'#334155','--border-lite':'#475569',
                '--text-base':'#e2e8f0','--text-muted':'#94a3b8','--text-dim':'#64748b','--text-faint':'#475569',
                '--accent':'#06b6d4','--accent-glow':'rgba(6,182,212,0.15)','--accent-dim':'rgba(6,182,212,0.08)',
                '--accent-blue':'#38bdf8','--accent-purple':'#818cf8','--accent-amber':'#fbbf24','--accent-red':'#fb7185'
            },
            preview: ['#0f172a','#1e293b','#334155','#06b6d4']
        },
        crimson: {
            name: 'Crimson Ember',
            desc: 'Bold, warm, dramatic',
            vars: {
                '--surface-0':'#0d0809','--surface-1':'#1a1215','--surface-2':'#21181b',
                '--surface-3':'#2d2023','--surface-4':'#3a282c','--surface-5':'#4d3439',
                '--border':'#4d3439','--border-lite':'#6b4248',
                '--text-base':'#f5e6e8','--text-muted':'#c4a0a6','--text-dim':'#8b6b72','--text-faint':'#6b4248',
                '--accent':'#f43f5e','--accent-glow':'rgba(244,63,94,0.15)','--accent-dim':'rgba(244,63,94,0.08)',
                '--accent-blue':'#f472b6','--accent-purple':'#c084fc','--accent-amber':'#fb923c','--accent-red':'#ef4444'
            },
            preview: ['#1a1215','#2d2023','#4d3439','#f43f5e']
        },
        aurora: {
            name: 'Aurora Borealis',
            desc: 'Magical, creative, unique',
            vars: {
                '--surface-0':'#0a0810','--surface-1':'#13111d','--surface-2':'#1a1726',
                '--surface-3':'#231f30','--surface-4':'#2c273b','--surface-5':'#3d3654',
                '--border':'#3d3654','--border-lite':'#554b70',
                '--text-base':'#ede9fc','--text-muted':'#a8a0c4','--text-dim':'#7a7098','--text-faint':'#554b70',
                '--accent':'#a78bfa','--accent-glow':'rgba(167,139,250,0.15)','--accent-dim':'rgba(167,139,250,0.08)',
                '--accent-blue':'#818cf8','--accent-purple':'#c084fc','--accent-amber':'#fbbf24','--accent-red':'#fb7185'
            },
            preview: ['#13111d','#231f30','#3d3654','#a78bfa']
        },
        solar: {
            name: 'Solar Flare',
            desc: 'Warm, rich, premium gold',
            vars: {
                '--surface-0':'#0d0b06','--surface-1':'#1a1710','--surface-2':'#211e16',
                '--surface-3':'#2b2619','--surface-4':'#363020','--surface-5':'#4a4230',
                '--border':'#4a4230','--border-lite':'#635840',
                '--text-base':'#f5f0e0','--text-muted':'#c4b898','--text-dim':'#8b7e62','--text-faint':'#635840',
                '--accent':'#f59e0b','--accent-glow':'rgba(245,158,11,0.15)','--accent-dim':'rgba(245,158,11,0.08)',
                '--accent-blue':'#fbbf24','--accent-purple':'#d97706','--accent-amber':'#f59e0b','--accent-red':'#ef4444'
            },
            preview: ['#1a1710','#2b2619','#4a4230','#f59e0b']
        },
        sakura: {
            name: 'Sakura Dream',
            desc: 'Soft blush pink, elegant',
            vars: {
                '--surface-0':'#0e0a0c','--surface-1':'#1a1318','--surface-2':'#22191f',
                '--surface-3':'#2e2228','--surface-4':'#3b2b33','--surface-5':'#4e3842',
                '--border':'#4e3842','--border-lite':'#6b4e5a',
                '--text-base':'#f5e8ee','--text-muted':'#c4a3b0','--text-dim':'#8b6f7d','--text-faint':'#6b4e5a',
                '--accent':'#ec4899','--accent-glow':'rgba(236,72,153,0.15)','--accent-dim':'rgba(236,72,153,0.08)',
                '--accent-blue':'#f472b6','--accent-purple':'#e879f9','--accent-amber':'#fda4af','--accent-red':'#f43f5e'
            },
            preview: ['#1a1318','#2e2228','#4e3842','#ec4899']
        },
        arctic: {
            name: 'Arctic Frost',
            desc: 'Ice cool, steel blue',
            vars: {
                '--surface-0':'#090c10','--surface-1':'#111820','--surface-2':'#172029',
                '--surface-3':'#1f2a35','--surface-4':'#273442','--surface-5':'#354354',
                '--border':'#354354','--border-lite':'#4a5d70',
                '--text-base':'#e4ecf4','--text-muted':'#9ab0c6','--text-dim':'#6b879e','--text-faint':'#4a5d70',
                '--accent':'#38bdf8','--accent-glow':'rgba(56,189,248,0.15)','--accent-dim':'rgba(56,189,248,0.08)',
                '--accent-blue':'#7dd3fc','--accent-purple':'#93c5fd','--accent-amber':'#fbbf24','--accent-red':'#f87171'
            },
            preview: ['#111820','#1f2a35','#354354','#38bdf8']
        },
        forest: {
            name: 'Forest Canopy',
            desc: 'Deep woodland, fresh lime',
            vars: {
                '--surface-0':'#070c07','--surface-1':'#101a10','--surface-2':'#152115',
                '--surface-3':'#1c2b1c','--surface-4':'#243524','--surface-5':'#324632',
                '--border':'#324632','--border-lite':'#476047',
                '--text-base':'#e4f0e4','--text-muted':'#9cbc9c','--text-dim':'#6d916d','--text-faint':'#476047',
                '--accent':'#22c55e','--accent-glow':'rgba(34,197,94,0.15)','--accent-dim':'rgba(34,197,94,0.08)',
                '--accent-blue':'#4ade80','--accent-purple':'#86efac','--accent-amber':'#a3e635','--accent-red':'#f87171'
            },
            preview: ['#101a10','#1c2b1c','#324632','#22c55e']
        },
        neon: {
            name: 'Neon Noir',
            desc: 'Cyberpunk, electric magenta',
            vars: {
                '--surface-0':'#08060c','--surface-1':'#120e18','--surface-2':'#19141f',
                '--surface-3':'#221c2b','--surface-4':'#2b2437','--surface-5':'#3d3350',
                '--border':'#3d3350','--border-lite':'#56476e',
                '--text-base':'#f0ecf5','--text-muted':'#b4a8cc','--text-dim':'#8578a0','--text-faint':'#56476e',
                '--accent':'#e879f9','--accent-glow':'rgba(232,121,249,0.15)','--accent-dim':'rgba(232,121,249,0.08)',
                '--accent-blue':'#c084fc','--accent-purple':'#f0abfc','--accent-amber':'#fbbf24','--accent-red':'#f43f5e'
            },
            preview: ['#120e18','#221c2b','#3d3350','#e879f9']
        },
        copper: {
            name: 'Copper Rust',
            desc: 'Earthy warm, terracotta',
            vars: {
                '--surface-0':'#0c0906','--surface-1':'#1a140e','--surface-2':'#211a13',
                '--surface-3':'#2c2318','--surface-4':'#382c1f','--surface-5':'#4c3c2b',
                '--border':'#4c3c2b','--border-lite':'#66523a',
                '--text-base':'#f5ede0','--text-muted':'#c4ad90','--text-dim':'#8b7a62','--text-faint':'#66523a',
                '--accent':'#ea580c','--accent-glow':'rgba(234,88,12,0.15)','--accent-dim':'rgba(234,88,12,0.08)',
                '--accent-blue':'#fb923c','--accent-purple':'#f97316','--accent-amber':'#fbbf24','--accent-red':'#ef4444'
            },
            preview: ['#1a140e','#2c2318','#4c3c2b','#ea580c']
        }
    };

    const DEFAULT_THEME = 'obsidian';
    let currentTheme = DEFAULT_THEME;

    /* ─── Load saved theme ─── */
    try {
        const saved = localStorage.getItem('ft_theme');
        if (saved && THEMES[saved]) currentTheme = saved;
    } catch (e) { /* ignore */ }

    /* ─── Apply theme to CSS vars + patch inline styles ─── */
    function applyTheme(key) {
        const theme = THEMES[key];
        if (!theme) return;
        const root = document.documentElement;
        const v = theme.vars;

        // 1. Set CSS custom properties on :root
        Object.entries(v).forEach(([prop, val]) => {
            root.style.setProperty(prop, val);
        });
        root.style.setProperty('--bs-body-bg', v['--surface-1']);
        root.style.setProperty('--bs-body-color', v['--text-base']);
        root.style.setProperty('--bs-success', v['--accent']);

        // 2. Override inline styles on elements with hardcoded backgrounds
        const inlineMap = [
            { sel: '#dbSidebar', bg: v['--surface-1'] },
            { sel: '#sshSidebar', bg: v['--surface-1'] },
            { sel: '#dbTabsNav', bg: v['--surface-2'] },
            { sel: '#sshTerminal', bg: v['--surface-0'] },
            { sel: '.ssh-terminal-area', bg: v['--surface-0'] },
            { sel: '#dbBrowseTableWrapper', bg: v['--surface-0'] },
        ];
        inlineMap.forEach(m => {
            document.querySelectorAll(m.sel).forEach(el => {
                if (el.style.backgroundColor || el.style.background) {
                    el.style.backgroundColor = m.bg;
                }
            });
        });

        // 3. Override all modal inline styles
        document.querySelectorAll('.modal-content[style]').forEach(el => {
            if (el.style.backgroundColor) el.style.backgroundColor = v['--surface-2'];
        });
        document.querySelectorAll('.modal-header[style]').forEach(el => {
            if (el.style.backgroundColor) el.style.backgroundColor = v['--surface-1'];
        });
        document.querySelectorAll('.modal-footer[style]').forEach(el => {
            if (el.style.backgroundColor) el.style.backgroundColor = v['--surface-1'];
        });

        // 4. Override DB table header rows with inline bg
        document.querySelectorAll('tr[style*="background"]').forEach(el => {
            el.style.background = v['--surface-3'];
        });

        // 5. Override cards with inline bg
        document.querySelectorAll('.card[style]').forEach(el => {
            if (el.style.background || el.style.backgroundColor) {
                el.style.background = `rgba(${hexToRgb(v['--surface-3'])}, 0.8)`;
            }
        });

        // 6. Override about dev links
        document.querySelectorAll('#aboutDevModal a[style]').forEach(el => {
            if (el.style.background || el.style.backgroundColor) {
                el.style.background = v['--surface-3'];
            }
        });

        // 7. Override gradient icons in modals
        document.querySelectorAll('div[style*="linear-gradient"]').forEach(el => {
            el.style.background = `linear-gradient(135deg, ${v['--surface-5']}, ${v['--border-lite']})`;
        });

        currentTheme = key;
    }

    function hexToRgb(hex) {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `${r},${g},${b}`;
    }

    // Apply on load
    applyTheme(currentTheme);

    // Re-apply when modals are shown (they might get re-rendered)
    $(document).on('shown.bs.modal', function() {
        if (currentTheme !== DEFAULT_THEME) {
            setTimeout(() => applyTheme(currentTheme), 50);
        }
    });

    /* ─── Inject Palette Button ─── */
    if ($('#btnMultiTheme').length === 0) {
        $('<button class="btn btn-sm btn-icon" id="btnMultiTheme" title="Theme Selector"><i class="bi bi-palette"></i></button>')
            .insertBefore('#btnPluginsManager');
    }

    /* ─── Build Theme Cards ─── */
    function buildThemeCards() {
        let html = '';
        Object.entries(THEMES).forEach(([key, t]) => {
            const active = key === currentTheme ? ' active' : '';
            const palette = t.preview.map(c => `<span style="background:${c}"></span>`).join('');
            html += `
            <div class="theme-card${active}" data-theme="${key}" style="background:${t.vars['--surface-2']}">
                <div class="theme-card-palette">${palette}</div>
                <div class="theme-card-name">${t.name}</div>
                <div class="theme-card-desc">${t.desc}</div>
            </div>`;
        });
        return html;
    }

    const modalHtml = `
    <div class="modal fade" id="multiThemeModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <div class="modal-header border-secondary p-3">
                    <h5 class="modal-title fs-6 text-uppercase fw-semibold tracking-wide text-muted">
                        <i class="bi bi-palette me-2"></i><span data-i18n="theme_selector">Theme Selector</span>
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4">
                    <p class="text-muted small mb-3" data-i18n="choose_theme">Choose a visual theme for your workspace.</p>
                    <div class="theme-card-grid" id="themeCardGrid">
                        ${buildThemeCards()}
                    </div>
                </div>
                <div class="modal-footer border-secondary p-3">
                    <button type="button" class="btn btn-dark btn-sm border-secondary px-3 me-auto" id="btnResetMultiTheme" data-i18n="reset_default">Reset Default</button>
                    <button type="button" class="btn btn-dark btn-sm border-secondary px-3" data-bs-dismiss="modal" data-i18n="close">Close</button>
                </div>
            </div>
        </div>
    </div>`;

    if ($('#multiThemeModal').length === 0) {
        $('body').append(modalHtml);
    }

    /* ─── Events ─── */
    $(document).on('click', '#btnMultiTheme', function () {
        // Rebuild cards to reflect current state
        $('#themeCardGrid').html(buildThemeCards());
        new bootstrap.Modal(document.getElementById('multiThemeModal')).show();
    });

    $(document).on('click', '.theme-card', function () {
        const key = $(this).data('theme');
        if (!THEMES[key]) return;
        $('.theme-card').removeClass('active');
        $(this).addClass('active');
        applyTheme(key);
        try { localStorage.setItem('ft_theme', key); } catch (e) { /* ignore */ }
    });

    $(document).on('click', '#btnResetMultiTheme', function () {
        applyTheme(DEFAULT_THEME);
        $('.theme-card').removeClass('active');
        $(`.theme-card[data-theme="${DEFAULT_THEME}"]`).addClass('active');
        try { localStorage.setItem('ft_theme', DEFAULT_THEME); } catch (e) { /* ignore */ }
    });
});
