const bar = document.getElementById('globalLoadingBar');
let activeRequests = 0;
let fillTimer = null;
let currentWidth = 0;
function startLoading() {
    activeRequests++;
    if (activeRequests === 1) {
        clearTimeout(fillTimer);
        currentWidth = 0;
        bar.style.transition = 'width 0.1s ease, opacity 0.2s ease';
        bar.style.opacity = '1';
        bar.style.width = '0%';
        bar.classList.add('active');
        animateTo(85, 900);
    }
}
function stopLoading() {
    activeRequests = Math.max(0, activeRequests - 1);
    if (activeRequests === 0) {
        clearTimeout(fillTimer);
        bar.style.transition = 'width 0.15s ease, opacity 0.4s ease 0.15s';
        bar.style.width = '100%';
        bar.classList.remove('active');
        setTimeout(() => {
            bar.style.opacity = '0';
            setTimeout(() => {
                bar.style.transition = 'none';
                bar.style.width = '0%';
                currentWidth = 0;
            }, 420);
        }, 150);
    }
}
function animateTo(target, duration) {
    const start = currentWidth;
    const range = target - start;
    const startTime = performance.now();
    function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        currentWidth = start + range * eased;
        bar.style.width = currentWidth + '%';
        if (progress < 1) {
            fillTimer = requestAnimationFrame(step);
        }
    }
    fillTimer = requestAnimationFrame(step);
}
const originalFetch = window.fetch;
window.fetch = function(...args) {
    startLoading();
    return originalFetch(...args).then(
        response => {
            stopLoading();
            return response;
        },
        error => {
            stopLoading();
            throw error;
        }
    );
};
if (window.jQuery) {
    $(document).ajaxStart(startLoading).ajaxStop(stopLoading);
}