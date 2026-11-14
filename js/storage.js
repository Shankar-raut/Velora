/**
 * Storage Utility - Handles Chrome storage sync/local operations
 * Includes EventBus for centralized change notifications
 */

class EventBus {
    constructor() {
        this._listeners = new Map();
    }

    /**
     * Subscribe to a key or all changes
     * @param {string|string[]} keys - Key(s) to listen for, or '*' for all
     * @param {Function} callback - Called with (newValue, oldValue, key)
     * @returns {Function} Unsubscribe function
     */
    subscribe(keys, callback) {
        const keyArray = Array.isArray(keys) ? keys : [keys];
        keyArray.forEach(key => {
            if (!this._listeners.has(key)) {
                this._listeners.set(key, new Set());
            }
            this._listeners.get(key).add(callback);
        });

        return () => {
            keyArray.forEach(key => {
                this._listeners.get(key)?.delete(callback);
            });
        };
    }

    /**
     * Emit change to subscribers
     */
    emit(key, newValue, oldValue) {
        // Specific key listeners
        this._listeners.get(key)?.forEach(cb => cb(newValue, oldValue, key));
        // Wildcard listeners
        this._listeners.get('*')?.forEach(cb => cb(newValue, oldValue, key));
    }
}

const eventBus = new EventBus();

const Storage = {
    // Default settings
    defaults: {
        theme: 'dark',
        themeMode: 'auto', // auto, dark, light, system
        searchEngine: 'google',
        showClock: true,
        use24Hour: false,
        reducedMotion: false,
        wallpaperCategories: ['nature', 'abstract', 'minimal', 'space', 'architecture'],
        rotationInterval: 'newtab', // newtab, 30min, 1hour, daily, manual
        favorites: [],
        customShortcuts: [],
        lastWallpaperUpdate: 0,
        currentWallpaper: null
    },

    // Initialize storage with defaults
    async init() {
        const stored = await this.getAll();
        const merged = { ...this.defaults, ...stored };
        // Check if any default keys are missing from stored
        const hasMissingKeys = Object.keys(this.defaults).some(key => !(key in stored));
        if (hasMissingKeys) {
            await this.set(merged);
        }
        return merged;
    },

    // Get all settings
    async getAll() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(null, (items) => {
                resolve(items || {});
            });
        });
    },

    // Get specific keys
    async get(keys) {
        return new Promise((resolve) => {
            chrome.storage.sync.get(keys, (items) => {
                resolve(items || {});
            });
        });
    },

    // Set single or multiple values
    async set(data) {
        return new Promise((resolve) => {
            chrome.storage.sync.set(data, () => {
                resolve();
            });
        });
    },

    // Remove keys
    async remove(keys) {
        return new Promise((resolve) => {
            chrome.storage.sync.remove(keys, () => {
                resolve();
            });
        });
    },

    // Clear all
    async clear() {
        return new Promise((resolve) => {
            chrome.storage.sync.clear(() => {
                resolve();
            });
        });
    },

    // Listen for changes (legacy callback API)
    onChanged(callback) {
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'sync') {
                callback(changes);
            }
        });
    },

    // Subscribe to specific key changes (new EventBus API)
    on(key, callback) {
        return eventBus.subscribe(key, callback);
    },

    // Subscribe to all changes
    onAny(callback) {
        return eventBus.subscribe('*', callback);
    },

    // Get single value with default
    async getValue(key, defaultValue = null) {
        const result = await this.get([key]);
        return result[key] !== undefined ? result[key] : defaultValue;
    },

    // Set single value
    async setValue(key, value) {
        await this.set({ [key]: value });
    }
};

// Export event bus for direct use
export { eventBus };

// Export for module usage
export default Storage;