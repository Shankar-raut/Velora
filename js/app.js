/**
 * Velora - New Tab Extension
 * Main application entry point
 */

import Storage from './storage.js';
import ThemeEngine from './theme-engine.js';
import Wallpaper from './wallpaper.js';
import Clock from './clock.js';
import Search from './search.js';
import Shortcuts from './shortcuts.js';
import Settings from './settings.js';
import Workspace from './workspace.js';
import { commandPalette } from './command-palette.js';
import { getKeyboardShortcuts } from './config.js';

// Initialize all modules
async function init() {
    try {
        // Initialize storage first
        await Storage.init();

        // Initialize all modules in parallel where possible
        await Promise.all([
            ThemeEngine.init(),
            Wallpaper.init(),
            Clock.init(),
            Search.init(),
            Shortcuts.init(),
            Settings.init(),
            Workspace.init()
        ]);

        // Setup global event listeners
        setupGlobalListeners();

        // Setup next wallpaper button
        setupNextWallpaperButton();

        // Register global keyboard shortcuts via CommandPalette
        registerGlobalShortcuts();

    } catch (error) {
        // Show fallback UI
        showFallbackUI();
    }
}

// Setup global event listeners
function setupGlobalListeners() {
    // Handle visibility change (pause/resume clock)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            Clock.stopTimer();
        } else {
            Clock.startTimer();
            // Refresh wallpaper if needed
            Wallpaper.init();
        }
    });

    // Handle theme change event
    window.addEventListener('themechange', (e) => {
        // Update wallpaper overlay for new theme
        // This is handled in CSS via data-theme attribute
    });

    // Prevent context menu on wallpaper
    document.getElementById('wallpaperImg')?.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    // Handle drag and drop for wallpaper (optional)
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());
}

// Setup next wallpaper button
function setupNextWallpaperButton() {
    const nextBtn = document.getElementById('nextWallpaperBtn');
    if (nextBtn) {
        nextBtn.addEventListener('click', async () => {
            // Show loading state
            nextBtn.classList.add('loading');
            nextBtn.disabled = true;

            try {
                await Wallpaper.loadNextWallpaper();
            } finally {
                nextBtn.classList.remove('loading');
                nextBtn.disabled = false;
            }
        });
    }
}

// Register global keyboard shortcuts
function registerGlobalShortcuts() {
    const shortcuts = getKeyboardShortcuts();

    // Next wallpaper shortcut
    commandPalette.register({
        key: shortcuts.nextWallpaper,
        description: 'Next wallpaper',
        handler: async () => {
            const nextBtn = document.getElementById('nextWallpaperBtn');
            if (nextBtn && !nextBtn.disabled) {
                nextBtn.click();
            }
        },
        condition: (e, isTyping) => !isTyping
    });
}

// Show fallback UI if initialization fails
function showFallbackUI() {
    document.body.innerHTML = `
        <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: #0a0a0f;
            color: #f0f1f4;
            font-family: system-ui, sans-serif;
            text-align: center;
            padding: 24px;
        ">
            <h1 style="font-size: 2rem; margin-bottom: 12px;">Velora</h1>
            <p style="color: #787c8a; margin-bottom: 24px;">Failed to load extension. Please reload.</p>
            <button onclick="location.reload()" style="
                padding: 12px 24px;
                background: #6366f1;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 1rem;
                cursor: pointer;
            ">Reload</button>
        </div>
    `;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for debugging
window.Velora = {
    Storage,
    ThemeEngine,
    Wallpaper,
    Clock,
    Search,
    Shortcuts,
    Settings,
    Workspace
};