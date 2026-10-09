// File-manager extras for FTP/SFTP: upload queue with progress, multi-select actions, ZIP download, search.
import { api } from './api.js';
import { showToast, showConfirmModal, promptInput } from './ui.js';
import { setLoading, withLoading } from './loading.js';

// ftp.js injects the pieces of the tree it owns (avoids a circular import)
const cfg = {
    refreshFolder: () => {},          // (path) => void
    folderTarget: () => $(),          // (path) => jQuery element showing that folder's loading state
    closePaths: () => {},             // (paths[]) => close editor tabs for deleted/moved files
    openFile: () => {},               // (path, name)
    reveal: () => {},                 // (path) => expand the tree down to path
    parentOf: p => p.replace(/\/[^/]*\/?$/, '') || '/',
};
export function configureFileTools(c) { Object.assign(cfg, c); }

const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content || '';
const esc = s => $('<div>').text(s == null ? '' : s).html();
const fmtSize = b => (b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB');

// ───────────────────────── Upload queue ─────────────────────────
const queue = [];
let nextId = 1;
let running = 0;
const MAX_PARALLEL = 2;
let collapsed = false;

/** entries: [{file: File, relDir?: 'sub/dir'}]; dest: remote folder */
export function enqueueUploads(entries, dest) {
    if (!entries.length) return;
    entries.forEach(e => queue.push({
        id: nextId++, file: e.file, relDir: e.relDir || '', dest,
        status: 'pending', progress: 0, error: '', xhr: null, refreshed: false,
    }));
    renderQueue();
    pump();
}

function pump() {
    while (running < MAX_PARALLEL) {
        const job = queue.find(j => j.status === 'pending');
        if (!job) break;
        startJob(job);
    }
}

function startJob(job) {
    running++;
    job.status = 'uploading';
    updateRow(job);
    setLoading(cfg.folderTarget(job.dest), true);
    const xhr = new XMLHttpRequest();
    job.xhr = xhr;
    const fd = new FormData();
    fd.append('dir', job.dest);
    if (job.relDir) fd.append('rel_dir', job.relDir);
    fd.append('files[]', job.file, job.file.name);
    xhr.open('POST', '/api/upload');
    xhr.setRequestHeader('X-CSRF-Token', csrf());
    xhr.upload.onprogress = e => {
        if (e.lengthComputable) { job.progress = e.loaded / e.total; updateRow(job); }
    };
    xhr.onload = () => {
        let res = null;
        try { res = JSON.parse(xhr.responseText); } catch (e) { /* not JSON */ }
        if (xhr.status === 200 && res && res.success) { job.status = 'done'; job.progress = 1; }
        else { job.status = 'error'; job.error = (res && res.error) || ('HTTP ' + xhr.status); }
        finishJob(job);
    };
    xhr.onerror = () => { job.status = 'error'; job.error = 'Network error'; finishJob(job); };
    xhr.onabort = () => { job.status = 'cancelled'; finishJob(job); };
    xhr.send(fd);
}

function finishJob(job) {
    running--;
    job.xhr = null;
    setLoading(cfg.folderTarget(job.dest), false);
    updateRow(job);
    pump();
    if (!queue.some(j => j.status === 'pending' || j.status === 'uploading')) batchDone();
}

function batchDone() {
    const dests = new Set();
    let ok = 0, bad = 0;
    queue.forEach(j => {
        if (j.status === 'done' && !j.refreshed) { j.refreshed = true; ok++; dests.add(j.dest); }
        if (j.status === 'error' && !j.counted) { j.counted = true; bad++; }
    });
    dests.forEach(d => cfg.refreshFolder(d));
    if (ok) showToast(`${ok} file(s) uploaded` + (bad ? `, ${bad} failed` : ''), bad ? 'warning' : 'success');
    else if (bad) showToast(`${bad} upload(s) failed`, 'danger');
}

function ensurePanel() {
    let $p = $('#uploadQueuePanel');
    if ($p.length) return $p;
    $p = $(`<div id="uploadQueuePanel" class="upload-queue-panel">
        <div class="uq-header d-flex align-items-center gap-2 px-3 py-2">
            <i class="bi bi-cloud-arrow-up text-info"></i>
            <strong class="small flex-grow-1" id="uqTitle">Uploads</strong>
            <button class="btn btn-sm btn-icon text-muted p-0" id="uqClear" title="Clear finished"><i class="bi bi-check2-all"></i></button>
            <button class="btn btn-sm btn-icon text-muted p-0" id="uqCancel" title="Cancel all"><i class="bi bi-stop-circle"></i></button>
            <button class="btn btn-sm btn-icon text-muted p-0" id="uqToggle" title="Collapse"><i class="bi bi-chevron-down"></i></button>
        </div>
        <div class="uq-body" id="uqBody"></div>
    </div>`).appendTo('body');
    $p.on('click', '#uqToggle', () => { collapsed = !collapsed; $('#uqBody').toggleClass('d-none', collapsed); $('#uqToggle i').toggleClass('bi-chevron-down bi-chevron-up', collapsed); });
    $p.on('click', '#uqClear', () => {
        for (let i = queue.length - 1; i >= 0; i--) if (['done', 'error', 'cancelled'].includes(queue[i].status)) queue.splice(i, 1);
        renderQueue();
    });
    $p.on('click', '#uqCancel', () => queue.forEach(cancelJob));
    $p.on('click', '.uq-cancel', function() { const j = queue.find(x => x.id === $(this).closest('.uq-row').data('id')); if (j) cancelJob(j); });
    $p.on('click', '.uq-retry', function() {
        const j = queue.find(x => x.id === $(this).closest('.uq-row').data('id'));
        if (j) { j.status = 'pending'; j.progress = 0; j.error = ''; j.counted = false; renderQueue(); pump(); }
    });
    return $p;
}

function cancelJob(job) {
    if (job.status === 'uploading' && job.xhr) job.xhr.abort();
    else if (job.status === 'pending') { job.status = 'cancelled'; updateRow(job); }
}

function rowHtml(job) {
    const name = (job.relDir ? job.relDir + '/' : '') + job.file.name;
    return `<div class="uq-row" data-id="${job.id}">
        <div class="d-flex align-items-center gap-2">
            <i class="bi uq-icon"></i>
            <span class="text-truncate flex-grow-1 small" title="${esc(job.dest + '/' + name)}">${esc(name)}</span>
            <span class="text-muted uq-size" style="font-size:.7rem;">${fmtSize(job.file.size)}</span>
            <button class="btn btn-sm btn-icon p-0 uq-act"></button>
        </div>
        <div class="progress mt-1" style="height:4px;"><div class="progress-bar"></div></div>
        <div class="uq-err text-danger small d-none"></div>
    </div>`;
}

function renderQueue() {
    const $p = ensurePanel();
    $('#uqBody').html(queue.map(rowHtml).join(''));
    queue.forEach(updateRow);
    $p.toggleClass('d-none', queue.length === 0);
}

function updateRow(job) {
    const $r = $(`#uqBody .uq-row[data-id="${job.id}"]`);
    if (!$r.length) { updateTitle(); return; }
    const icons = { pending: 'bi-hourglass-split text-muted', uploading: 'bi-arrow-repeat spin text-info', done: 'bi-check-circle-fill text-success', error: 'bi-exclamation-triangle-fill text-danger', cancelled: 'bi-slash-circle text-muted' };
    $r.find('.uq-icon').attr('class', 'bi uq-icon ' + icons[job.status]);
    const $bar = $r.find('.progress-bar').css('width', Math.round(job.progress * 100) + '%')
        .toggleClass('bg-success', job.status === 'done').toggleClass('bg-danger', job.status === 'error');
    $bar.parent().toggleClass('d-none', job.status === 'cancelled');
    const $act = $r.find('.uq-act');
    if (job.status === 'pending' || job.status === 'uploading') $act.attr('class', 'btn btn-sm btn-icon p-0 uq-act uq-cancel text-muted').attr('title', 'Cancel').html('<i class="bi bi-x-lg"></i>').show();
    else if (job.status === 'error' || job.status === 'cancelled') $act.attr('class', 'btn btn-sm btn-icon p-0 uq-act uq-retry text-info').attr('title', 'Retry').html('<i class="bi bi-arrow-clockwise"></i>').show();
    else $act.hide();
    $r.find('.uq-err').toggleClass('d-none', !job.error).text(job.error);
    updateTitle();
}

function updateTitle() {
    const active = queue.filter(j => j.status === 'pending' || j.status === 'uploading').length;
    const done = queue.filter(j => j.status === 'done').length;
    $('#uqTitle').text(active ? `Uploading ${active} of ${queue.length}…` : `Uploads: ${done} done` + (queue.some(j => j.status === 'error') ? ', some failed' : ''));
}

/** Resolve a drop event's DataTransfer to [{file, relDir}] (folders are traversed). Call synchronously from the handler. */
export function collectDropped(dt) {
    const entries = dt.items ? Array.from(dt.items).map(i => (i.kind === 'file' && i.webkitGetAsEntry ? i.webkitGetAsEntry() : null)) : [];
    if (!entries.some(e => e && e.isDirectory)) {
        return Promise.resolve(Array.from(dt.files).map(f => ({ file: f, relDir: '' })));
    }
    const readAll = reader => new Promise((resolve, reject) => {
        const all = [];
        const next = () => reader.readEntries(batch => (batch.length ? (all.push(...batch), next()) : resolve(all)), reject);
        next();
    });
    const walk = async entry => {
        if (entry.isFile) {
            const file = await new Promise((res, rej) => entry.file(res, rej));
            const rel = entry.fullPath.replace(/^\//, '').split('/').slice(0, -1).join('/');
            return [{ file, relDir: rel }];
        }
        const children = await readAll(entry.createReader());
        return (await Promise.all(children.map(walk))).flat();
    };
    return Promise.all(entries.filter(Boolean).map(walk)).then(r => r.flat());
}

// ───────────────────────── Multi-select ─────────────────────────
let anchorPath = null;

function treeItems() {
    return $('#fileList .tree-item').filter((_, el) => $(el).is(':visible'));
}
function rowOf(path) {
    return $('#fileList .tree-item').filter((_, el) => $(el).attr('data-path') === path).children('.tree-row').first();
}
function selectedRows() { return $('#fileList .tree-row.multi-selected'); }

/** Selected [{path,isDir}], dropping items that live inside another selected folder. */
export function selectedItems() {
    const all = selectedRows().map((_, r) => {
        const $i = $(r).parent();
        return { path: $i.attr('data-path'), isDir: $i.attr('data-is-dir') === 'true' };
    }).get();
    const dirs = all.filter(i => i.isDir).map(i => i.path.replace(/\/$/, '') + '/');
    return all.filter(i => !dirs.some(d => i.path.startsWith(d)));
}

export function clearSelection() {
    selectedRows().removeClass('multi-selected');
    anchorPath = null;
    updateBar();
}

function updateBar() {
    const n = selectedItems().length;
    $('#ftpSelectionBar').toggleClass('d-none', n === 0).toggleClass('d-flex', n > 0);
    $('#ftpSelectionCount').text(`${n} selected`);
}

function handleTreeClick(e) {
    const $item = $(e.target).closest('.tree-item');
    if (!$item.length) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        const path = $item.attr('data-path');
        if (e.shiftKey && anchorPath) {
            const items = treeItems().get();
            const a = items.findIndex(el => $(el).attr('data-path') === anchorPath);
            const b = items.findIndex(el => $(el).attr('data-path') === path);
            if (a > -1 && b > -1) {
                if (!(e.ctrlKey || e.metaKey)) selectedRows().removeClass('multi-selected');
                items.slice(Math.min(a, b), Math.max(a, b) + 1).forEach(el => $(el).children('.tree-row').first().addClass('multi-selected'));
            }
        } else {
            $item.children('.tree-row').first().toggleClass('multi-selected');
            anchorPath = path;
        }
        updateBar();
    } else if (selectedRows().length) {
        clearSelection();
    }
}

function runDownloadZip(items, $btn) {
    return withLoading($btn, (async () => {
        const r = await fetch('/api/download_zip', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) });
        if (!r.ok) {
            let msg = 'Download failed';
            try { msg = (await r.json()).error || msg; } catch (e) { /* not JSON */ }
            throw new Error(msg);
        }
        const blob = await r.blob();
        const m = /filename="([^"]+)"/.exec(r.headers.get('Content-Disposition') || '');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = m ? m[1] : 'download.zip';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    })(), { text: $btn.is('.btn-icon') ? '' : 'Zipping...' })
        .then(() => showToast('ZIP ready'))
        .catch(err => showToast(err.message, 'danger'));
}
export const downloadZip = (items, $btn = $()) => runDownloadZip(items, $btn);

function reportBulk(res, verb, total) {
    const failed = (res.errors || []).length;
    if (failed) showToast(`${verb} ${total - failed} of ${total}; ${failed} failed: ${res.errors[0].error}`, 'warning');
    else showToast(`${verb} ${total} item(s)`);
}

export function moveMany(paths, dest) {
    const $rows = paths.map(p => rowOf(p)[0]).filter(Boolean);
    const $targets = $($rows).add(cfg.folderTarget(dest));
    return withLoading($targets, api('move_many', { sources: paths, dest }))
        .then(res => {
            reportBulk(res, 'Moved', paths.length);
            const parents = new Set(paths.map(cfg.parentOf));
            parents.add(dest);
            parents.forEach(p => cfg.refreshFolder(p));
            cfg.closePaths(paths);
            clearSelection();
        })
        .catch(err => showToast(err.message, 'danger'));
}

function deleteSelected() {
    const items = selectedItems();
    if (!items.length) return;
    const $rows = items.map(i => rowOf(i.path)[0]).filter(Boolean);
    showConfirmModal(
        `Delete ${items.length} item(s)`,
        `Delete the ${items.length} selected item(s)? Folders are removed together with everything inside them.`,
        'Delete', 'btn-danger',
        () => withLoading($($rows), api('delete_many', { items }))
            .then(res => {
                reportBulk(res, 'Deleted', items.length);
                const failedPaths = new Set((res.errors || []).map(e => e.path));
                const gone = items.filter(i => !failedPaths.has(i.path)).map(i => i.path);
                cfg.closePaths(gone);
                new Set(items.map(i => cfg.parentOf(i.path))).forEach(p => cfg.refreshFolder(p));
                clearSelection();
            })
            .catch(err => showToast(err.message, 'danger'))
    );
}

function moveSelectedPrompt() {
    const items = selectedItems();
    if (!items.length) return;
    promptInput(`Move ${items.length} item(s) to folder (e.g. /backup):`, dest => {
        dest = '/' + dest.trim().replace(/^\/+|\/+$/g, '');
        return moveMany(items.map(i => i.path), dest);
    });
}

export function initMultiSelect() {
    const list = document.getElementById('fileList');
    if (!list) return;
    list.addEventListener('click', handleTreeClick, true); // capture: run before the row's own handlers
    $('#btnSelDownload').on('click', function() { runDownloadZip(selectedItems(), $(this)); });
    $('#btnSelDelete').on('click', deleteSelected);
    $('#btnSelMove').on('click', moveSelectedPrompt);
    $('#btnSelClear').on('click', clearSelection);
    $(document).on('keydown', e => { if (e.key === 'Escape' && selectedRows().length && !$('.modal.show').length) clearSelection(); });
}

/** For drag & drop: paths to move when `path` is dragged (the whole selection if it is part of it). */
export function dragPaths(path) {
    const sel = selectedItems().map(i => i.path);
    return sel.includes(path) ? sel : [path];
}

// ───────────────────────── Search ─────────────────────────
let searchSeq = 0;

function closeSearch() {
    searchSeq++;
    $('#ftpSearchInput').val('');
    $('#fileSearchResults').addClass('d-none').empty();
    $('#fileList').removeClass('d-none');
    $('#ftpSearchClear').addClass('d-none');
}

function runSearch(q) {
    const seq = ++searchSeq;
    const $res = $('#fileSearchResults').removeClass('d-none').html('<div class="tree-empty text-muted small ps-2 opacity-50">Searching…</div>');
    $('#fileList').addClass('d-none');
    $('#ftpSearchClear').removeClass('d-none');
    setLoading($res, true, { overlay: true });
    api('search', { dir: '/', query: q })
        .then(res => {
            if (seq !== searchSeq) return;
            $res.empty();
            if (!res.results.length) { $res.append('<div class="tree-empty text-muted small ps-2 opacity-50">No matches</div>'); return; }
            res.results.forEach(r => {
                const $row = $(`<div class="tree-row d-flex align-items-center search-hit" style="cursor:pointer;">
                    <i class="bi ${r.isDir ? 'bi-folder2 text-warning' : 'bi-file-earmark text-secondary'} me-2"></i>
                    <div class="text-truncate"><div class="item-name text-truncate"></div><div class="text-muted text-truncate" style="font-size:.7rem;"></div></div></div>`);
                $row.find('.item-name').text(r.name);
                $row.find('.text-muted').text(r.path);
                $row.attr('title', r.path).on('click', () => {
                    if (r.isDir) { closeSearch(); cfg.reveal(r.path); }
                    else { cfg.openFile(r.path, r.name); }
                });
                $res.append($row);
            });
            if (res.truncated) $res.append('<div class="tree-empty text-warning small ps-2">Showing the first results only — refine your search</div>');
        })
        .catch(err => { if (seq === searchSeq) $res.html(`<div class="tree-empty text-danger small ps-2">${esc(err.message)}</div>`); })
        .finally(() => setLoading($res, false));
}

export function initSearch() {
    let timer = null;
    $('#ftpSearchInput').on('input', function() {
        clearTimeout(timer);
        const q = $(this).val().trim();
        if (!q) { closeSearch(); return; }
        timer = setTimeout(() => runSearch(q), 400);
    }).on('keydown', function(e) {
        if (e.key === 'Escape') closeSearch();
        if (e.key === 'Enter') { clearTimeout(timer); const q = $(this).val().trim(); if (q) runSearch(q); }
    });
    $('#ftpSearchClear').on('click', closeSearch);
}
export function resetFileTools() { closeSearch(); clearSelection(); }
