/**
 * Shortcuts Module - Handles quick access buttons and custom shortcuts
 * Uses formalized EditMode state
 */

import Storage from './storage.js';
import { modalStack } from './modal-stack.js';
import { getQuickAccessSites, getDefaultCustomShortcuts, getKeyboardShortcuts } from './config.js';
import { quickAccessIcons, actionIcons } from './icons.js';

const EditMode = {
    IDLE: 'idle',
    CREATE: 'create',
    EDIT: 'edit'
};

const Shortcuts = {
    quickAccessItems: [],
    customShortcuts: [],
    editMode: EditMode.IDLE,
    editIndex: null,

    // Initialize shortcuts
    async init() {
        const settings = await Storage.get(['customShortcuts', 'quickAccess']);
        this.customShortcuts = settings.customShortcuts || [...getDefaultCustomShortcuts()];
        this.quickAccessItems = settings.quickAccess || [...getQuickAccessSites()];

        this.renderQuickAccess();
        this.renderCustomShortcuts();

        // Listen for changes
        Storage.on('customShortcuts', (newValue) => {
            this.customShortcuts = newValue || [];
            this.renderCustomShortcuts();
        });
        Storage.on('quickAccess', (newValue) => {
            this.quickAccessItems = newValue || [];
            this.renderQuickAccess();
        });

        // Keyboard shortcut for adding shortcut
        const shortcuts = getKeyboardShortcuts();
        document.addEventListener('keydown', (e) => {
            if (e.key === shortcuts.addShortcut && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const active = document.activeElement;
                if (active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA' && !active.isContentEditable) {
                    e.preventDefault();
                    this.enterCreateMode();
                }
            }
        });

        return this;
    },

    // Formalized edit mode transitions
    enterCreateMode() {
        this.editMode = EditMode.CREATE;
        this.editIndex = null;
        this.prepareEditDialog();
        modalStack.push('shortcutDialog', { focusSelector: '#siteName' });
    },

    enterEditMode(index) {
        this.editMode = EditMode.EDIT;
        this.editIndex = index;
        this.prepareEditDialog(index);
        modalStack.push('shortcutDialog', { focusSelector: '#siteName' });
    },

    exitEditMode() {
        this.editMode = EditMode.IDLE;
        this.editIndex = null;
    },

    // Render quick access buttons
    renderQuickAccess() {
        const grid = document.getElementById('quickAccessGrid');
        if (!grid) return;

        grid.innerHTML = this.quickAccessItems.map(item => `
            <a href="${item.url}" class="quick-access-btn" target="_blank" rel="noopener noreferrer" data-id="${item.id}" title="${item.name}">
                <div class="quick-access-icon" style="background: ${item.color};">
                    ${quickAccessIcons[item.icon] || this.getFavicon(item.url)}
                </div>
                <span class="quick-access-label">${item.name}</span>
            </a>
        `).join('');
    },

    // Render custom shortcuts
    renderCustomShortcuts() {
        const grid = document.getElementById('shortcutGrid');
        if (!grid) return;

        if (this.customShortcuts.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    ${actionIcons.emptyShortcut}
                    <p class="empty-state-title">No shortcuts yet</p>
                    <p class="empty-state-desc">Click the + button to add your first shortcut</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.customShortcuts.map((shortcut, index) => `
            <a href="${shortcut.url}" class="shortcut-card" target="_blank" rel="noopener noreferrer" data-index="${index}">
                <div class="shortcut-icon" style="background: ${this.getDomainColor(shortcut.url)};">
                    ${this.getFavicon(shortcut.url)}
                </div>
                <span class="shortcut-name">${shortcut.name}</span>
                <div class="shortcut-actions">
                    <button class="shortcut-action-btn edit" data-index="${index}" aria-label="Edit shortcut">
                        ${actionIcons.edit}
                    </button>
                    <button class="shortcut-action-btn delete" data-index="${index}" aria-label="Delete shortcut">
                        ${actionIcons.delete}
                    </button>
                </div>
            </a>
        `).join('');

        // Add event listeners for edit/delete
        grid.querySelectorAll('.shortcut-action-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                this.enterEditMode(index);
            });
        });

        grid.querySelectorAll('.shortcut-action-btn.delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                await this.deleteShortcut(index);
            });
        });
    },

    // Get favicon for URL
    getFavicon(url) {
        try {
            const domain = new URL(url).hostname.replace('www.', '');
            return `<img src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" alt="" style="width: 22px; height: 22px; border-radius: 6px;">`;
        } catch {
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><rect x="2" y="2" width="20" height="20" rx="2"></rect></svg>`;
        }
    },

    // Get domain color (simple hash-based)
    getDomainColor(url) {
        try {
            const domain = new URL(url).hostname;
            let hash = 0;
            for (let i = 0; i < domain.length; i++) {
                hash = domain.charCodeAt(i) + ((hash << 5) - hash);
            }
            const hue = Math.abs(hash) % 360;
            return `hsl(${hue}, 65%, 45%)`;
        } catch {
            return '#6366f1';
        }
    },

    // Prepare add/edit dialog fields without opening the dialog.
    prepareEditDialog(index = null) {
        const title = document.getElementById('dialogTitle');
        const nameInput = document.getElementById('siteName');
        const urlInput = document.getElementById('siteUrl');
        const editIndexInput = document.getElementById('shortcutEditIndex');

        if (index !== null && this.customShortcuts[index]) {
            const shortcut = this.customShortcuts[index];
            title.textContent = 'Edit shortcut';
            nameInput.value = shortcut.name;
            urlInput.value = shortcut.url;
            editIndexInput.value = index;
        } else {
            title.textContent = 'Add a website';
            nameInput.value = '';
            urlInput.value = '';
            editIndexInput.value = '';
        }
    },

    // Open add/edit dialog
    openEditDialog(index = null) {
        const dialog = document.getElementById('shortcutDialog');
        const nameInput = document.getElementById('siteName');
        this.prepareEditDialog(index);
        dialog.showModal();
        nameInput.focus();
    },

    // Save shortcut
    async saveShortcut(name, url, editIndex = null) {
        // Ensure URL has protocol
        if (!url.match(/^https?:\/\//)) {
            url = 'https://' + url;
        }

        const shortcut = { name, url };

        if (editIndex !== null && editIndex !== '') {
            this.customShortcuts[editIndex] = shortcut;
        } else {
            this.customShortcuts.push(shortcut);
        }

        await Storage.setValue('customShortcuts', this.customShortcuts);
        this.exitEditMode();
        this.renderCustomShortcuts();
    },

    // Delete shortcut
    async deleteShortcut(index) {
        this.customShortcuts.splice(index, 1);
        await Storage.setValue('customShortcuts', this.customShortcuts);
        this.renderCustomShortcuts();
    },

    // Restore defaults
    async restoreDefaults() {
        this.customShortcuts = [...getDefaultCustomShortcuts()];
        await Storage.setValue('customShortcuts', this.customShortcuts);
        this.renderCustomShortcuts();
    },

    // Get current edit mode state
    getEditMode() {
        return {
            mode: this.editMode,
            index: this.editIndex
        };
    },

    // Get all shortcuts
    getShortcuts() {
        return this.customShortcuts;
    }
};

export { EditMode };
export default Shortcuts;