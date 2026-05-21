import { state } from './modules/state.js';
import { getParentPath } from './modules/helpers.js';
import { promptInput, showToast, showConfirmModal } from './modules/ui.js';
import { loadSessions, saveSession, exportSessions, handleImportFile, doExportWithPassword, doImportWithPassword } from './modules/sessions.js';
import { expandAndRefreshFolder, createNewFile, createNewFolder } from './modules/ftp.js';
import { initMonacoEditor, saveCurrentFile, closeTab } from './modules/editor.js';
import { initContextMenu } from './modules/context-menu.js';
import { runCustomQuery } from './modules/db.js';

$(document).ready(function() {
    loadSessions();
    initMonacoEditor();
    initContextMenu();

    $('#btnSaveSession').click(saveSession);
    $('#btnExportSessions').click(exportSessions);
    $('#btnImportSessions').click(() => $('#importFileInput').trigger('click'));
    $('#importFileInput').change(handleImportFile);

    $('#btnConfirmExport').click(doExportWithPassword);
    $('#btnToggleExportPassword').click(function() {
        const inp = $('#exportPasswordInput');
        const isPass = inp.attr('type') === 'password';
        inp.attr('type', isPass ? 'text' : 'password');
        $(this).find('i').toggleClass('bi-eye bi-eye-slash');
    });
    $('#exportPasswordModal').on('shown.bs.modal', () => { $('#exportPasswordInput').val('').trigger('focus'); });

    $('#btnConfirmImport').click(doImportWithPassword);
    $('#btnToggleImportPassword').click(function() {
        const
                                        <p class="text-muted small mb-0">${plugin.description || 'No description provided.'}</p>
                                        <span class="text-muted small" style="font-size:0.75rem;">By ${plugin.author || 'Unknown'}</span>
                                    </div>
                                </div>
                                <button class="btn btn-sm btn-icon btn-outline-danger btn-delete-plugin" data-slug="${plugin.slug}" title="Delete Plugin">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        `;
                        $list.append(pluginCard);
                    });
                } else {
                    $list.html(`<div class="alert alert-danger">${res.error || 'Failed to load plugins.'}</div>`);
                }
            },
            error: function(xhr) {
                const err = xhr.responseJSON ? xhr.responseJSON.error : 'Network error';
                $list.html(`<div class="alert alert-danger">${err}</div>`);
            }
        });
    }

    $(window).bind('keydown', function(event) {
        if (event.ctrlKey || event.metaKey) {
            switch (String.fromCharCode(event.which).toLowerCase()) {
                case 's':
                    event.preventDefault();
                    if (state.currentProtocol === 'ftp') {
                        saveCurrentFile();
                    }
                    break;
            }
        }
    });
});
