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
  let body = {};
  try { body = r.request().postDataJSON() || {}; } catch (e) { body = { _multipart: r.request().postData() || '' }; }
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
    case 'mysql_create_database': dbs[body.db_name] = {}; return ok({ databases: Object.keys(dbs) });
    case 'mysql_create_table': dbs[body.db_name][body.table] = []; return ok({});
    case 'mysql_run_query': return ok({ type: 'select', columns: ['n'], rows: [{ n: 1 }] });
    case 'mysql_export': return r.fulfill({ contentType: 'text/csv', headers: { 'Content-Disposition': 'attachment; filename="shop_users.csv"' }, body: 'id,name\n1,a\n' });
    case 'mysql_import': return ok({ rows: 2, statements: 3 });
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
// ---- new features ----
// sorting: header click sends order_by
await page.click('.db-tab-btn[data-tab="browse"]');
await page.evaluate(() => document.querySelector('#dbStructureBody tr[data-table="users"] .btn-st-browse').click());
await page.waitForSelector('#dbBrowseThead .db-sort-th');
await page.click('#dbBrowseThead .db-sort-th[data-col="name"]');
await page.waitForTimeout(800);
check('sort: ASC request', calls.some(c => c.action === 'mysql_table_data' && c.body.order_by === 'name' && c.body.order_dir === 'ASC'));
await page.click('#dbBrowseThead .db-sort-th[data-col="name"]');
await page.waitForTimeout(800);
check('sort: DESC request', calls.some(c => c.action === 'mysql_table_data' && c.body.order_by === 'name' && c.body.order_dir === 'DESC'));

// format SQL + history
await page.click('.db-tab-btn[data-tab="sql"]');
await page.fill('#sqlQueryInput', "select a,b from t where x=1 and y=2 order by a");
await page.click('#btnFormatSql');
check('format SQL', (await page.inputValue('#sqlQueryInput')) === 'SELECT a,\n  b\nFROM t\nWHERE x = 1\n  AND y = 2\nORDER BY a');
await page.focus('#sqlQueryInput');
await page.keyboard.press('Control+Enter');
await page.waitForTimeout(900);
check('ctrl+enter runs the query', calls.some(c => c.action === 'mysql_run_query'));
await page.click('#btnSqlHistory');
check('history lists the executed query', (await page.locator('#sqlHistoryMenu .dropdown-item').first().innerText()).startsWith('SELECT a, b FROM t'));
await page.keyboard.press('Escape');

// create database (typed in modal) -> appears + selected
await page.click('#btnNewDatabase');
await page.waitForSelector('#dbNewDatabaseModal.show');
await page.fill('#dbNewDbName', 'fresh');
await page.click('#btnCreateDatabase');
await page.waitForSelector('.db-tree-db[data-db="fresh"]');
check('create database: request + sidebar item', calls.some(c => c.action === 'mysql_create_database' && c.body.db_name === 'fresh') && await page.locator('.db-tree-db[data-db="fresh"]').count() === 1);
await page.waitForSelector('#dbNewDatabaseModal', { state: 'hidden' });

// create table
await page.click('.db-tab-btn[data-tab="structure"]');
await page.waitForSelector('#btnNewTable');
await page.click('#btnNewTable');
await page.waitForSelector('#dbNewTableModal.show');
await page.fill('#dbNewTableName', 'items');
await page.click('#btnNewTableAddCol');
await page.locator('#dbNewTableCols tr').nth(1).locator('.nt-name').fill('title');
await page.click('#btnCreateTable');
await page.waitForTimeout(900);
const ct = calls.find(c => c.action === 'mysql_create_table');
check('create table: request has 2 columns, id PK+AI', ct && ct.body.table === 'items' && ct.body.columns.length === 2 && ct.body.columns[0].pk && ct.body.columns[0].ai && ct.body.columns[1].name === 'title');

// export (download) + import (csv)
await page.waitForSelector('#dbNewTableModal', { state: 'hidden' });
await page.waitForSelector('#dbStructureBody tr[data-table="items"]');
const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#dbStructureBody tr[data-table="items"] .btn-st-export-csv')]);
check('export: browser download named from header', dl.suggestedFilename() === 'shop_users.csv');
await page.click('#btnImportDb');
await page.waitForSelector('#dbImportModal.show');
await page.setInputFiles('#dbImportFile', { name: 'rows.csv', mimeType: 'text/csv', buffer: Buffer.from('id,name\n1,a\n') });
check('import: csv options shown', await page.locator('#dbImportCsvOpts').isVisible());
await page.click('#btnRunImport');
await page.waitForTimeout(900);
check('import: multipart request', calls.some(c => c.action === 'mysql_import' && c._multipart !== undefined || c.body._multipart));

check('no stuck loading', await page.locator('.ft-loading').count() === 0);
check('no JS errors', errors.length === 0);
if (errors.length) console.log(errors.join('\n'));
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
