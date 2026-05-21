$(document).ready(function() {
    // 1. Inject the Ping Sessions broadcast button into the sidebar toolbar
    function injectPingButton() {
        if ($('#btnPingSessions').length === 0) {
            const addSessionBtn = $('[data-bs-target="#addSessionModal"]');
            if (addSessionBtn.length > 0) {
                $('<button class="btn btn-sm btn-icon" id="btnPingSessions" title="Test All Latencies"><i class="bi bi-broadcast"></i></button>')
                    .insertBefore(addSessionBtn);
            }
        }
    }

    // Try injecting on startup
    injectPingButton();
    // Also try periodically to handle cases where UI is slow to load
    const buttonTimer = setInterval(injectPingButton, 500);
    setTimeout(() => clearInterval(buttonTimer), 5000);

    // 2. Set up MutationObserver to automatically append badges whenever session list is drawn
    const observer = new MutationObserver(function(mutations) {
        $('.session-item').each(function() {
            const uid = $(this).attr('data-id');
            if (!uid) return;
            
            // Check if badge is already present
            if ($(this).find('.ping-badge').length === 0) {
                const smallEl = $(this).find('small.text-muted');
                if (smallEl.length > 0) {
                    smallEl.append(`<span class="badge rounded-pill bg-secondary-subtle text-secondary border border-secondary-subtle ms-2 ping-badge" data-uid="${uid}" style="font-size: 0.6rem; padding: 2px 6px;">Ready</span>`);
                }
            }
        });
    });

    const sessionListEl = document.getElementById('sessionList');
    if (sessionListEl) {
        observer.observe(sessionListEl, { childList: true });
    } else {
        // Fallback check if DOM isn't fully ready
        const listTimer = setInterval(function() {
            const el = document.getElementById('sessionList');
            if (el) {
                observer.observe(el, { childList: true });
                clearInterval(listTimer);
            }
        }, 300);
        setTimeout(() => clearInterval(listTimer), 5000);
    }

    // 3. Handle click event on the Test All Latencies button
    $(document).on('click', '#btnPingSessions', function(e) {
        e.stopPropagation();
        
        $('.session-item').each(function() {
            const uid = $(this).attr('data-id');
            const badge = $(this).find('.ping-badge');
            if (!uid || badge.length === 0) return;
            
            // Set badge to loading state
            badge.removeClass('bg-success-subtle text-success border-success-subtle bg-danger-subtle text-danger border-danger-subtle bg-secondary-subtle text-secondary border-secondary-subtle')
                 .addClass('bg-secondary-subtle text-secondary border-secondary-subtle')
                 .html('<span class="spinner-border spinner-border-sm text-secondary me-1" style="width: 8px; height: 8px; border-width: 1.2px;" role="status"></span>Ping...');
            
            // Call our secure plugin API endpoint
            fetch('/api/ping_check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ uid: uid })
            })
            .then(res => {
                if (!res.ok) throw new Error('HTTP status ' + res.status);
                return res.json();
            })
            .then(data => {
                if (data.success && data.online) {
                    badge.removeClass('bg-secondary-subtle text-secondary border-secondary-subtle')
                         .addClass('bg-success-subtle text-success border-success-subtle')
                         .text(`${data.latency}ms`);
                } else {
                    badge.removeClass('bg-secondary-subtle text-secondary border-secondary-subtle')
                         .addClass('bg-danger-subtle text-danger border-danger-subtle')
                         .text('Offline');
                }
            })
            .catch(err => {
                console.error('Ping check error:', err);
                badge.removeClass('bg-secondary-subtle text-secondary border-secondary-subtle')
                     .addClass('bg-danger-subtle text-danger border-danger-subtle')
                     .text('Error');
            });
        });
    });

    // 4. Trigger auto-ping on page load
    setTimeout(function() {
        if ($('.session-item').length > 0) {
            $('#btnPingSessions').trigger('click');
        }
    }, 1200);
});
