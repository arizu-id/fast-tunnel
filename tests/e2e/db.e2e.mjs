// Browser test for the MySQL panel (delete/drop actions + loading states) against a mocked API.
// Run: node tests/e2e/db.e2e.mjs   (needs `playwright` and a Chromium; set CHROMIUM_PATH if not auto-found)
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const harness = execFileSync('php', [path.join(root, 'tests/e2e/harness.php')], { encoding: 'utf8' });
const mime = { '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.html': 'text/html' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p === '/harness.html') { res.setHeader('content-type', 'text/html'); return res.end(harness); }
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end(); }
  res.setHeader('content-type', mime[path.extname(f)] || 'application/octet-stream');
  fs.createReadStream(f).pipe(res);
}).listen(0);
const base = `http://localhost:${server.address().port}`;

const launch = {};
if (process.env.CHROMIUM_PATH) launch.executablePath = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(launch);
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push('PAGEERR ' + e.message));
const calls = [];
const dbs = {
  shop: { users: [{ id: 1, name: 'a' }, { id: 2, name: 'b' }, { id: 3, name: 'c' }], orders: [{ id: 1 }] },
  blog: { posts: [] },
};
const cols = [
  { Field: 'id', Type: 'int(11)', Null: 'NO', Key: 'PRI', Default: null, Extra: 'auto_increment' },
  { Field: 'name', Type: 'varchar(50)', Null: 'YES', Key: '', Default: null, Extra: '' },
];
await page.route('**/api/**', async r => {
  const action = new URL(r.request().url()).pathname.split('/').pop();
  const body = r.request().postDataJSON() || {};
  calls.push({ action, body });
  await new Promise(x => setTimeout(x, 500));
  const ok = o => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, ...o }) });
  const db = dbs[body.db_name];
  switch (action) {
    case 'mysql_connect': return ok({ databases: Object.keys(dbs), tables: [], db_name: '' });
    case 'mysql_db_structure': return ok({ tables: Object.entries(db || {}).map(([n, rows]) => ({ Name: n, Rows: rows.length, Engine: 'InnoDB', Collation: 'utf8mb4', Data_length: 16384, Index_length: 0 })) });
    case 'mysql_table_data': return ok({ columns: ['id', 'name'], rows: db[body.table], total: db[body.table].length, page: 1, limit: 50 });
    case 'mysql_table_structure': return ok({ columns: cols, table: body.table });
    case 'mysql_drop_table': delete db[body.table]; return ok({});
    case 'mysql_delete_rows': { const ids = body.pk_rows.map(x => x.id); db[body.table] = db[body.table].filter(x => !ids.includes(x.id)); return ok({ affected: ids.length }); }
    case 'mysql_drop_database': delete dbs[body.db_name]; return ok({ databases: Object.keys(dbs) });
    case 'mysql_drop_columns': return ok({});
    default: return r.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'unexpected ' + action }) });
  }
});

let failed = 0;
const check = (name, cond) => { if (!cond) failed++; console.log((cond ? 'PASS ' : 'FAIL ') + name); };

await page.goto(base + '/harness.html');
await page.evaluate(async () => {
  const m = await import('/assets/js/modules/db.js');
  m.connectMysql('1', { name: 'X', host: 'h', port: 3306, user: 'u', password: btoa('p'), db_name: '' });
});
await page.waitForSelector('.db-tree-db[data-db="shop"]');
check('sidebar lists 2 dbs', (await page.locator('.db-tree-db').count()) === 2);
await page.click('.db-tree-db[data-db="shop"] > .tree-row');
await page.waitForSelector('#dbStructureBody tr[data-table="orders"]');
check('structure shows 2 tables', (await page.locator('#dbStructureBody tr[data-table]').count()) === 2);
check('sidebar tree rendered from the same request', (await page.locator('.db-tree-table').count()) === 2);
check('no separate mysql_list_tables call', !calls.some(c => c.action === 'mysql_list_tables'));

// drop table
await page.click('#dbStructureBody tr[data-table="orders"] .btn-st-drop');
await page.waitForSelector('#dbConfirmModal.show');
await page.click('#dbConfirmOk');
await page.waitForTimeout(250);
check('drop table: confirm btn spinning+disabled', await page.locator('#dbConfirmOk .spinner-border').count() === 1 && await page.locator('#dbConfirmOk').isDisabled());
check('drop table: structure row ft-loading', await page.locator('#dbStructureBody tr[data-table="orders"].ft-loading').count() === 1);
check('drop table: sidebar row ft-loading', await page.locator('.db-tree-table[data-table="orders"] > .tree-row.ft-loading').count() === 1);
await page.waitForSelector('#dbConfirmModal', { state: 'hidden' });
await page.waitForTimeout(1200);
check('drop table: request', calls.some(c => c.action === 'mysql_drop_table' && c.body.table === 'orders' && c.body.db_name === 'shop'));
check('drop table: row + sidebar item removed', await page.locator('[data-table="orders"]').count() === 0);

// delete rows (composite-capable pk_rows)
await page.click('#dbStructureBody tr[data-table="users"] .btn-st-browse');
await page.waitForSelector('#dbBrowseTbody .db-row-check');
const checks = page.locator('#dbBrowseTbody .db-row-check');
await checks.nth(0).check(); await checks.nth(1).check();
await page.click('#btnDeleteSelectedRows');
await page.waitForSelector('#dbConfirmModal.show');
await page.click('#dbConfirmOk');
await page.waitForTimeout(250);
check('delete rows: selected tr ft-loading', await page.locator('#dbBrowseTbody tr.ft-loading').count() === 2);
await page.waitForSelector('#dbConfirmModal', { state: 'hidden' });
await page.waitForTimeout(1200);
const del = calls.find(c => c.action === 'mysql_delete_rows');
check('delete rows: pk_rows request', del && JSON.stringify(del.body.pk_rows) === '[{"id":1},{"id":2}]');
check('delete rows: 1 row left', await page.locator('#dbBrowseTbody .db-row-check').count() === 1);

// drop column
await page.click('.db-tab-btn[data-tab="columns"]');
await page.evaluate(() => document.querySelector('#dbStructureBody tr[data-table="users"] .btn-st-columns').click());
await page.waitForSelector('#dbColumnsTbody .btn-drop-col');
await page.click('#dbColumnsTbody tr:nth-child(2) .btn-drop-col');
await page.waitForSelector('#dbConfirmModal.show');
await page.click('#dbConfirmOk');
await page.waitForTimeout(250);
check('drop column: row ft-loading', await page.locator('#dbColumnsTbody tr.ft-loading').count() === 1);
await page.waitForTimeout(1500);
check('drop column: request', calls.some(c => c.action === 'mysql_drop_columns' && c.body.columns[0] === 'name'));

// drop database requires typing the name
await page.click('.db-tree-db[data-db="blog"] .btn-drop-db');
await page.waitForSelector('#dbConfirmModal.show');
check('drop db: OK disabled until name typed', await page.locator('#dbConfirmOk').isDisabled());
await page.fill('#dbConfirmBody input', 'wrong');
check('drop db: still disabled on wrong name', await page.locator('#dbConfirmOk').isDisabled());
await page.fill('#dbConfirmBody input', 'blog');
check('drop db: enabled on exact name', await page.locator('#dbConfirmOk').isEnabled());
await page.click('#dbConfirmOk');
await page.waitForTimeout(250);
check('drop db: sidebar row ft-loading', await page.locator('.db-tree-db[data-db="blog"] > .tree-row.ft-loading').count() === 1);
await page.waitForTimeout(1200);
check('drop db: request carries confirm_name', calls.some(c => c.action === 'mysql_drop_database' && c.body.db_name === 'blog' && c.body.confirm_name === 'blog'));
check('drop db: removed from sidebar', await page.locator('.db-tree-db[data-db="blog"]').count() === 0);
check('no stuck loading', await page.locator('.ft-loading').count() === 0);
check('no JS errors', errors.length === 0);
if (errors.length) console.log(errors.join('\n'));
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
