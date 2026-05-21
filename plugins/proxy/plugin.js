$(document).ready(function() {
    $(document).on('change', '#sessionProtocol', function() {
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