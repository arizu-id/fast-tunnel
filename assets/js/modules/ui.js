import { finishModalAction } from './loading.js';
let inputCallback = null;
let confirmCallback = null;
export function showToast(message, type = 'success') {
    const icons = { success: 'bi-check-circle-fill', danger: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill', warning: 'bi-exclamation-triangle-fill' };
    const toastHtml = `
        <div class="custom-toast toast-${type}">
            <div class="toast-content">
                <i class="bi ${icons[type] || icons.success} toast-icon"></i>
                <span class="toast-msg fw-medium">${message}</span>
            </div>
            <div class="toast-progress-bar"></div>
        </div>
    `;
    const $toast = $(toastHtml).prependTo('.toast-container');
    $toast[0].offsetHeight;
    $toast.addClass('show');
    setTimeout(() => {
        $toast.addClass('closing').removeClass('show');
        setTimeout(() => $toast.remove(), 400);
    }, 3000);
}
export function promptInput(title, callback) {
    $('#inputModalTitle').text(title);
    $('#inputModalValue').val('');
    inputCallback = callback;
    const modal = new bootstrap.Modal(document.getElementById('inputModal'));
    modal.show();
    $('#inputModal').on('shown.bs.modal', function () {
        $('#inputModalValue').trigger('focus');
    });
}
export function showConfirmModal(title, message, btnText, btnClass, callback) {
    $('#confirmModalTitle').text(title);
    $('#confirmModalMessage').text(message);
    const $btn = $('#btnConfirmModalExecute');
    $btn.text(btnText || 'Confirm');
    $btn.removeClass('btn-danger btn-primary btn-success btn-warning btn-info btn-secondary btn-dark')
        .addClass(btnClass || 'btn-danger');
    confirmCallback = callback;
    const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
    modal.show();
}
$(document).ready(function() {
    $('#btnInputModalConfirm').click(function() {
        const val = $('#inputModalValue').val();
        let result = null;
        if (val && inputCallback) {
            result = inputCallback(val);
        }
        finishModalAction('inputModal', $(this), result);
    });
    $('#btnConfirmModalExecute').click(function() {
        const result = confirmCallback ? confirmCallback() : null;
        finishModalAction('confirmModal', $(this), result);
    });
});