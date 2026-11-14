/**
 * ThemeConfig - Single source of truth for theme state
 * Replaces coupled theme + themeMode with unified config and computed effective theme
 */

import Storage from './storage.js';

/**
 * All available themes with metadata
 */
export const THEMES = [
    { id: 'dark', label: 'Dark', accent: '#6366f1', isSystem: false },
    { id: 'light', label: 'Light', accent: '#4f46e5', isSystem: false },
    { id: 'auto', label: 'Auto', accent: null, isSystem: true },
    { id: 'system', label: 'System', accent: null, isSystem: true },
    { id: 'rose', label: 'Rose', accent: '#e11d48', isSystem: false },
    { id: 'ocean', label: 'Ocean', accent: '#0ea5e9', isSystem: false },
    { id: 'forest', label: 'Forest', accent: '#16a34a', isSystem: false },
    { id: 'violet', label: 'Violet', accent: '#a855f7', isSystem: false },
    { id: 'amber', label: 'Amber', accent: '#f59e0b', isSystem: false },
];

/**
 * Theme modes
 */
export const THEME_MODES = [
    { id: 'auto', label: 'Automatic', description: 'Follows system preference' },
    { id: 'dark', label: 'Dark', description: 'Always dark' },
    { id: 'light', label: 'Light', description: 'Always light' },
    { id: 'system', label: 'System', description: 'Same as automatic' },
];

/**
 * Get theme by ID
 */
export function getTheme(id) {
    return THEMES.find(t => t.id === id) || THEMES[0];
}

/**
 * Get mode by ID
 */
export function getMode(id) {
    return THEME_MODES.find(m => m.id === id) || THEME_MODES[0];
}

/**
 * Compute effective theme from saved theme + mode
 * @param {string} savedTheme - The saved theme ID
 * @param {string} mode - The current mode
 * @returns {string} - The effective theme to apply
 */
export function computeEffectiveTheme(savedTheme, mode) {
    // If mode is explicit dark/light, use that
    if (mode === 'dark' || mode === 'light') {
        return mode;
    }

    // If theme is explicit (not auto/system), use it
    const theme = getTheme(savedTheme);
    if (!theme.isSystem) {
        return savedTheme;
    }

    // Otherwise, follow system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * ThemeConfig class - manages theme state with reactive updates
 */
export class ThemeConfig {
    constructor() {
        this._savedTheme = 'dark';
        this._mode = 'auto';
        this._effectiveTheme = 'dark';
        this._systemMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this._listeners = new Set();
        this._initialized = false;
    }

    /**
     * Initialize from storage
     */
    async init() {
        const settings = await Storage.get(['theme', 'themeMode']);
        this._savedTheme = settings.theme || 'dark';
        this._mode = settings.themeMode || 'auto';
        this._effectiveTheme = computeEffectiveTheme(this._savedTheme, this._mode);

        this._systemMediaQuery.addEventListener('change', this._onSystemChange.bind(this));

        // Listen for storage changes
        Storage.onChanged((changes) => {
            if (changes.theme) {
                this._savedTheme = changes.theme.newValue;
                this._recompute();
            }
            if (changes.themeMode) {
                this._mode = changes.themeMode.newValue;
                this._recompute();
            }
        });

        this._initialized = true;
        this._notify();
        return this._effectiveTheme;
    }

    /**
     * Recompute effective theme and notify
     */
    _recompute() {
        const newEffective = computeEffectiveTheme(this._savedTheme, this._mode);
        if (newEffective !== this._effectiveTheme) {
            this._effectiveTheme = newEffective;
            this._notify();
        }
    }

    _onSystemChange() {
        // Only auto-switch if in auto/system mode
        if (this._mode === 'auto' || this._mode === 'system') {
            this._recompute();
        }
    }

    /**
     * Subscribe to theme changes
     * @param {Function} listener - Called with { effectiveTheme, savedTheme, mode }
     * @returns {Function} Unsubscribe function
     */
    subscribe(listener) {
        this._listeners.add(listener);
        // Immediately call with current state
        listener(this.getState());
        return () => this._listeners.delete(listener);
    }

    _notify() {
        const state = this.getState();
        this._listeners.forEach(fn => fn(state));
    }

    /**
     * Get current state snapshot
     */
    getState() {
        return {
            effectiveTheme: this._effectiveTheme,
            savedTheme: this._savedTheme,
            mode: this._mode,
            isSystemTheme: getTheme(this._savedTheme).isSystem,
            availableThemes: THEMES,
            availableModes: THEME_MODES
        };
    }

    /**
     * Set saved theme
     */
    async setTheme(themeId) {
        const theme = getTheme(themeId);
        if (!theme) return false;

        this._savedTheme = themeId;
        await Storage.setValue('theme', themeId);
        // Storage listener will trigger _recompute
        return true;
    }

    /**
     * Set theme mode
     */
    async setMode(modeId) {
        const mode = getMode(modeId);
        if (!mode) return false;

        this._mode = modeId;
        await Storage.setValue('themeMode', modeId);
        // Storage listener will trigger _recompute
        return true;
    }

    /**
     * Toggle between dark/light (only works for non-system themes)
     */
    async toggle() {
        if (getTheme(this._savedTheme).isSystem) return false;

        const newTheme = this._effectiveTheme === 'dark' ? 'light' : 'dark';
        return this.setTheme(newTheme);
    }

    /**
     * Apply theme to document
     */
    applyToDocument() {
        document.documentElement.setAttribute('data-theme', this._effectiveTheme);
    }

    /**
     * Check if initialized
     */
    get initialized() {
        return this._initialized;
    }
}

// Singleton instance
export const themeConfig = new ThemeConfig();

export default ThemeConfig;