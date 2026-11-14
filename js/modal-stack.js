/**
 * ModalStack - Centralized dialog/modal stack management
 * Replaces ad-hoc dialog handling in settings.js
 */

export class ModalStack {
    constructor() {
        this.stack = [];
        this.boundHandleKeydown = this.handleKeydown.bind(this);
        document.addEventListener('keydown', this.boundHandleKeydown);
    }

    /**
     * Open a dialog and push to stack
     * @param {string} dialogId - ID of the dialog element
     * @param {Object} options - { onClose?, focusSelector? }
     */
    push(dialogId, options = {}) {
        const dialog = document.getElementById(dialogId);
        if (!dialog) {
            console.warn(`ModalStack: dialog not found: ${dialogId}`);
            return;
        }

        // If already in stack, bring to top
        const existingIndex = this.stack.findIndex(item => item.dialog === dialog);
        if (existingIndex !== -1) {
            this.stack.splice(existingIndex, 1);
        }

        // Show dialog
        dialog.showModal();

        // Focus first focusable element
        const focusSelector = options.focusSelector || 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const focusable = dialog.querySelector(focusSelector);
        focusable?.focus();

        // Track in stack
        this.stack.push({
            dialog,
            id: dialogId,
            onClose: options.onClose,
            previousActiveElement: document.activeElement
        });

        // Setup backdrop click to close
        dialog.addEventListener('click', this.handleBackdropClick.bind(this, dialog), { once: true });
    }

    /**
     * Close the topmost dialog
     */
    pop() {
        const item = this.stack.pop();
        if (!item) return;

        item.dialog.close();
        item.onClose?.();

        // Restore focus to trigger if needed
        if (item.previousActiveElement && document.body.contains(item.previousActiveElement)) {
            item.previousActiveElement.focus();
        }
    }

    /**
     * Close a specific dialog by ID
     */
    close(dialogId) {
        const index = this.stack.findIndex(item => item.id === dialogId);
        if (index === -1) return;

        const item = this.stack.splice(index, 1)[0];
        item.dialog.close();
        item.onClose?.();
    }

    /**
     * Close all dialogs
     */
    closeAll() {
        while (this.stack.length) {
            this.pop();
        }
    }

    /**
     * Get current top dialog
     */
    top() {
        return this.stack[this.stack.length - 1] || null;
    }

    /**
     * Check if a dialog is open
     */
    isOpen(dialogId) {
        return this.stack.some(item => item.id === dialogId);
    }

    /**
     * Get stack depth
     */
    get depth() {
        return this.stack.length;
    }

    handleBackdropClick(dialog, e) {
        if (e.target === dialog) {
            this.close(dialog.id);
        }
    }

    handleKeydown(e) {
        if (e.key === 'Escape' && this.stack.length > 0) {
            e.preventDefault();
            this.pop(); // Close only topmost
        }
    }

    destroy() {
        document.removeEventListener('keydown', this.boundHandleKeydown);
        this.closeAll();
    }
}

// Singleton instance
export const modalStack = new ModalStack();

export default ModalStack;