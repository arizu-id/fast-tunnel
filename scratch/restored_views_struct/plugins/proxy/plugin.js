$(document).ready(function() {
    $(document).on('change', '#sessionProtocol', function() {
        const proto = $(this).val();
        if (proto === 'ftp') {
            $('#proxyCheckWrapper').removeClass('d-none');
            if ($('#useProxy').is(':checked')) {
                $('#proxyFields').removeClass('d-none');
            }
        } else {
            $('#proxyCheckWrapper').addClass('d-none');
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
