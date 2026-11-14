/**
 * Settings Module - Handles settings dialog, tabs, and category management
 * Uses ModalStack for dialog management
 */

import Storage from './storage.js';
import { modalStack } from './modal-stack.js';
import { getWallpaperCategories, getWallpaperPhotos, getRotationIntervals, getSearchEngine, getThemeMode, getTheme } from './config.js';

const Settings = {
    activeTab: 'appearance',

    // Initialize settings
    async init() {
        this.setupTabs();
        await this.setupCategoryToggles();
        this.setupFormHandlers();
        this.setupOpenHandler();

        // Listen for storage changes to update UI
        Storage.onAny((newValue, oldValue, key) => {
            this.updateUIFromStorage(key, newValue);
        });

        return this;
    },

    // Setup tab navigation
    setupTabs() {
        const nav = document.getElementById('settingsNav');
        const tabs = nav?.querySelectorAll('.settings-tab');
        const panels = document.querySelectorAll('.settings-panel');

        tabs?.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;

                // Update tab active state
                tabs.forEach(t => {
                    t.classList.remove('active');
                    t.setAttribute('aria-selected', 'false');
                });
                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');

                // Update panel visibility
                panels.forEach(panel => {
                    panel.classList.remove('active');
                    panel.hidden = true;
                });
                const activePanel = document.getElementById(`panel-${tabName}`);
                if (activePanel) {
                    activePanel.classList.add('active');
                    activePanel.hidden = false;
                }

                this.activeTab = tabName;
            });

            // Keyboard navigation
            tab.addEventListener('keydown', (e) => {
                const tabsArray = Array.from(tabs);
                const currentIndex = tabsArray.indexOf(tab);

                if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    const nextIndex = (currentIndex + 1) % tabsArray.length;
                    tabsArray[nextIndex].focus();
                    tabsArray[nextIndex].click();
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const prevIndex = (currentIndex - 1 + tabsArray.length) % tabsArray.length;
                    tabsArray[prevIndex].focus();
                    tabsArray[prevIndex].click();
                }
            });
        });
    },

    // Setup category toggles in appearance panel
    async setupCategoryToggles() {
        const container = document.getElementById('categoryToggles');
        if (!container) return;

        const settings = await Storage.get(['wallpaperCategories']);
        const categories = settings.wallpaperCategories || getWallpaperCategories();
        const allCategories = getWallpaperCategories();

        container.innerHTML = allCategories.map(cat => `
            <label class="category-toggle">
                <input type="checkbox" value="${cat}" ${categories.includes(cat) ? 'checked' : ''}>
                <span>${this.capitalize(cat)}</span>
                <span class="toggle-slider"></span>
            </label>
        `).join('');

        // Add event listeners
        container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', async () => {
                const selected = Array.from(container.querySelectorAll('input:checked')).map(cb => cb.value);
                await Storage.setValue('wallpaperCategories', selected);
            });
        });
    },

    // Setup form handlers
    setupFormHandlers() {
        // Shortcut form
        const shortcutForm = document.getElementById('shortcutForm');
        shortcutForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('siteName').value.trim();
            const url = document.getElementById('siteUrl').value.trim();
            const editIndex = document.getElementById('shortcutEditIndex').value;

            if (name && url) {
                const { default: Shortcuts } = await import('./shortcuts.js');
                await Shortcuts.saveShortcut(name, url, editIndex ? parseInt(editIndex) : null);
                modalStack.close('shortcutDialog');
            }
        });

        // Cancel button
        document.getElementById('cancelBtn')?.addEventListener('click', () => {
            modalStack.close('shortcutDialog');
        });

        // Restore defaults
        document.getElementById('restoreDefaultsBtn')?.addEventListener('click', async () => {
            const { default: Shortcuts } = await import('./shortcuts.js');
            await Shortcuts.restoreDefaults();
        });

        // Clear cache
        document.getElementById('clearCacheBtn')?.addEventListener('click', async () => {
            const { default: Wallpaper } = await import('./wallpaper.js');
            await Wallpaper.clearCache();
            this.showToast('Wallpaper cache cleared', 'success');
        });

        // Reset settings
        document.getElementById('resetSettingsBtn')?.addEventListener('click', async () => {
            if (confirm('Reset all settings to defaults? This cannot be undone.')) {
                await Storage.clear();
                await Storage.init();
                location.reload();
            }
        });

        // Theme mode select
        const themeModeSelect = document.getElementById('themeMode');
        themeModeSelect?.addEventListener('change', async (e) => {
            await Storage.setValue('themeMode', e.target.value);
        });

        // Default engine select
        const defaultEngineSelect = document.getElementById('defaultEngine');
        defaultEngineSelect?.addEventListener('change', async (e) => {
            await Storage.setValue('searchEngine', e.target.value);
        });

        // Rotation interval select
        const rotationIntervalSelect = document.getElementById('rotationInterval');
        rotationIntervalSelect?.addEventListener('change', async (e) => {
            await Storage.setValue('rotationInterval', e.target.value);
        });

        // Toggle checkboxes
        const toggleIds = ['showClock', 'use24Hour', 'reducedMotion'];
        toggleIds.forEach(id => {
            const checkbox = document.getElementById(id);
            checkbox?.addEventListener('change', async (e) => {
                await Storage.setValue(id, e.target.checked);
            });
        });
    },

    // Setup open handler (from top bar)
    setupOpenHandler() {
        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            this.openSettingsDialog();
        });

        document.getElementById('settingsCloseBtn')?.addEventListener('click', () => {
            modalStack.close('settingsDialog');
        });

        document.getElementById('addShortcutBtn')?.addEventListener('click', () => {
            this.openShortcutDialog();
        });
    },

    // Open settings dialog via ModalStack
    openSettingsDialog() {
        modalStack.push('settingsDialog', {
            focusSelector: '.settings-tab, button, input, select'
        });
    },

    // Open shortcut dialog via ModalStack
    async openShortcutDialog(index = null) {
        const { default: Shortcuts } = await import('./shortcuts.js');
        Shortcuts.editMode = index === null ? 'create' : 'edit';
        Shortcuts.editIndex = index;
        Shortcuts.prepareEditDialog(index);
        modalStack.push('shortcutDialog', {
            focusSelector: '#siteName'
        });
    },

    // Close dialog via ModalStack
    closeDialog(id) {
        modalStack.close(id);
    },

    // Update UI from storage changes
    updateUIFromStorage(key, newValue) {
        switch (key) {
            case 'showClock':
            case 'use24Hour':
            case 'reducedMotion': {
                const checkbox = document.getElementById(key);
                if (checkbox) checkbox.checked = newValue;
                break;
            }
            case 'themeMode': {
                const select = document.getElementById('themeMode');
                if (select) select.value = newValue;
                break;
            }
            case 'searchEngine': {
                const select = document.getElementById('defaultEngine');
                if (select) select.value = newValue;
                break;
            }
            case 'rotationInterval': {
                const select = document.getElementById('rotationInterval');
                if (select) select.value = newValue;
                break;
            }
        }
    },

    // Show toast notification
    showToast(message, type = 'info') {
        const container = this.getOrCreateToastContainer();
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-message">${message}</span>
            <button class="toast-close" aria-label="Dismiss">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        `;

        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });

        container.appendChild(toast);

        // Auto remove after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'toastIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    // Get or create toast container
    getOrCreateToastContainer() {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    },

    // Capitalize string
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
};

export default Settings;