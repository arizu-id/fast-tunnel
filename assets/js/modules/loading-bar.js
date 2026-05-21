let bar = null;
let activeRequests = 0;
let fillTimer = null;
let currentWidth = 0;
function getBar() {
    if (!bar) bar = document.getElementById('globalLoadingBar');
    return bar;
}
function startLoading() {
    activeRequests++;
    if (activeRequests === 1) {
        const b = getBar();
        if (!b) return;
        cancelAnimationFrame(fillTimer);
        currentWidth = 0;
        b.style.transition = 'width 0.1s ease, opacity 0.2s ease';
        b.style.opacity = '1';
        b.style.width = '0%';
        b.classList.add('active');
        animateTo(85, 900);
    }
}
function stopLoading() {
    activeRequests = Math.max(0, activeRequests - 1);
    if (activeRequests === 0) {
        const b = getBar();
        if (!b) return;
        cancelAnimationFrame(fillTimer);
        b.style.transition = 'width 0.15s ease, opacity 0.4s ease 0.15s';
        b.style.width = '100%';
        b.classList.remove('active');
        setTimeout(() => {
            b.style.opacity = '0';
            setTimeout(() => {
                b.style.transition = 'none';
                b.style.width = '0%';
                currentWidth = 0;
            }, 420);
        }, 150);
    }
}
function animateTo(target, duration) {
    const b = getBar();
    if (!b) return;
    const start = currentWidth;
    const range = target - start;
    const startTime = performance.now();
    function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        currentWidth = start + range * eased;
        b.style.width = currentWidth + '%';
        if (progress < 1) {
            fillTimer = requestAnimationFrame(step);
        }
    }
    fillTimer = requestAnimationFrame(step);
}
const originalFetch = window.fetch;
window.fetch = function() {
    startLoading();
    return originalFetch.apply(this, arguments)
        .then(r => { stopLoading(); return r; })
        .catch(e => { stopLoading(); throw e; });
};
if (typeof $ !== 'undefined' && $.ajaxPrefilter) {
    $.ajaxPrefilter(function(options, originalOptions, jqXHR) {
        startLoading();
        jqXHR.always(function() {
            stopLoading();
        });
    });
}
