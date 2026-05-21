import { state } from './state.js';
import { showToast } from './ui.js';
export function initMonacoEditor() {
    require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
    require(['vs/editor/editor.main'], function() {
        state.editor = monaco.editor.create(document.getElementById('monaco-container'), {
            value: '',
            language: 'plaintext',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            fontFamily: 'Consolas, "Courier New", monospace',
            fontSize: 14,
            padding: { top: 16 }
        });
        state.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, function() {
            saveCurrentFile();
        });
    });
}
export function getLanguageFromExtension(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const map = {
        'js': 'javascript', 'json': 'json', 'ts': 'typescript',
        'html': 'html', 'css': 'css', 'scss': 'scss', 'less': 'less',
        'php': 'php', 'py': 'python', 'java': 'java', 'c': 'c', 'cpp': 'cpp',
        'cs': 'csharp', 'go': 'go', 'rs': 'rust', 'rb': 'ruby', 'sh': 'shell',
        'xml': 'xml', 'yaml': 'yaml', 'yml': 'yaml', 'md': 'markdown', 'sql': 'sql'
    };
    return map[ext] || 'plaintext';
}
export function getFileIconClass(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const map = {
        'js': 'bi-filetype-js', 'json': 'bi-filetype-json', 'ts': 'bi-filetype-tsx',
        'html': 'bi-filetype-html', 'css': 'bi-filetype-css', 'scss': 'bi-filetype-scss',
        'php': 'bi-filetype-php', 'py': 'bi-filetype-py', 'rb': 'bi-gem',
        'md': 'bi-filetype-md', 'txt': 'bi-file-text', 'xml': 'bi-filetype-xml',
        'sql': 'bi-filetype-sql', 'sh': 'bi-terminal', 'yml': 'bi-file-code',
        'yaml': 'bi-file-code', 'go': 'bi-filetype-go', 'rs': 'bi-file-code',
        'java': 'bi-filetype-java', 'c': 'bi-file-code', 'cpp': 'bi-file-code',
        'png': 'bi-file-image', 'jpg': 'bi-file-image', 'jpeg': 'bi-file-image',
        'gif': 'bi-file-image', 'svg': 'bi-filetype-svg', 'ico': 'bi-file-image',
        'zip': 'bi-file-zip', 'tar': 'bi-file-zip', 'gz': 'bi-file-zip',
        'pdf': 'bi-file-pdf', 'lock': 'bi-lock'
    };
    return map[ext] || 'bi-file-earmark';
}
export function renderTabs() {
    const $tabs = $('#editorTabs');
    $tabs.empty();
    if (state.openTabs.length === 0) {
        $('.editor-tabs-container').addClass('d-none');
        return;
    }
    $('.editor-tabs-container').removeClass('d-none');
    let draggedIndex = null;
    state.openTabs.forEach((tab, index) => {
        const isActive = tab.path === state.currentOpenedFile;
        const iconClass = getFileIconClass(tab.name);
        const $tab = $(`
            <div class="editor-tab d-flex align-items-center ${isActive ? 'active' : ''}" data-path="${tab.path}" draggable="true">
                <i class="bi ${iconClass} me-2" style="font-size:0.85rem;"></i>
                <span class="tab-name text-truncate">${tab.name}</span>
                ${tab.isLoading ? '<span class="spinner-border spinner-border-sm ms-2" style="width:.7rem;height:.7rem;"></span>' : '<button class="btn-close-tab ms-2" title="Close"><i class="bi bi-x"></i></button>'}
            </div>
        `);
        $tab.click(function(e) {
            if (!$(e.target).closest('.btn-close-tab').length) {
                switchTab(tab.path);
            }
        });
        $tab.find('.btn-close-tab').click(function(e) {
            e.stopPropagation();
            closeTab(tab.path);
        });
        $tab.on('dragstart', function(e) {
            draggedIndex = index;
            $(this).addClass('dragging');
            e.originalEvent.dataTransfer.effectAllowed = 'move';
        });
        $tab.on('dragend', function() {
            $('.editor-tab').removeClass('dragging over-left over-right');
        });
        $tab.on('dragover', function(e) { e.preventDefault(); return false; });
        $tab.on('dragenter', function() {
            if ($(this).index() !== draggedIndex) {
                $('.editor-tab').removeClass('over-left over-right');
                $(this).index() < draggedIndex ? $(this).addClass('over-left') : $(this).addClass('over-right');
            }
        });
        $tab.on('dragleave', function(e) {
            const r = this.getBoundingClientRect();
            if (e.originalEvent.clientX < r.left || e.originalEvent.clientX >= r.right || e.originalEvent.clientY < r.top || e.originalEvent.clientY >= r.bottom) {
                $(this).removeClass('over-left over-right');
            }
        });
        $tab.on('drop', function(e) {
            e.preventDefault();
            const targetIndex = $(this).index();
            if (draggedIndex !== null && targetIndex !== draggedIndex) {
                const dragged = state.openTabs.splice(draggedIndex, 1)[0];
                state.openTabs.splice(targetIndex, 0, dragged);
                renderTabs();
                $(`.editor-tab[data-path="${CSS.escape(state.currentOpenedFile)}"]`).addClass('active');
            }
        });
        $tabs.append($tab);
    });
    const activeEl = $tabs.find(`.editor-tab.active`)[0];
    if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
}
export function switchTab(path) {
    state.currentOpenedFile = path;
    $('.editor-tab').removeClass('active');
    if (path) {
        $(`.editor-tab[data-path="${path}"]`).addClass('active');
    }
    const tab = state.openTabs.find(t => t.path === path);
    if (tab) {
        if (tab.isLoading) {
            $('#editorPlaceholder').removeClass('d-none').html(`
                <div class="spinner-border text-primary mb-3" role="status"></div>
                <span>Loading ${tab.name}...</span>
            `);
            $('#floatingActionPanel').addClass('d-none');
        } else {
            $('#editorPlaceholder').addClass('d-none');
            $('#floatingActionPanel').removeClass('d-none');
            if (state.editor && tab.model) {
                state.editor.setModel(tab.model);
            }
        }
    } else {
        state.currentOpenedFile = null;
        $('#editorPlaceholder').removeClass('d-none').html(`
            <i class="bi bi-file-earmark-code mb-3 opacity-25" style="font-size: 4rem;"></i>
            <span class="opacity-50">Select a file to start editing</span>
        `);
        $('#floatingActionPanel').addClass('d-none');
        if (state.editor) {
            state.editor.setModel(null);
        }
    }
}
export function closeTab(path) {
    const index = state.openTabs.findIndex(t => t.path === path);
    if (index === -1) return;
    const tab = state.openTabs[index];
    if (tab.model) {
        tab.model.dispose();
    }
    state.openTabs.splice(index, 1);
    renderTabs();
    if (state.currentOpenedFile === path) {
        if (state.openTabs.length > 0) {
            const newIndex = Math.min(index, state.openTabs.length - 1);
            switchTab(state.openTabs[newIndex].path);
        } else {
            switchTab(null);
        }
    }
}
export function openFile(path, name) {
    const existingIndex = state.openTabs.findIndex(t => t.path === path);
    if (existingIndex > -1) {
        switchTab(path);
        return;
    }
    if (state.openTabs.some(t => t.path === path && t.isLoading)) {
        return;
    }
    const loadingTab = { path: path, name: name, isLoading: true };
    state.openTabs.unshift(loadingTab);
    renderTabs();
    switchTab(path);
    $.ajax({
        url: 'api.php?action=ftp_read_file',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ file: path }),
        success: function(res) {
            if (res.success) {
                const idx = state.openTabs.findIndex(t => t.path === path);
                if (idx > -1) {
                    const lang = getLanguageFromExtension(name);
                    const model = monaco.editor.createModel(res.content, lang);
                    state.openTabs[idx] = { path: path, name: name, model: model, isLoading: false };
                    renderTabs();
                    switchTab(path);
                }
            } else {
                closeTab(path);
                showToast(res.error || 'Failed to load file', 'danger');
            }
        },
        error: function() {
            closeTab(path);
            showToast('Failed to load file', 'danger');
        }
    });
}
export function saveCurrentFile(callback) {
    if (!state.currentOpenedFile || !state.editor) return;
    const activeTab = state.openTabs.find(t => t.path === state.currentOpenedFile);
    if (!activeTab || !activeTab.model) return;
    const content = activeTab.model.getValue();
    const btn = $('#btnSaveFile');
    const originalHtml = btn.html();
    btn.html('<i class="bi bi-arrow-repeat spin me-2"></i>Saving...');
    btn.prop('disabled', true);
    $.ajax({
        url: 'api.php?action=ftp_write_file',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ file: state.currentOpenedFile, content: content }),
        success: function(res) {
            if (res.success) {
                showToast('File saved successfully');
                if (typeof callback === 'function') {
                    callback();
                }
            } else {
                showToast('Failed to save file: ' + (res.error || ''), 'danger');
            }
        },
        complete: function() {
            btn.html(originalHtml);
            btn.prop('disabled', false);
        }
    });
}