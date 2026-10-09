// Browser test for the file manager (SFTP/FTP): multi-select, bulk delete/move, ZIP, upload queue, search.
// Run: node tests/e2e/files.e2e.mjs   (CHROMIUM_PATH optional)
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const harness = execFileSync('php', [path.join(root, 'tests/e2e/harness.php')], { encoding: 'utf8' });
const mime = { '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p === '/harness.html') { res.setHeader('content-type', 'text/html'); return res.end(harness); }
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end(); }
  res.setHeader('content-type', mime[path.extname(f)] || 'application/octet-stream');
  fs.createReadStream(f).pipe(res);
}).listen(0);
const base = `http://localhost:${server.address().port}`;

const launch = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {};
const browser = await chromium.launch(launch);
const ctx = await browser.newContext({ acceptDownloads: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push('PAGEERR ' + e.message));

// tiny in-memory file system behind the mocked API
const fsTree = { docs: { sub: { 'd.txt': 'd' }, 'c.txt': 'c' }, 'a.txt': 'a', 'b.txt': 'b', 'e.txt': 'e' };
const nodeAt = p => p.split('/').filter(Boolean).reduce((n, s) => (n && typeof n === 'object' ? n[s] : undefined), fsTree);
const listOf = p => { const n = nodeAt(p); if (!n || typeof n !== 'object') return null; return Object.entries(n).map(([name, v]) => ({ name, path: (p === '/' ? '' : p) + '/' + name, isDir: typeof v === 'object', size: 1, modify: '' })).sort((a, b) => (b.isDir - a.isDir) || a.name.localeCompare(b.name)); };
const parentAndName = p => { const parts = p.split('/').filter(Boolean); const name = parts.pop(); return [nodeAt('/' + parts.join('/')), name]; };
const calls = [];
await page.route('**/api/**', async r => {
  const action = new URL(r.request().url()).pathname.split('/').pop();
  let body = {};
  try { body = r.request().postDataJSON() || {}; } catch (e) { body = { _multipart: r.request().postData() || '' }; }
  calls.push({ action, body });
  await new Promise(x => setTimeout(x, action === 'upload' ? 900 : 200));
  const ok = o => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, ...o }) });
  switch (action) {
    case 'connect': return ok({ files: listOf('/'), pwd: '/' });
    case 'list': { const l = listOf(body.dir); return l ? ok({ files: l, pwd: body.dir }) : r.fulfill({ status: 400, contentType: 'application/json', body: '{"success":false,"error":"nope"}' }); }
    case 'delete_many': { let n = 0; body.items.forEach(it => { const [par, name] = parentAndName(it.path); if (par && name in par) { delete par[name]; n++; } }); return ok({ deleted: n, errors: [] }); }
    case 'move_many': { const dest = nodeAt(body.dest); body.sources.forEach(s => { const [par, name] = parentAndName(s); dest[name] = par[name]; delete par[name]; }); return ok({ moved: body.sources.length, errors: [] }); }
    case 'download_zip': return r.fulfill({ contentType: 'application/zip', headers: { 'Content-Disposition': 'attachment; filename="download.zip"' }, body: 'PK' });
    case 'upload': return ok({});
    case 'search': {
      const out = [];
      const walk = (n, p) => Object.entries(n).forEach(([k, v]) => { const fp = (p === '/' ? '' : p) + '/' + k; if (k.toLowerCase().includes(body.query.toLowerCase())) out.push({ name: k, path: fp, isDir: typeof v === 'object' }); if (typeof v === 'object') walk(v, fp); });
      walk(fsTree, '/');
      return ok({ results: out, truncated: false });
    }
    default: return r.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'unexpected ' + action }) });
  }
});

let failed = 0;
const check = (name, cond) => { if (!cond) failed++; console.log((cond ? 'PASS ' : 'FAIL ') + name); };
const row = p => page.locator(`.tree-item[data-path="${p}"] > .tree-row`);

await page.goto(base + '/harness.html');
await page.evaluate(async () => {
  window.__ftp = await import('/assets/js/modules/ftp.js');
  window.__ft = await import('/assets/js/modules/file-tools.js');
  window.__ftp.connectSession('1', { name: 'S', host: 'h', port: 22, user: 'u', password: btoa('p'), protocol: 'sftp' });
});
await page.waitForSelector('.tree-item[data-path="/a.txt"]');
check('SFTP session connects with protocol=sftp', calls.some(c => c.action === 'connect' && c.body.protocol === 'sftp'));

// ---- multi-select ----
await row('/a.txt').click({ modifiers: ['Control'] });
await row('/b.txt').click({ modifiers: ['Control'] });
check('ctrl+click selects two, bar shows count', (await page.locator('#ftpSelectionCount').innerText()) === '2 selected' && await page.locator('#ftpSelectionBar').isVisible());
check('ctrl+click did not open/select via the normal handler', calls.filter(c => c.action === 'read_file').length === 0);
await page.keyboard.press('Escape');
check('Escape clears the selection', await page.locator('.tree-row.multi-selected').count() === 0 && !(await page.locator('#ftpSelectionBar').isVisible()));
await row('/docs').click({ modifiers: ['Control'] });          // anchor
await row('/b.txt').click({ modifiers: ['Shift'] });           // docs..b.txt range = docs, a.txt, b.txt
check('shift+click selects the visible range', await page.locator('.tree-row.multi-selected').count() === 3);
await page.click('#btnSelClear');
await row('/a.txt').click();                                    // plain click clears and is handled normally
check('plain click leaves selection empty', await page.locator('.tree-row.multi-selected').count() === 0);

// ---- bulk download (zip) ----
await row('/a.txt').click({ modifiers: ['Control'] });
await row('/b.txt').click({ modifiers: ['Control'] });
const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btnSelDownload')]);
check('ZIP download triggered with server filename', dl.suggestedFilename() === 'download.zip');
const z = calls.find(c => c.action === 'download_zip');
check('ZIP request lists both items', z && z.body.items.length === 2);

// ---- bulk move ----
await page.click('#btnSelMove');
await page.waitForSelector('#inputModal.show');
await page.fill('#inputModalValue', '/docs');
await page.click('#btnInputModalConfirm');
await page.waitForTimeout(100);
check('move: rows show loading while the request runs', await page.locator('.tree-row.ft-loading').count() >= 2);
await page.waitForSelector('#inputModal', { state: 'hidden' });
await page.waitForTimeout(700);
const mv = calls.find(c => c.action === 'move_many');
check('move_many request', mv && mv.body.dest === '/docs' && JSON.stringify(mv.body.sources.sort()) === '["/a.txt","/b.txt"]');
check('moved files left the root listing', await page.locator('.tree-item[data-path="/a.txt"]').count() === 0);

// ---- bulk delete ----
await row('/e.txt').click({ modifiers: ['Control'] });
await row('/docs').click({ modifiers: ['Control'] });
await page.click('#btnSelDelete');
await page.waitForSelector('#confirmModal.show');
check('delete confirm mentions folder contents', (await page.locator('#confirmModalMessage').innerText()).includes('everything inside'));
await page.click('#btnConfirmModalExecute');
await page.waitForTimeout(100);
check('delete: confirm button spinning', await page.locator('#btnConfirmModalExecute .spinner-border').count() === 1);
check('delete: selected rows ft-loading', await page.locator('.tree-row.ft-loading').count() >= 2);
await page.waitForSelector('#confirmModal', { state: 'hidden' });
await page.waitForTimeout(700);
const del = calls.find(c => c.action === 'delete_many');
check('delete_many request has both items with isDir flags', del && del.body.items.some(i => i.path === '/docs' && i.isDir === true) && del.body.items.some(i => i.path === '/e.txt' && i.isDir === false));
check('tree refreshed after delete', await page.locator('.tree-item[data-path="/docs"]').count() === 0 && await page.locator('.tree-item[data-path="/e.txt"]').count() === 0);
check('no stuck loading after delete', await page.locator('.ft-loading').count() === 0);

// ---- upload queue ----
fsTree.docs = { sub: { 'd.txt': 'd' }, 'c.txt': 'c' };
await page.evaluate(() => window.__ftp.expandAndRefreshFolder('/'));
await page.waitForSelector('.tree-item[data-path="/docs"]');
const before = calls.filter(c => c.action === 'list').length;
await page.evaluate(() => {
  const mk = (n, c) => new File([c], n);
  window.__ft.enqueueUploads([{ file: mk('one.txt', '1'), relDir: '' }, { file: mk('two.txt', '22'), relDir: 'photos/2024' }, { file: mk('three.txt', '333'), relDir: '' }], '/');
});
await page.waitForSelector('#uploadQueuePanel .uq-row');
check('queue panel lists 3 files', await page.locator('#uploadQueuePanel .uq-row').count() === 3);
await page.waitForTimeout(300);
check('max 2 uploads run in parallel (3rd pending)', await page.locator('#uploadQueuePanel .uq-icon.bi-arrow-repeat').count() === 2 && await page.locator('#uploadQueuePanel .uq-icon.bi-hourglass-split').count() === 1);
check('destination folder shows loading while uploading', await page.locator('#fileList.ft-loading').count() === 1);
await page.waitForFunction(() => document.querySelectorAll('#uploadQueuePanel .uq-icon.bi-check-circle-fill').length === 3, null, { timeout: 8000 });
check('all uploads finished with success icons', true);
const ups = calls.filter(c => c.action === 'upload');
check('upload requests carry dir and rel_dir', ups.length === 3 && ups.some(u => u.body._multipart.includes('name="rel_dir"') && u.body._multipart.includes('photos/2024')));
await page.waitForTimeout(500);
check('destination refreshed once after the batch', calls.filter(c => c.action === 'list').length > before);
check('no stuck loading after uploads', await page.locator('.ft-loading').count() === 0);

// failed upload shows error + retry
await page.route('**/api/upload', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":false,"error":"Upload failed for big.bin: exceeds upload_max_filesize"}' }));
await page.evaluate(() => window.__ft.enqueueUploads([{ file: new File(['x'], 'big.bin'), relDir: '' }], '/'));
await page.waitForSelector('#uploadQueuePanel .uq-err:not(.d-none)');
check('failed upload shows the server error and a retry button', (await page.locator('#uploadQueuePanel .uq-err:not(.d-none)').innerText()).includes('upload_max_filesize') && await page.locator('#uploadQueuePanel .uq-retry').count() === 1);
await page.click('#uqClear');
check('clear removes finished rows', await page.locator('#uploadQueuePanel .uq-row').count() === 0);

// ---- search ----
await page.fill('#ftpSearchInput', 'D.TX');
await page.waitForSelector('#fileSearchResults .search-hit');
check('search hides the tree and shows results', await page.locator('#fileList').isHidden() && await page.locator('#fileSearchResults .search-hit').count() === 1);
check('search result shows full path', (await page.locator('#fileSearchResults .search-hit').first().getAttribute('title')) === '/docs/sub/d.txt');
await page.fill('#ftpSearchInput', 'sub');
await page.waitForFunction(() => document.querySelector('#fileSearchResults .search-hit .item-name')?.textContent === 'sub');
await page.click('#fileSearchResults .search-hit');
await page.waitForSelector('.tree-item[data-path="/docs/sub"].selected', { timeout: 8000 });
check('clicking a folder result restores the tree and reveals the folder', await page.locator('#fileList').isVisible() && await page.locator('.tree-item[data-path="/docs"]').getAttribute('data-expanded') === 'true');
check('search box cleared after reveal', (await page.inputValue('#ftpSearchInput')) === '');

check('no JS errors', errors.length === 0);
if (errors.length) console.log(errors.join('\n'));
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
