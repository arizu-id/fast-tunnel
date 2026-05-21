<div id="proxyCheckWrapper" class="mb-3 border border-secondary rounded p-3 bg-darker">
    <div class="form-check form-switch mb-0">
        <input class="form-check-input" type="checkbox" role="switch" id="useProxy" name="use_proxy">
        <label class="form-check-label small text-muted text-uppercase fw-semibold tracking-wide" for="useProxy">Use Proxy Connection</label>
    </div>
    <div id="proxyFields" class="mt-3 d-none">
        <div class="mb-2">
            <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide">Proxy Type</label>
            <select class="form-select bg-dark text-light border-secondary" name="proxy_type">
                <option value="http">HTTP</option>
                <option value="socks4">SOCKS4</option>
                <option value="socks5" selected>SOCKS5</option>
            </select>
        </div>
        <div class="row g-2 mb-2">
            <div class="col-8">
                <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide">Proxy Host</label>
                <input type="text" class="form-control bg-dark text-light border-secondary" name="proxy_host" placeholder="e.g. 127.0.0.1">
            </div>
            <div class="col-4">
                <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide">Port</label>
                <input type="number" class="form-control bg-dark text-light border-secondary" name="proxy_port" placeholder="1080">
            </div>
        </div>
        <div class="row g-2">
            <div class="col-6">
                <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide">Proxy User</label>
                <input type="text" class="form-control bg-dark text-light border-secondary" name="proxy_user" placeholder="Username (optional)">
            </div>
            <div class="col-6">
                <label class="form-label small text-muted text-uppercase fw-semibold tracking-wide">Proxy Pass</label>
                <input type="password" class="form-control bg-dark text-light border-secondary" name="proxy_password" placeholder="Password (optional)">
            </div>
        </div>
    </div>
</div>
