$(document).ready(function() {
    // In Add Session modal: show proxy for ALL protocols
    $(document).on('change', '#sessionProtocol', function() {
        // Proxy is available for all protocols — always show it
        $('#proxyCheckWrapper').removeClass('d-none');
        if (!$('#useProxy').is(':checked')) {
            $('#proxyFields').addClass('d-none');
        }
    });

    $(document).on('change', '#useProxy', function() {
        if (this.checked) {
            $('#proxyFields').removeClass('d-none');
        } else {
            $('#proxyFields').addClass('d-none');
        }
    });
});