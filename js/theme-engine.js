/**
 * ThemeEngine - Handles theme switching using unified ThemeConfig
 */

import { themeConfig } from './theme-config.js';
import { DropdownFactory } from './dropdown.js';

const ThemeEngine = {
    // Initialize theme engine using unified config
    async init() {
        // Initialize theme config (loads from storage, sets up listeners)
        await themeConfig.init();

        // Apply initial theme
        themeConfig.applyToDocument();

        // Subscribe to theme changes
        themeConfig.subscribe((state) => {
            this.applyTheme(state.effectiveTheme, state.savedTheme);
            this.updateThemeSelectorUI(state.savedTheme);
        });

        // Setup theme selector dropdown using factory
        this.dropdown = DropdownFactory.createThemeSelector(
            '#themeSelectorBtn',
            '#themeDropdown',
            themeConfig.getState().savedTheme,
            (theme) => themeConfig.setTheme(theme)
        );

        return themeConfig.getState().effectiveTheme;
    },

    // Apply theme to document
    applyTheme(effectiveTheme, savedTheme) {
        // Add switching class to disable transitions
        document.documentElement.classList.add('theme-switching');

        // Apply to document
        document.documentElement.setAttribute('data-theme', effectiveTheme);

        // Remove switching class after a frame
        requestAnimationFrame(() => {
            document.documentElement.classList.remove('theme-switching');
        });

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('themechange', {
            detail: { theme: effectiveTheme, savedTheme }
        }));
    },

    // Update theme selector UI
    updateThemeSelectorUI(savedTheme) {
        const label = document.getElementById('themeLabel');
        if (label) {
            const theme = themeConfig.getState().availableThemes.find(t => t.id === savedTheme);
            label.textContent = theme?.label || savedTheme;
        }
        // DropdownFactory handles option active states via its internal syncAria
    },

    // Get current effective theme
    getCurrentTheme() {
        return themeConfig.getState().effectiveTheme;
    },

    // Get saved theme (user preference)
    getSavedTheme() {
        return themeConfig.getState().savedTheme;
    },

    // Get current mode
    getMode() {
        return themeConfig.getState().mode;
    },

    // Set theme (delegates to themeConfig)
    async setTheme(theme) {
        return themeConfig.setTheme(theme);
    },

    // Set theme mode (delegates to themeConfig)
    async setThemeMode(mode) {
        return themeConfig.setMode(mode);
    },

    // Toggle between dark/light
    async toggleTheme() {
        return themeConfig.toggle();
    }
};

export default ThemeEngine;