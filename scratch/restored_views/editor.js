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
    const map 
                        path: path,
                        name: name,
                        model: model,
                        isLoading: false
                    };

                    renderTabs();
                    switchTab(path);
                }
            } else {
                closeTab(path);
                showToast(res.error, 'danger');
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
        url: 'api/write_file',
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
                showToast('Failed to save file: ' + res.error, 'danger');
            }
        },
        complete: function() {
            btn.html(originalHtml);
            btn.prop('disabled', false);
        }
    });
}

        draggedIndex = $(this).index();
        $(this).addClass('dragging');
        e.originalEvent.dataTransfer.effectAllowed = 'move';
        e.originalEvent.dataTransfer.setData('text/plain', draggedIndex);
    });

    $('.editor-tab').on('dragend', function() {
        $('.editor-tab').removeClass('dragging over-left over-right');
    });

    $('.editor-tab').on('dragover', function(e) {
        e.preventDefault();
        return false;
    });

    $('.editor-tab').on('dragenter', function(e) {
        const targetIndex = $(this).index();
        if (targetIndex === draggedIndex) return;

        $('.editor-tab').removeClass('over-left over-right');
        if (targetIndex < draggedIndex) {
            $(this).addClass('over-left');
        } else {
            $(this).addClass('over-right');
        }
    });

    $('.editor-tab').on('dragleave', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.originalEvent.clientX;
        const y = e.originalEvent.clientY;
        if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
            $(this).removeClass('over-left over-right');
        }
    });

    $('.editor-tab').on('drop', function(e) {
        e.preventDefault();
        const targetIndex = $(this).index();
        if (draggedIndex !== null && targetIndex !== draggedIndex) {
            const draggedTab = state.openTabs.splice(draggedIndex, 1)[0];
            state.openTabs.splice(targetIndex, 0, draggedTab);
            renderTabs();
            $(`.editor-tab[data-path="${CSS.escape(state.currentOpenedFile)}"]`).addClass('active');
       











        if (tabEl) {
            tabEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
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

    const loadingTab = {
        path: path,
        name: name,
        isLoading: true
    };
    state.openTabs.unshift(loadingTab);
    renderTabs();
    switchTab(path);

    $.ajax({
        url: 'api/read_file',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ file: path }),
        success: function(res) {
            if (res.success) {
                const idx = state.openTabs.findIndex(t => t.path === path);
                if (idx > -1) {
                    const lang = getLanguageFromExtension(name);
                    const model = monaco.editor.createModel(res.content, lang);

                    state.openTabs[idx] = {
                        path: path,
                        name: name,
                        model: model,
                        isLoading: false
                    };

                    renderTabs();
                    switchTab(path);
                }
            } else {
                closeTab(path);
                showToast(res.error, 'danger');
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
        url: 'api/write_file',
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
                showToast('Failed to save file: ' + res.error, 'danger');
            }
        },
        complete: function() {
            btn.html(originalHtml);
            btn.prop('disabled', false);
        }
    });
}
