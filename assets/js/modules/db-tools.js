// Helpers for the MySQL panel: SQL formatter, query history, export download, import upload.

const KEYWORDS = new Set(('SELECT FROM WHERE AND OR NOT IN IS NULL LIKE BETWEEN EXISTS AS ON JOIN LEFT RIGHT INNER OUTER CROSS FULL ' +
    'GROUP BY ORDER HAVING LIMIT OFFSET UNION ALL DISTINCT INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE ALTER DROP ADD COLUMN ' +
    'INDEX PRIMARY KEY UNIQUE DEFAULT CASE WHEN THEN ELSE END ASC DESC TRUNCATE EXPLAIN SHOW DESCRIBE USING').split(' '));
// Clause starters that begin a new line at nesting depth 0 (multi-word ones are matched first)
const CLAUSES = ['GROUP BY', 'ORDER BY', 'INSERT INTO', 'DELETE FROM', 'UNION ALL', 'LEFT OUTER JOIN', 'RIGHT OUTER JOIN',
    'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'CROSS JOIN', 'FULL JOIN', 'SELECT', 'FROM', 'WHERE', 'HAVING', 'LIMIT', 'UNION',
    'VALUES', 'SET', 'UPDATE', 'JOIN'];
const LIST_CLAUSES = new Set(['SELECT', 'GROUP BY', 'ORDER BY', 'SET']);
const NO_SPACE_BEFORE_PAREN = new Set(['IN', 'VALUES', 'AS', 'ON', 'AND', 'OR', 'WHERE', 'SELECT', 'FROM', 'JOIN', 'UNION', 'ALL', 'SET',
    'NOT', 'EXISTS', 'LIKE', 'BY', 'HAVING', 'INTO', 'USING', 'WHEN', 'THEN', 'ELSE', 'TABLE', 'KEY', 'UPDATE', 'DISTINCT']);

function tokenize(sql) {
    const re = /('(?:[^'\\]|\\.|'')*'|"(?:[^"\\]|\\.|"")*"|`[^`]*`)|(--[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/)|(\d+(?:\.\d+)?)|([A-Za-z_][\w$]*)|(\s+)|(.)/gy;
    const tokens = [];
    let m;
    while ((m = re.exec(sql)) !== null) {
        if (m[1]) tokens.push({ t: 'str', v: m[1] });
        else if (m[2]) tokens.push({ t: m[2].startsWith('/*') ? 'block' : 'line', v: m[2] });
        else if (m[3]) tokens.push({ t: 'num', v: m[3] });
        else if (m[4]) tokens.push({ t: 'word', v: m[4] });
        else if (m[6]) tokens.push({ t: 'sym', v: m[6] });
        if (re.lastIndex >= sql.length) break;
    }
    return tokens;
}

/** Pretty-print a SQL statement: uppercase keywords, one clause per line, AND/OR indented. */
export function formatSql(sql) {
    const tokens = tokenize(sql.trim());
    let out = '';
    let depth = 0;
    let clause = '';
    let prev = null;
    const wordUp = i => (tokens[i] && tokens[i].t === 'word' ? tokens[i].v.toUpperCase() : null);
    const nl = (indent = '') => { out = out.replace(/[ \t]+$/, '') + '\n' + indent; prev = null; };
    for (let i = 0; i < tokens.length; i++) {
        const tk = tokens[i];
        if (tk.t === 'word') {
            const up = tk.v.toUpperCase();
            let matched = null;
            if (depth === 0) {
                for (const c of CLAUSES) {
                    const parts = c.split(' ');
                    if (parts.every((p, k) => wordUp(i + k) === p)) { matched = c; break; }
                }
            }
            if (matched) {
                if (out) nl();
                out += matched + ' ';
                i += matched.split(' ').length - 1;
                clause = matched;
                prev = { t: 'kw', v: matched, needSpace: false };
                continue;
            }
            if (depth === 0 && (up === 'AND' || up === 'OR') && out) {
                nl('  ');
                out += up + ' ';
                prev = { t: 'kw', v: up, needSpace: false };
                continue;
            }
            const isKw = KEYWORDS.has(up);
            if (prev && prev.needSpace !== false) out += ' ';
            out += isKw ? up : tk.v;
            prev = { t: 'word', v: up, kw: isKw, afterInto: !!(prev && prev.v === 'INSERT INTO') };
            continue;
        }
        if (tk.t === 'num') {
            if (prev && prev.needSpace !== false) out += ' ';
            out += tk.v;
            prev = { t: 'num', v: tk.v };
            continue;
        }
        if (tk.t === 'line') {
            if (out && !out.endsWith('\n')) out += ' ';
            out += tk.v;
            nl();
            continue;
        }
        if (tk.t === 'sym') {
            const c = tk.v;
            if (c === '(') {
                const space = prev && prev.needSpace !== false &&
                    (prev.t === 'word' ? (NO_SPACE_BEFORE_PAREN.has(prev.v) || prev.afterInto) : true);
                if (space) out += ' ';
                out += '(';
                depth++;
                prev = { t: 'sym', v: '(', needSpace: false };
            } else if (c === ')') {
                depth = Math.max(0, depth - 1);
                out = out.replace(/\s+$/, '') + ')';
                prev = { t: 'sym', v: ')' };
            } else if (c === ',') {
                out = out.replace(/\s+$/, '') + ',';
                if (depth === 0 && LIST_CLAUSES.has(clause)) { nl('  '); } else { out += ' '; prev = { t: 'sym', v: ',', needSpace: false }; }
            } else if (c === ';') {
                out = out.replace(/\s+$/, '') + ';';
                nl();
            } else if (c === '.') {
                out = out.replace(/\s+$/, '') + '.';
                prev = { t: 'sym', v: '.', needSpace: false };
            } else if ('=<>!+-*/%'.includes(c)) {
                if (prev && prev.needSpace !== false && !(c === '*' && prev.t === 'kw' && prev.v === 'SELECT')) out += ' ';
                out += c;
                prev = { t: 'sym', v: c, needSpace: !'<>=!'.includes(c) };
                // glue multi-char operators (<=, >=, !=, <>)
                const nx = tokens[i + 1];
                if (nx && nx.t === 'sym' && '=<>'.includes(nx.v) && '<>!'.includes(c)) { out += nx.v; i++; }
                out += ' ';
                prev = { t: 'sym', v: c, needSpace: false };
            } else {
                if (prev && prev.needSpace !== false) out += ' ';
                out += c;
                prev = { t: 'sym', v: c };
            }
            continue;
        }
        // string / block comment
        if (prev && prev.needSpace !== false) out += ' ';
        else if (prev && prev.v === ',') out += '';
        out += tk.v;
        prev = { t: tk.t, v: tk.v };
    }
    return out.replace(/[ \t]+\n/g, '\n').trim();
}

// ── Query history (per browser) ──
const HISTORY_KEY = 'ft_sql_history';
const HISTORY_MAX = 50;
export function getSqlHistory() {
    try {
        const h = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        return Array.isArray(h) ? h : [];
    } catch (e) { return []; }
}
export function pushSqlHistory(sql) {
    sql = sql.trim();
    if (!sql) return;
    const h = getSqlHistory().filter(x => x !== sql);
    h.unshift(sql);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, HISTORY_MAX))); } catch (e) { /* storage unavailable */ }
}
export function clearSqlHistory() {
    try { localStorage.removeItem(HISTORY_KEY); } catch (e) { /* ignore */ }
}

// ── Export / import ──
/** POST to mysql_export and save the streamed response as a file. */
export async function downloadExport(params) {
    const r = await fetch('/api/mysql_export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    });
    if (!r.ok) {
        let msg = 'Export failed';
        try { msg = (await r.json()).error || msg; } catch (e) { /* not JSON */ }
        throw new Error(msg);
    }
    const blob = await r.blob();
    const m = /filename="([^"]+)"/.exec(r.headers.get('Content-Disposition') || '');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = m ? m[1] : `export.${params.format || 'sql'}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Upload a .sql/.csv file to mysql_import. */
export async function uploadImport(fields, file) {
    const fd = new FormData();
    Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
    fd.append('import_file', file);
    const r = await fetch('/api/mysql_import', { method: 'POST', body: fd });
    let json;
    try { json = await r.json(); } catch (e) { throw new Error('Invalid server response'); }
    if (!r.ok || json.success === false) throw new Error(json.error || 'Import failed');
    return json;
}
