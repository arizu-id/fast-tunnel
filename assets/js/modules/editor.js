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