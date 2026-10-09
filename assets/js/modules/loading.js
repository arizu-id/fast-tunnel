const KEY = 'ftLoadingState';

function isButton($el) {
    return $el.is('button, .btn, input[type="button"], input[type="submit"]');
}

/**
 * Toggle a loading animation on the element(s) an action is acting on.
 * Buttons get a spinner + disabled state; any other element (tree row, table
 * row, card, pane) gets the `.ft-loading` class which dims it and shows a spinner.
 * Calls are ref-counted per element so overlapping actions don't clear each other.
 */
export function setLoading(target, on = true, opts = {}) {
    $(target).each(function () {
        const $el = $(this);
        let st = $el.data(KEY);
        if (on) {
            if (st) { st.count++; return; }
            st = { count: 1, button: isButton($el) };
            if (st.button) {
                st.html = $el.html();
                st.disabled = $el.prop('disabled');
                st.minWidth = this.style.minWidth;
                const label = opts.text !== undefined ? opts.text : $.trim($el.text());
                $el.css('min-width', $el.outerWidth() + 'px');
                const $spin = $('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>');
                $el.empty().append($spin);
                if (label) $el.append($('<span class="ms-1"></span>').text(label));
                $el.prop('disabled', true);
            } else {
                $el.addClass(opts.overlay ? 'ft-loading ft-loading-overlay' : 'ft-loading');
                st.overlay = !!opts.overlay;
            }
            $el.attr('aria-busy', 'true').data(KEY, st);
        } else {
            if (!st) return;
            if (--st.count > 0) return;
            if (st.button) {
                $el.html(st.html).prop('disabled', st.disabled).css('min-width', st.minWidth);
            } else {
                $el.removeClass('ft-loading ft-loading-overlay');
            }
            $el.removeAttr('aria-busy').removeData(KEY);
        }
    });
}

/**
 * Run a promise (or a function returning one) while showing the loading
 * animation on `target`. The animation is always cleared afterwards.
 */
export function withLoading(target, work, opts = {}) {
    setLoading(target, true, opts);
    let p;
    try {
        p = typeof work === 'function' ? work() : work;
    } catch (e) {
        setLoading(target, false);
        return Promise.reject(e);
    }
    return Promise.resolve(p).finally(() => setLoading(target, false));
}

/**
 * If a modal callback returned a promise, keep the modal open with the OK button
 * spinning until it settles, then close it. Plain callbacks close immediately.
 */
export function finishModalAction(modalId, $okBtn, result) {
    const el = document.getElementById(modalId);
    const close = () => { const m = bootstrap.Modal.getInstance(el); if (m) m.hide(); };
    if (!result || typeof result.then !== 'function') { close(); return; }
    const $others = $(el).find('button').not($okBtn).filter(':not(:disabled)');
    $others.prop('disabled', true);
    setLoading($okBtn, true);
    result.catch(() => {}).finally(() => {
        setLoading($okBtn, false);
        $others.prop('disabled', false);
        close();
    });
}
