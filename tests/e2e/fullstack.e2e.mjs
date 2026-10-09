// Full-stack browser test: real PHP app (php -S) + real MySQL/MariaDB.
// FT_DB_HOST/FT_DB_PORT/FT_DB_USER/FT_DB_PASS select the database; CHROMIUM_PATH is optional.
// Covers: installer, login page, main UI, 2FA setup/login/recovery/disable through the UI, audit log viewer.
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
if (fs.existsSync(path.join(root, 'config.php'))) { console.error('config.php exists; refusing to touch an installed instance'); process.exit(2); }
const port = 19000 + (process.pid % 900);
const base = `http://127.0.0.1:${port}`;
const db = { host: process.env.FT_DB_HOST || '127.0.0.1', port: +(process.env.FT_DB_PORT || 3306), user: process.env.FT_DB_USER || 'root', pass: process.env.FT_DB_PASS || '' };
const appDb = 'ft_e2e_' + process.pid;

const server = spawn('php', ['-S', `127.0.0.1:${port}`, path.join(root, 'tests/integration/router.php')], { cwd: root, stdio: 'ignore' });
const cleanup = () => { server.kill(); for (const f of ['config.php', 'installed.lock']) try { fs.unlinkSync(path.join(root, f)); } catch (e) {} };
process.on('exit', cleanup);
for (let i = 0; i < 50; i++) { try { await fetch(base + '/login'); break; } catch (e) { await new Promise(r => setTimeout(r, 100)); } }

// RFC 6238 in node, to act as the user's authenticator app
const b32 = s => { const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = ''; for (const c of s.replace(/[\s=]/g, '').toUpperCase()) bits += A.indexOf(c).toString(2).padStart(5, '0'); const out = []; for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2)); return Buffer.from(out); };
const totp = (secret, step) => { const b = Buffer.alloc(8); b.writeBigUInt64BE(BigInt(step)); const h = crypto.createHmac('sha1', b32(secret)).update(b).digest(); const o = h[19] & 15; return String(((h.readUInt32BE(o) & 0x7fffffff) % 1e6)).padStart(6, '0'); };
const step = () => Math.floor(Date.now() / 30000);

let failed = 0;
const check = (name, cond) => { if (!cond) failed++; console.log((cond ? 'PASS ' : 'FAIL ') + name); };

const inst = await (await fetch(base + '/install/setup.php', { method: 'POST', body: JSON.stringify({ db_host: db.host, db_port: db.port, db_user: db.user, db_pass: db.pass, db_name: appDb, admin_user: 'admin', admin_pass: 'S3cret-pass!' }) })).json();
check('installer runs', inst.success === true);

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage();
// skip the first-run onboarding tour (its backdrop would intercept clicks)
await page.addInitScript(() => { try { localStorage.setItem('ft_tour_v1', '1'); } catch (e) {} });
const errors = [];
page.on('pageerror', e => errors.push('PAGEERR ' + e.message));
page.on('response', r => { if (r.status() >= 500) errors.push('HTTP ' + r.status() + ' ' + r.url()); });

const login = async (user, pass, code) => {
  await page.goto(base + '/login');
  await page.fill('#loginUser', user);
  await page.fill('#loginPass', pass);
  await page.click('#btnLogin');
  if (code !== undefined) {
    await page.waitForSelector('#totpGroup', { state: 'visible' });
    await page.fill('#loginTotp', code);
    await page.click('#btnLogin');
  }
};

await page.goto(base + '/');
check('unauthenticated visit redirects to /login', page.url().endsWith('/login'));
await login('admin', 'wrong');
await page.waitForSelector('#loginError', { state: 'visible' });
check('wrong password shows an error', (await page.innerText('#loginError')).includes('Invalid'));
await login('admin', 'S3cret-pass!');
await page.waitForSelector('#btnLogout', { state: 'attached' });
check('login lands on the main UI', page.url() === base + '/' && await page.locator('#sessionList').count() === 1);

// ---- 2FA through the UI ----
await page.click('#btnMoreSettings');
await page.click('#btnTriggerCredentialsModal');
await page.waitForSelector('#editCredentialsModal.show');
await page.waitForSelector('#twofaOff:not(.d-none)');
check('2FA section shows Off', (await page.innerText('#twofaBadge')) === 'Off');
await page.click('#btnTwofaStart');
await page.waitForSelector('#twofaSetup:not(.d-none)');
check('QR code rendered (svg) and secret shown', await page.locator('#twofaQr svg').count() === 1 && (await page.innerText('#twofaSecret')).replace(/\s/g, '').length >= 16);
const secret = (await page.innerText('#twofaSecret')).replace(/\s/g, '');
await page.fill('#twofaCode', '000000');
await page.click('#btnTwofaVerify');
await page.waitForTimeout(800);
check('wrong code does not enable 2FA', await page.locator('#twofaRecovery:not(.d-none)').count() === 0);
await page.fill('#twofaCode', totp(secret, step()));
await page.click('#btnTwofaVerify');
await page.waitForSelector('#twofaRecovery:not(.d-none)');
const codes = (await page.innerText('#twofaCodes')).trim().split(/\s+/);
check('8 recovery codes shown once', codes.length === 8 && /^[a-z2-9]{5}-[a-z2-9]{5}$/.test(codes[0]));
await page.click('#btnTwofaDone');
await page.waitForSelector('#twofaOn:not(.d-none)');
check('badge flips to On and codes are cleared from the page', (await page.innerText('#twofaBadge')) === 'On' && (await page.innerText('#twofaCodes')) === '');
await page.click('#editCredentialsModal .btn-close');
await page.waitForSelector('#editCredentialsModal', { state: 'hidden' });

// ---- logout, then login needs the code ----
await page.click('#btnMoreSettings');
await page.click('#btnLogout');
await page.waitForURL('**/login');
await login('admin', 'S3cret-pass!');
await page.waitForSelector('#totpGroup', { state: 'visible' });
check('login form asks for the authentication code', (await page.innerText('#loginError')).includes('6-digit') && (await page.innerText('#btnLogin')).includes('Verify'));
await page.fill('#loginTotp', '111111');
await page.click('#btnLogin');
await page.waitForFunction(() => document.getElementById('loginError').textContent.includes('Invalid two-factor'));
check('wrong code is rejected on the login page', page.url().endsWith('/login'));
await page.fill('#loginTotp', totp(secret, step() + 1));
await page.click('#btnLogin');
await page.waitForSelector('#btnLogout', { state: 'attached' });
check('correct code signs in', page.url() === base + '/');

// ---- audit log viewer ----
await page.click('#btnMoreSettings');
await page.click('#btnAuditLog');
await page.waitForSelector('#auditLogBody tr td .badge');
const actions = await page.locator('#auditLogBody .badge').allInnerTexts();
check('audit log lists logins, failed logins and 2FA enable', ['auth_login', 'auth_login_failed', 'totp_enable'].every(a => actions.includes(a)));
check('audit log shows the user and ip', (await page.locator('#auditLogBody tr').first().innerText()).includes('admin') && (await page.locator('#auditLogBody tr').first().innerText()).includes('127.0.0.1'));
await page.click('#auditLogModal .btn-close');
await page.waitForSelector('#auditLogModal', { state: 'hidden' });

// ---- disable via recovery code ----
await page.click('#btnMoreSettings');
await page.click('#btnTriggerCredentialsModal');
await page.waitForSelector('#twofaOn:not(.d-none)');
await page.fill('#twofaDisablePass', 'S3cret-pass!');
await page.fill('#twofaDisableCode', codes[0]);
await page.click('#btnTwofaDisable');
await page.waitForSelector('#twofaOff:not(.d-none)');
check('2FA disabled with password + recovery code', (await page.innerText('#twofaBadge')) === 'Off');

check('no JS errors / HTTP 5xx during the whole flow', errors.length === 0);
if (errors.length) console.log(errors.join('\n'));
await browser.close();
try {
  const mysql = await import('child_process');
  mysql.execFileSync('php', ['-r', `$p=new PDO('mysql:host=${db.host};port=${db.port}','${db.user}','${db.pass}');$p->exec('DROP DATABASE IF EXISTS \`${appDb}\`');`]);
} catch (e) {}
process.exit(failed ? 1 : 0);
