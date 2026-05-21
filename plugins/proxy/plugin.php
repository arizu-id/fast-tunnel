<?php
registerFtpConfigHook(function(array $config, array $requestData): array {
    if (!empty($requestData['use_proxy']) && !empty($requestData['proxy_host'])) {
        $config['use_proxy']      = true;
        $config['proxy_host']     = trim($requestData['proxy_host']);
        $config['proxy_port']     = (int)($requestData['proxy_port'] ?? 1080);
        $config['proxy_type']     = $requestData['proxy_type'] ?? 'socks5';
        $config['proxy_user']     = $requestData['proxy_user'] ?? '';
        $config['proxy_password'] = $requestData['proxy_password'] ?? '';
    }
    return $config;
});
