/**
 * Global Confirmation Service
 * Singleton manager allowing imperative `confirmModal(...)` calls anywhere in the application.
 */

let confirmSubscriber = null;

export function registerConfirmSubscriber(subscriber) {
    confirmSubscriber = subscriber;
    return () => {
        if (confirmSubscriber === subscriber) {
            confirmSubscriber = null;
        }
    };
}

/**
 * Trigger global confirmation modal
 *
 * @param {Object} options
 * @param {string} options.title - Modal title (e.g. "Delete Product?")
 * @param {string|React.ReactNode} options.message - Contextual details
 * @param {('delete'|'permanent_delete'|'warning'|'info'|'success'|'error'|'logout'|'archive'|'restore'|'publish'|'unpublish')} [options.variant='warning'] - Variant layout style & icons
 * @param {string} [options.confirmText] - Label for primary button
 * @param {string} [options.cancelText='Cancel'] - Label for cancel button
 * @param {function} [options.onConfirm] - Optional async callback to run when confirmed
 * @returns {Promise<boolean>} Resolves true if confirmed, false if cancelled
 */
export function confirmModal(options = {}) {
    return new Promise((resolve) => {
        if (confirmSubscriber) {
            confirmSubscriber({
                ...options,
                resolve,
            });
        } else {
            console.warn('GlobalConfirmContainer is not mounted. Fallback auto-confirm.');
            resolve(true);
        }
    });
}
