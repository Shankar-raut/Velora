/**
 * CommandPalette - Configurable global keyboard shortcuts
 * Replaces hardcoded '/' binding in search.js
 */

export class CommandPalette {
    constructor() {
        this.commands = new Map();
        this.boundHandleKeydown = this.handleKeydown.bind(this);
        this.enabled = true;
        document.addEventListener('keydown', this.boundHandleKeydown);
    }

    /**
     * Register a command
     * @param {Object} command - { key, description, handler, condition? }
     */
    register({ key, description, handler, condition }) {
        const normalizedKey = key.toLowerCase();
        this.commands.set(normalizedKey, { key: normalizedKey, description, handler, condition });
    }

    /**
     * Unregister a command
     */
    unregister(key) {
        this.commands.delete(key.toLowerCase());
    }

    /**
     * Enable/disable all commands
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    handleKeydown(e) {
        if (!this.enabled) return;

        // Don't trigger if typing in an input
        const target = e.target;
        const isTyping = target.tagName === 'INPUT' ||
                         target.tagName === 'TEXTAREA' ||
                         target.isContentEditable;

        const key = e.key.toLowerCase();
        const command = this.commands.get(key);

        if (!command) return;

        // Check condition
        if (command.condition && !command.condition(e, isTyping)) return;

        e.preventDefault();
        command.handler(e);
    }

    /**
     * Get all registered commands (for help UI)
     */
    getCommands() {
        return Array.from(this.commands.values()).map(c => ({
            key: c.key,
            description: c.description
        }));
    }

    destroy() {
        document.removeEventListener('keydown', this.boundHandleKeydown);
        this.commands.clear();
    }
}

// Singleton instance
export const commandPalette = new CommandPalette();

export default CommandPalette;