/**
 * POST JSON to /api/<action>. Rejects with an Error carrying the server message
 * whenever the HTTP status or `success` flag signals failure.
 * (The CSRF header is injected by the global fetch wrapper in app.js.)
 */
export function api(action, body = {}) {
    return fetch('/api/' + action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    }).then(async r => {
        let json;
        try { json = await r.json(); } catch (e) { throw new Error('Invalid server response'); }
        if (!r.ok || json.success === false) throw new Error(json.error || 'Request failed');
        return json;
    });
}
