export async function deriveKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

export async function encryptData(password, plainText) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv   = crypto.getRandomValues(new Uint8Array(12));
    const key  = await deriveKey(password, salt);
    const enc  = new TextEncoder();
    const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plainText));
    const out = new Uint8Array(16 + 12 + cipherBuf.byteLength);
    out.set(salt, 0);
    out.set(iv, 16);
    out.set(new Uint8Array(cipherBuf), 28);
    return btoa(String.fromCharCode(...out));
}

export async function decryptData(password, b64) {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const salt  = bytes.slice(0, 16);
    const iv    = bytes.slice(16, 28);
    const cipher = bytes.slice(28);
    const key   = await deriveKey(password, salt);
    const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
    return new TextDecoder().decode(plainBuf);
}

export const cryptoState = {
    pendingImportData: null
};