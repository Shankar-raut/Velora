/**
 * Config - Single source of truth for all configuration
 * Eliminates duplicated defaults across modules
 */

export const CONFIG = {
    // Theme configuration
    themes: [
        { id: 'dark', label: 'Dark', accent: '#6366f1', isSystem: false },
        { id: 'light', label: 'Light', accent: '#4f46e5', isSystem: false },
        { id: 'auto', label: 'Auto', accent: null, isSystem: true },
        { id: 'system', label: 'System', accent: null, isSystem: true },
        { id: 'rose', label: 'Rose', accent: '#e11d48', isSystem: false },
        { id: 'ocean', label: 'Ocean', accent: '#0ea5e9', isSystem: false },
        { id: 'forest', label: 'Forest', accent: '#16a34a', isSystem: false },
        { id: 'violet', label: 'Violet', accent: '#a855f7', isSystem: false },
        { id: 'amber', label: 'Amber', accent: '#f59e0b', isSystem: false },
    ],

    themeModes: [
        { id: 'auto', label: 'Automatic', description: 'Follows system preference' },
        { id: 'dark', label: 'Dark', description: 'Always dark' },
        { id: 'light', label: 'Light', description: 'Always light' },
        { id: 'system', label: 'System', description: 'Same as automatic' },
    ],

    // Search engines
    searchEngines: {
        google: {
            name: 'Google',
            url: 'https://www.google.com/search?q={query}',
            icon: 'https://www.google.com/s2/favicons?domain=google.com&sz=32'
        },
        bing: {
            name: 'Bing',
            url: 'https://www.bing.com/search?q={query}',
            icon: 'https://www.bing.com/s2/favicons?domain=bing.com&sz=32'
        },
        duckduckgo: {
            name: 'DuckDuckGo',
            url: 'https://duckduckgo.com/?q={query}',
            icon: 'https://duckduckgo.com/favicon.ico'
        },
        brave: {
            name: 'Brave Search',
            url: 'https://search.brave.com/search?q={query}',
            icon: 'https://search.brave.com/favicon.ico'
        }
    },

    // Quick access sites (single source of truth)
    quickAccessSites: [
        { id: 'youtube', name: 'YouTube', url: 'https://youtube.com', icon: 'youtube', color: '#FF0000' },
        { id: 'github', name: 'GitHub', url: 'https://github.com', icon: 'github', color: '#24292e' },
        { id: 'twitter', name: 'X', url: 'https://x.com', icon: 'twitter', color: '#000000' },
        { id: 'instagram', name: 'Instagram', url: 'https://instagram.com', icon: 'instagram', color: '#E1306C' },
        { id: 'reddit', name: 'Reddit', url: 'https://reddit.com', icon: 'reddit', color: '#FF4500' },
        { id: 'netflix', name: 'Netflix', url: 'https://netflix.com', icon: 'netflix', color: '#E50914' },
        { id: 'spotify', name: 'Spotify', url: 'https://spotify.com', icon: 'spotify', color: '#1DB954' },
        { id: 'gmail', name: 'Gmail', url: 'https://mail.google.com', icon: 'gmail', color: '#EA4335' }
    ],

    // Default custom shortcuts
    defaultCustomShortcuts: [
        { name: 'Documentation', url: 'https://developer.mozilla.org' },
        { name: 'Stack Overflow', url: 'https://stackoverflow.com' }
    ],

    // Wallpaper categories
    wallpaperCategories: [
        'nature', 'abstract', 'minimal', 'space', 'architecture'
    ],

    // Wallpaper photos by category (curated Unsplash IDs)
    wallpaperPhotos: {
        nature: [
            'photo-1506905925346-21bda4d32df4',
            'photo-1470071459604-3b5ec3a7fe05',
            'photo-1441974231531-c6227db76b6e',
            'photo-1472214103451-9374bd1c798e',
            'photo-1506748686214-e9df14d4d9d0'
        ],
        abstract: [
            'photo-1557682250-33bd709cbe85',
            'photo-1550684848-fac1c5b4e8b5',
            'photo-1550745165-9bc0b252726f',
            'photo-1518770660439-4636190af475',
            'photo-1550745165-9bc0b252726f'
        ],
        minimal: [
            'photo-1519710164239-da123dc03ef4',
            'photo-1512917774080-9991f1c4c750',
            'photo-1513519245088-0e12902e5a38',
            'photo-1522071820081-009f0129c71c',
            'photo-1513519245088-0e12902e5a38'
        ],
        space: [
            'photo-1446776811953-b23d57bd25aa',
            'photo-1462331940025-496dcbfc042e',
            'photo-1464802686167-b939a6910659',
            'photo-1451187580459-43490279c0fa',
            'photo-1506748686214-e9df14d4d9d0'
        ],
        architecture: [
            'photo-1486718448742-163732cd1544',
            'photo-1493976040374-85c8e12f0c0e',
            'photo-1511818966892-d7d671e672a2',
            'photo-1503387762-592deb58ef4e',
            'photo-1486718448742-163732cd1544'
        ]
    },

    // Fallback wallpapers (direct Unsplash URLs)
    wallpaperFallbacks: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80',
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
        'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1920&q=80',
        'https://images.unsplash.com/photo-1446776811953-b23d57bd25aa?w=1920&q=80',
        'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=1920&q=80',
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&q=80',
        'https://images.unsplash.com/photo-1446776811953-b23d57bd25aa?w=1920&q=80'
    ],

    // Rotation intervals
    rotationIntervals: {
        newtab: { label: 'Every new tab', ms: null },
        '30min': { label: '30 minutes', ms: 30 * 60 * 1000 },
        '1hour': { label: '1 hour', ms: 60 * 60 * 1000 },
        daily: { label: 'Daily', ms: 24 * 60 * 60 * 1000 },
        manual: { label: 'Manual only', ms: null }
    },

    // Storage defaults (single source)
    storageDefaults: {
        theme: 'dark',
        themeMode: 'auto',
        searchEngine: 'google',
        showClock: true,
        use24Hour: false,
        reducedMotion: false,
        wallpaperCategories: ['nature', 'abstract', 'minimal', 'space', 'architecture'],
        rotationInterval: 'newtab',
        favorites: [],
        customShortcuts: [],
        lastWallpaperUpdate: 0,
        currentWallpaper: null
    },

    // Keyboard shortcuts (configurable)
    keyboardShortcuts: {
        focusSearch: '/',
        addShortcut: 'a',
        nextWallpaper: 'n'
    }
};

// Helper functions
export function getTheme(id) {
    return CONFIG.themes.find(t => t.id === id) || CONFIG.themes[0];
}

export function getThemeMode(id) {
    return CONFIG.themeModes.find(m => m.id === id) || CONFIG.themeModes[0];
}

export function getSearchEngine(id) {
    return CONFIG.searchEngines[id] || CONFIG.searchEngines.google;
}

export function getQuickAccessSites() {
    return CONFIG.quickAccessSites;
}

export function getDefaultCustomShortcuts() {
    return CONFIG.defaultCustomShortcuts;
}

export function getWallpaperCategories() {
    return CONFIG.wallpaperCategories;
}

export function getWallpaperPhotos() {
    return CONFIG.wallpaperPhotos;
}

export function getWallpaperFallbacks() {
    return CONFIG.wallpaperFallbacks;
}

export function getRotationIntervals() {
    return CONFIG.rotationIntervals;
}

export function getStorageDefaults() {
    return CONFIG.storageDefaults;
}

export function getKeyboardShortcuts() {
    return CONFIG.keyboardShortcuts;
}

export default CONFIG;