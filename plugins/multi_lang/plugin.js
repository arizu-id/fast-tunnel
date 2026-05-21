$(document).ready(function () {
    const DEFAULT_LANG = 'en';
    let currentLang = DEFAULT_LANG;
    let translations = {};
    let availableLangs = [];
    let isApplying = false;

    /* ─── Load saved language ─── */
    try {
        const saved = localStorage.getItem('ft_lang');
        if (saved) currentLang = saved;
    } catch (e) { /* ignore */ }

    /* ─── Fetch translations from backend ─── */
    async function fetchTranslations(lang) {
        try {
            const csrfToken = $('meta[name="csrf-token"]').attr('content') || '';
            const resp = await fetch(`/api/lang_get?lang=${encodeURIComponent(lang)}`, {
                headers: { 'X-CSRF-Token': csrfToken }
            });
            if (!resp.ok) return null;
            const data = await resp.json();
            if (data.success) {
                availableLangs = data.available || [];
                return data.translations || {};
            }
        } catch (e) {
            console.warn('[MultiLang] Failed to fetch translations:', e);
        }
        return null;
    }

    /* ─── Apply translations to DOM ─── */
    function applyTranslations(trans) {
        if (!trans || isApplying) return;
        isApplying = true;

        // 1. Translate all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (trans[key]) {
                // Check if it's an input placeholder
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = trans[key];
                } else if (el.tagName === 'OPTION') {
                    el.textContent = trans[key];
                } else {
                    // Preserve child elements (icons), only replace text nodes
                    const textNodes = [];
                    el.childNodes.forEach(node => {
                        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                            textNodes.push(node);
                        }
                    });
                    if (textNodes.length > 0) {
                        // Replace the last meaningful text node (usually the visible text)
                        textNodes[textNodes.length - 1].textContent = trans[key];
                    } else if (el.childElementCount === 0) {
                        // No children at all, safe to set textContent
                        el.textContent = trans[key];
                    }
                }
            }
        });

        // 2. Translate elements with data-i18n-title attribute
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            if (trans[key]) {
                el.title = trans[key];
            }
        });

        // 3. Translate elements with data-i18n-placeholder attribute
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (trans[key]) {
                el.placeholder = trans[key];
            }
        });

        isApplying = false;
    }

    /* ─── MutationObserver for dynamic content ─── */
    const observer = new MutationObserver(mutations => {
        if (isApplying || !translations || Object.keys(translations).length === 0) return;
        let needsUpdate = false;
        for (const m of mutations) {
            if (m.addedNodes.length > 0) {
                for (const node of m.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.hasAttribute && (node.hasAttribute('data-i18n') || node.querySelector('[data-i18n]'))) {
                            needsUpdate = true;
                            break;
                        }
                    }
                }
            }
            if (needsUpdate) break;
        }
        if (needsUpdate) {
            requestAnimationFrame(() => applyTranslations(translations));
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    /* ─── Override global translate function ─── */
    window.__ft_translate = function(key, fallback) {
        if (translations && translations[key]) return translations[key];
        return fallback || key;
    };

    /* ─── Initialize ─── */
    async function init() {
        const trans = await fetchTranslations(currentLang);
        if (trans) {
            translations = trans;
            applyTranslations(translations);
        }
    }

    /* ─── Inject Globe Button ─── */
    if ($('#btnMultiLang').length === 0) {
        const $btn = $('<button class="btn btn-sm btn-icon" id="btnMultiLang" title="Language"><i class="bi bi-globe2"></i></button>');
        // Insert before the theme button if exists, otherwise before plugins manager
        if ($('#btnMultiTheme').length) {
            $btn.insertBefore('#btnMultiTheme');
        } else {
            $btn.insertBefore('#btnPluginsManager');
        }
    }

    /* ─── Build Language Picker Modal ─── */
    function buildLangOptions() {
        if (!availableLangs.length) return '<div class="text-muted p-3 text-center">No languages available</div>';
        return availableLangs.map(l => {
            const active = l.code === currentLang ? ' active' : '';
            return `<div class="lang-option${active}" data-lang="${l.code}">
                <span class="lang-option-flag">${l.flag}</span>
                <span class="lang-option-name">${l.name}</span>
            </div>`;
        }).join('');
    }

    const modalHtml = `
    <div class="modal fade" id="multiLangModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-md">
            <div class="modal-content">
                <div class="modal-header border-secondary p-3">
                    <h5 class="modal-title fs-6 text-uppercase fw-semibold tracking-wide text-muted">
                        <i class="bi bi-globe2 me-2"></i><span data-i18n="language">Language</span>
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4">
                    <p class="text-muted small mb-3" data-i18n="choose_language">Choose your preferred language.</p>
                    <div class="lang-picker-grid" id="langPickerGrid">
                        <div class="text-center p-3 text-muted"><div class="spinner-border spinner-border-sm me-2"></div>Loading...</div>
                    </div>
                </div>
                <div class="modal-footer border-secondary p-3">
                    <button type="button" class="btn btn-dark btn-sm border-secondary px-3" data-bs-dismiss="modal" data-i18n="close">Close</button>
                </div>
            </div>
        </div>
    </div>`;

    if ($('#multiLangModal').length === 0) {
        $('body').append(modalHtml);
    }

    /* ─── Events ─── */
    $(document).on('click', '#btnMultiLang', function () {
        $('#langPickerGrid').html(buildLangOptions());
        new bootstrap.Modal(document.getElementById('multiLangModal')).show();
    });

    $(document).on('click', '.lang-option', async function () {
        const lang = $(this).data('lang');
        if (!lang || lang === currentLang) return;

        // Visual feedback
        $('.lang-option').removeClass('active');
        $(this).addClass('active');

        // Fetch and apply
        const trans = await fetchTranslations(lang);
        if (trans) {
            currentLang = lang;
            translations = trans;
            applyTranslations(translations);
            try { localStorage.setItem('ft_lang', lang); } catch (e) { /* ignore */ }
        }
    });

    /* ─── Start ─── */
    init();
});
