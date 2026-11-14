/**
 * Search Module - Handles search functionality, engine selection, search suggestions, and keyboard shortcuts
 */

import Storage from './storage.js';
import { DropdownFactory } from './dropdown.js';
import { commandPalette } from './command-palette.js';
import { getSearchEngine, getKeyboardShortcuts, getQuickAccessSites, getDefaultCustomShortcuts } from './config.js';

const Search = {
    engines: null, // Will be loaded from config
    currentEngine: 'google',
    dropdown: null,
    suggestionsDropdown: null,
    suggestionsDebounce: null,
    highlightedIndex: -1,
    suggestions: [],
    localSites: null, // Will hold quick access sites and custom shortcuts

    // Initialize search
    async init() {
        this.engines = await this.loadEngines();
        this.localSites = await this.loadLocalSites();

        const settings = await Storage.get(['searchEngine']);
        this.currentEngine = settings.searchEngine || 'google';

        this.setupSearchForm();
        this.setupEngineSelector();
        this.setupSearchSuggestions();
        this.setupKeyboardShortcuts();
        this.updateEngineUI();

        // Listen for settings changes
        Storage.on('searchEngine', (newValue) => {
            this.currentEngine = newValue;
            this.updateEngineUI();
        });

        // Listen for shortcut changes to update local suggestions
        Storage.on('customShortcuts', () => {
            this.loadLocalSites();
        });

        return this;
    },

    async loadLocalSites() {
        const { default: config } = await import('./config.js');
        const quickAccess = config.quickAccessSites || [];
        const shortcuts = config.defaultCustomShortcuts || [];

        // Also get user's custom shortcuts from storage
        const storage = await Storage.get(['customShortcuts']);
        const customShortcuts = storage.customShortcuts || [];

        this.localSites = [
            ...quickAccess.map(s => ({ name: s.name, url: s.url, type: 'quick-access', icon: s.icon, color: s.color })),
            ...shortcuts.map(s => ({ name: s.name, url: s.url, type: 'shortcut' })),
            ...customShortcuts.map(s => ({ name: s.name, url: s.url, type: 'custom' }))
        ];
    },

    async loadEngines() {
        // In a real app, this could come from config.js
        const { default: config } = await import('./config.js');
        return config.searchEngines;
    },

    // Setup search form submission
    setupSearchForm() {
        const form = document.getElementById('searchForm');
        const input = document.getElementById('searchInput');

        if (!form || !input) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = input.value.trim();
            if (query) {
                this.performSearch(query);
                this.hideSuggestions();
                input.blur();
            }
        });
    },

    // Setup search engine selector dropdown using factory
    setupEngineSelector() {
        this.dropdown = DropdownFactory.createEngineSelector(
            '#searchEngineBtn',
            '#searchEngineDropdown',
            this.engines,
            this.currentEngine,
            async (engine) => await this.setEngine(engine)
        );
    },

    // Setup search suggestions (autocomplete)
    setupSearchSuggestions() {
        const input = document.getElementById('searchInput');
        const suggestionsContainer = document.getElementById('searchSuggestions');

        if (!input || !suggestionsContainer) return;

        this.suggestionsDropdown = suggestionsContainer;

        // Debounced fetch suggestions
        input.addEventListener('input', () => {
            clearTimeout(this.suggestionsDebounce);
            this.suggestionsDebounce = setTimeout(() => {
                const query = input.value.trim();
                if (query.length >= 2) {
                    this.fetchSuggestions(query);
                } else {
                    this.hideSuggestions();
                }
            }, 150);
        });

        // Show suggestions on focus if there's content
        input.addEventListener('focus', () => {
            const query = input.value.trim();
            if (query.length >= 2) {
                this.fetchSuggestions(query);
            }
        });

        // Hide suggestions on blur (with delay to allow click)
        input.addEventListener('blur', () => {
            setTimeout(() => this.hideSuggestions(), 200);
        });

        // Keyboard navigation for suggestions
        input.addEventListener('keydown', (e) => {
            if (!this.suggestionsDropdown.classList.contains('open')) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.highlightNext();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.highlightPrev();
                    break;
                case 'Enter':
                    if (this.highlightedIndex >= 0) {
                        e.preventDefault();
                        this.selectHighlighted();
                    }
                    break;
                case 'Escape':
                    this.hideSuggestions();
                    input.blur();
                    break;
            }
        });

        // Click on suggestion
        this.suggestionsDropdown.addEventListener('click', (e) => {
            const item = e.target.closest('.search-suggestion-item');
            if (item) {
                const index = Array.from(this.suggestionsDropdown.children).indexOf(item);
                if (index >= 0) {
                    this.highlightedIndex = index;
                    this.selectHighlighted();
                }
            }
        });
    },

    // Fetch search suggestions from Google's autocomplete API and local sites
    async fetchSuggestions(query) {
        try {
            // Get local site suggestions first (instant)
            const localSuggestions = this.getLocalSuggestions(query);

            // Use Google's autocomplete API (works with CORS)
            const response = await fetch(
                `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`,
                { credentials: 'omit' }
            );

            if (!response.ok) throw new Error('Failed to fetch suggestions');

            const data = await response.json();
            // data[1] contains the suggestions array
            const googleSuggestions = data[1] || [];

            // Combine local and Google suggestions (local first, then Google, deduplicated)
            this.suggestions = this.combineSuggestions(localSuggestions, googleSuggestions);
            this.renderSuggestions(query);
        } catch (error) {
            console.warn('Failed to fetch search suggestions:', error);
            // Still show local suggestions if Google fails
            if (this.localSites && this.localSites.length > 0) {
                this.suggestions = this.getLocalSuggestions(query);
                this.renderSuggestions(query);
            } else {
                this.hideSuggestions();
            }
        }
    },

    // Get local site suggestions that match the query
    getLocalSuggestions(query) {
        if (!this.localSites || this.localSites.length === 0) return [];

        const lowerQuery = query.toLowerCase().trim();
        return this.localSites
            .filter(site => site.name.toLowerCase().includes(lowerQuery) || site.url.toLowerCase().includes(lowerQuery))
            .slice(0, 5) // Limit local suggestions
            .map(site => ({ text: site.name, type: 'local', url: site.url, icon: site.icon, color: site.color }));
    },

    // Combine local and Google suggestions, deduplicate
    combineSuggestions(localSuggestions, googleSuggestions) {
        const seen = new Set();
        const combined = [];

        // Add local suggestions first
        for (const suggestion of localSuggestions) {
            const key = suggestion.text.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                combined.push(suggestion);
            }
        }

        // Add Google suggestions
        for (const suggestion of googleSuggestions) {
            const key = suggestion.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                combined.push({ text: suggestion, type: 'google' });
            }
        }

        return combined;
    },

    // Render suggestions in the dropdown
    renderSuggestions(originalQuery) {
        if (!this.suggestionsDropdown || this.suggestions.length === 0) {
            this.hideSuggestions();
            return;
        }

        this.highlightedIndex = -1;

        this.suggestionsDropdown.innerHTML = this.suggestions
            .map((suggestion, index) => {
                const suggestionText = typeof suggestion === 'string' ? suggestion : suggestion.text;
                const suggestionType = typeof suggestion === 'string' ? 'google' : suggestion.type;
                const suggestionIcon = typeof suggestion === 'object' ? suggestion.icon : null;
                const suggestionColor = typeof suggestion === 'object' ? suggestion.color : null;
                const suggestionUrl = typeof suggestion === 'object' ? suggestion.url : null;

                // Split into query match and append part
                const lowerQuery = originalQuery.toLowerCase();
                const lowerSuggestion = suggestionText.toLowerCase();
                let queryPart = suggestionText;
                let appendPart = '';

                if (lowerSuggestion.startsWith(lowerQuery)) {
                    queryPart = suggestionText.slice(0, originalQuery.length);
                    appendPart = suggestionText.slice(originalQuery.length);
                }

                // Build icon - use site icon for local, search icon for google
                let iconHtml = '';
                if (suggestionType === 'local' && suggestionIcon) {
                    iconHtml = this.getSiteIconHtml(suggestionIcon, suggestionColor);
                } else {
                    iconHtml = `
                        <svg class="search-suggestion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                            <circle cx="11" cy="11" r="7"></circle>
                            <line x1="21" y1="21" x2="16.5" y2="16.5"></line>
                        </svg>
                    `;
                }

                return `
                    <button type="button" class="search-suggestion-item ${suggestionType === 'local' ? 'local-suggestion' : ''}" role="option" data-index="${index}" tabindex="-1" data-url="${this.escapeHtml(suggestionUrl || '')}" data-type="${suggestionType}">
                        ${iconHtml}
                        <span class="search-suggestion-text">
                            <span class="search-suggestion-query">${this.escapeHtml(queryPart)}</span>
                            <span class="search-suggestion-append">${this.escapeHtml(appendPart)}</span>
                        </span>
                    </button>
                `;
            })
            .join('');

        this.suggestionsDropdown.hidden = false;
        // Force reflow for animation
        this.suggestionsDropdown.offsetHeight;
        this.suggestionsDropdown.classList.add('open');
    },

    // Get site icon HTML for local suggestions
    getSiteIconHtml(iconName, color) {
        // Simple icon mapping for common sites
        const icons = {
            youtube: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
            github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>',
            twitter: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 9.724h-3.304l-7.124-8.17-7.126 8.17h-3.304l8.502-9.724-7.227-8.26h3.308l7.126 8.172 7.124-8.172z"/></svg>',
            instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>',
            reddit: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.078 11.254c0-1.432-.567-2.571-1.826-3.242.602-.361 1.139-.792 1.472-1.363.045-.122.067-.247.067-.375 0-1.221-.831-2.167-2.018-2.259-.025-.347-.293-.635-.651-.676-.352-.04-.704.095-.949.316-.393.355-.67.72-.812 1.223C15.112.755 14.23.463 13.5.463c-.748 0-1.593.299-2.177.749-.205-.486-.56-.86-.89-1.2l-.035-.008c-.358-.042-.71.118-.986.355-.276.237-.544.525-.651.872-1.074.094-2.027.994-2.027 2.213 0 .126.022 .252.067.375.315.55.877.972 1.479 1.351-1.307.71-1.903 1.893-1.903 3.392 0 .608.15 1.062.309 1.581-.341.042-.747.22-1.07.505-.348.287-.595.729-.585 1.202 2.53 1.527 4.59 4.38 5.163 7.544.348 1.923 1.984 3.456 4.137 3.456 2.128 0 3.765-1.51 4.113-3.42.612-3.324 2.627-6.183 5.125-7.648.014-.453-.23-.865-.578-1.176-.324-.286-.73-.464-1.071-.506.159-.519.309-.973.309-1.581zm-6.737-.551c-1.138 0-2.058-.793-2.058-1.834 0-.993.93-1.801 2.094-1.801 1.163 0 2.094.807 2.094 1.801 0 1.01-.92 1.834-2.13 1.834zm-5.573 0c-1.138 0-2.058-.793-2.058-1.834 0-.993.93-1.801 2.094-1.801 1.163 0 2.094.807 2.094 1.801 0 1.01-.92 1.834-2.13 1.834z"/></svg>',
            netflix: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.895.003L11.906 24h.177L12.073 0h-.178zm-11.906 0L0 24h.177L.17 0h-.17zm23.802 0L24 24h.177L24.163 0h-.17z"/></svg>',
            spotify: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12c0 6.627 5.373 12 12 12s12-5.373 12-12C24 5.373 18.627 0 12 0zm5.523 17.339c-.276.552-.83.83-1.381.83-.345 0-.552-.07-.829-.276l-2.35-2.76c-.554.554-1.245.969-2.005.969-1.382 0-2.502-.761-2.502-2.144 0-.829.484-1.382 1.313-1.726-.138-.069-.553-.346-.622-.968h-.07c-.207.553-.485.899-.83 1.175-1.175.969-2.418 1.521-3.799 1.521-2.764 0-5.04-1.936-5.04-4.836 0-2.76 2.276-5.04 5.04-5.04 2.557 0 4.461 1.934 4.766 4.422.207-.276.483-.622.829-.899.345-.345.829-.622 1.381-.622.899 0 1.589.691 1.658 1.659v2.281h2.213v-.069c.069-.691.207-1.244.553-1.658.485-.553 1.245-.761 2.146-.761 2.487 0 4.561 2.145 4.561 5.253 0 1.797-.761 3.04-1.935 3.87zm-1.382-7.12c-.415 0-.76-.276-1.037-.621-.346-.414-.553-1.036-.553-1.797 0-1.106.761-1.934 2.146-1.934 1.381 0 2.145.828 2.145 1.934 0 .761-.207 1.313-.552 1.727-.276.276-.621.485-1.036.485-.553 0-.968-.207-1.176-.552l-.138-.276c-.207.276-.552.484-.968.484-.76 0-1.381-.484-1.381-1.38z"/></svg>',
            gmail: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>',
        };

        const iconSvg = icons[iconName] || icons.github;
        const iconColor = color || 'currentColor';

        return `<span class="search-suggestion-site-icon" style="color: ${iconColor};">${iconSvg}</span>`;
    },

    // Highlight next suggestion
    highlightNext() {
        const items = this.suggestionsDropdown.querySelectorAll('.search-suggestion-item');
        if (items.length === 0) return;

        this.highlightedIndex = Math.min(this.highlightedIndex + 1, items.length - 1);
        this.updateHighlight(items);
    },

    // Highlight previous suggestion
    highlightPrev() {
        const items = this.suggestionsDropdown.querySelectorAll('.search-suggestion-item');
        if (items.length === 0) return;

        this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0);
        this.updateHighlight(items);
    },

    // Update highlighted item
    updateHighlight(items) {
        items.forEach((item, index) => {
            if (index === this.highlightedIndex) {
                item.classList.add('highlighted');
                item.setAttribute('aria-selected', 'true');
            } else {
                item.classList.remove('highlighted');
                item.setAttribute('aria-selected', 'false');
            }
        });
    },

    // Select highlighted suggestion
    selectHighlighted() {
        const items = this.suggestionsDropdown.querySelectorAll('.search-suggestion-item');
        const selected = items[this.highlightedIndex];
        if (selected) {
            const suggestionType = selected.dataset.type;
            const suggestionUrl = selected.dataset.url;

            if (suggestionType === 'local' && suggestionUrl) {
                // Navigate directly to the URL for local suggestions
                window.location.href = suggestionUrl;
            } else {
                // Perform search for Google suggestions
                const query = selected.textContent.trim();
                const input = document.getElementById('searchInput');
                if (input) {
                    input.value = query;
                }
                this.performSearch(query);
            }
            this.hideSuggestions();
            input?.blur();
        }
    },

    // Hide suggestions dropdown
    hideSuggestions() {
        if (this.suggestionsDropdown) {
            this.suggestionsDropdown.classList.remove('open');
            this.suggestionsDropdown.hidden = true;
            this.suggestionsDropdown.innerHTML = '';
            this.highlightedIndex = -1;
            this.suggestions = [];
        }
    },

    // Escape HTML for safe insertion
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Update engine UI
    updateEngineUI() {
        const engine = this.engines[this.currentEngine];
        const btn = document.getElementById('searchEngineBtn');
        const iconEl = document.getElementById('engineIcon');
        const nameEl = document.getElementById('engineName');

        if (iconEl) iconEl.src = engine.icon;
        if (nameEl) nameEl.textContent = engine.name;
        // DropdownFactory handles option active states
    },

    // Set search engine
    async setEngine(engine) {
        if (!this.engines[engine]) return;

        this.currentEngine = engine;
        await Storage.setValue('searchEngine', engine);
        this.updateEngineUI();
    },

    // Perform search
    performSearch(query) {
        const engine = this.engines[this.currentEngine];
        const url = engine.url.replace('{query}', encodeURIComponent(query));
        window.location.href = url;
    },

    // Setup keyboard shortcuts using CommandPalette
    setupKeyboardShortcuts() {
        const input = document.getElementById('searchInput');
        const shortcuts = getKeyboardShortcuts();

        // Global shortcut to focus search
        commandPalette.register({
            key: shortcuts.focusSearch,
            description: 'Focus search',
            handler: () => input?.focus(),
            condition: (e, isTyping) => !isTyping
        });

        // Escape to blur search
        commandPalette.register({
            key: 'escape',
            description: 'Blur search input',
            handler: () => {
                if (document.activeElement === input) {
                    input.blur();
                    this.hideSuggestions();
                }
            },
            condition: (e, isTyping) => isTyping && document.activeElement === input
        });

        // Focus search input on click of glass area
        const glassWrapper = document.getElementById('searchGlassWrapper');
        if (glassWrapper && input) {
            glassWrapper.addEventListener('click', (e) => {
                if (e.target === glassWrapper || e.target.classList.contains('search-glass')) {
                    input.focus();
                }
            });
        }
    },

    // Get current engine
    getCurrentEngine() {
        return this.currentEngine;
    }
};

export default Search;