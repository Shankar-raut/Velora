/**
 * Wallpaper Module - Handles wallpaper fetching, caching, and rotation
 * Uses RotationScheduler for formalized rotation state machine
 */

import Storage from './storage.js';
import { RotationScheduler, RotationState } from './rotation-scheduler.js';
import { getWallpaperPhotos, getWallpaperFallbacks, getWallpaperCategories } from './config.js';

const Wallpaper = {
    photos: null,
    fallbacks: null,
    currentIndex: 0,
    preloadedImages: new Map(),
    isLoading: false,
    scheduler: null,

    // Initialize wallpaper
    async init() {
        this.photos = getWallpaperPhotos();
        this.fallbacks = getWallpaperFallbacks();

        // Load saved wallpaper
        const settings = await Storage.get(['currentWallpaper', 'wallpaperCategories']);
        const categories = settings.wallpaperCategories || getWallpaperCategories();
        const savedWallpaper = settings.currentWallpaper;

        // Initialize rotation scheduler
        this.scheduler = new RotationScheduler();
        await this.scheduler.init(() => this.loadRandomWallpaper(categories));

        // Subscribe to scheduler state changes
        this.scheduler.subscribe((state) => {
            this.handleSchedulerStateChange(state);
        });

        // Load wallpaper
        if (savedWallpaper) {
            await this.loadWallpaper(savedWallpaper);
        } else {
            await this.loadRandomWallpaper(categories);
        }

        // Listen for settings changes
        Storage.on('wallpaperCategories', (newCategories) => {
            categories = newCategories || getWallpaperCategories();
        });

        // Preload next wallpaper
        this.preloadNext(categories);

        return this.currentWallpaper;
    },

    handleSchedulerStateChange(state) {
        // Update UI based on scheduler state
        const nextBtn = document.getElementById('nextWallpaperBtn');
        if (nextBtn) {
            nextBtn.classList.toggle('loading', state.isLoading);
            nextBtn.disabled = state.isLoading;
        }
    },

    // Load a specific wallpaper URL
    async loadWallpaper(url) {
        if (this.isLoading) return;
        this.isLoading = true;

        const img = document.getElementById('wallpaperImg');

        // Fade out current
        img.classList.remove('loaded');

        try {
            // Load new image
            await this.loadImage(url);
            img.src = url;
            img.onload = () => {
                img.classList.add('loaded');
                this.isLoading = false;
                this.scheduler?.onLoadComplete(true);
            };
            img.onerror = () => {
                this.isLoading = false;
                this.scheduler?.onLoadComplete(false);
                this.loadFallback();
            };

            // Save to storage
            this.currentWallpaper = url;
            await Storage.setValue('currentWallpaper', url);
            await Storage.setValue('lastWallpaperUpdate', Date.now());
        } catch (error) {
            console.error('Failed to load wallpaper:', error);
            this.isLoading = false;
            this.scheduler?.onLoadComplete(false);
            this.loadFallback();
        }
    },

    // Load random wallpaper from categories
    async loadRandomWallpaper(categories = null) {
        if (!categories) {
            const settings = await Storage.get(['wallpaperCategories']);
            categories = settings.wallpaperCategories || getWallpaperCategories();
        }

        // Pick random category and photo
        const category = categories[Math.floor(Math.random() * categories.length)];
        const photos = this.photos[category] || this.photos.nature;
        const photoId = photos[Math.floor(Math.random() * photos.length)];

        // Build direct Unsplash image URL with consistent sizing
        const url = `https://images.unsplash.com/${photoId}?w=1920&q=80&fm=webp&fit=crop`;

        await this.loadWallpaper(url);
    },

    // Load next wallpaper (for manual button)
    async loadNextWallpaper(categories = null) {
        await this.loadRandomWallpaper(categories);
        this.preloadNext(categories);
    },

    // Load fallback wallpaper
    loadFallback() {
        const fallback = this.fallbacks[this.currentIndex % this.fallbacks.length];
        this.currentIndex++;
        this.loadWallpaper(fallback);
    },

    // Preload image with timeout
    loadImage(url, timeout = 10000) {
        return new Promise((resolve, reject) => {
            // Check cache
            if (this.preloadedImages.has(url)) {
                resolve(this.preloadedImages.get(url));
                return;
            }

            const img = new Image();
            let timeoutId;

            const cleanup = () => {
                if (timeoutId) clearTimeout(timeoutId);
                img.onload = null;
                img.onerror = null;
            };

            img.onload = () => {
                cleanup();
                this.preloadedImages.set(url, img);
                resolve(img);
            };
            img.onerror = (err) => {
                cleanup();
                reject(err);
            };

            timeoutId = setTimeout(() => {
                cleanup();
                reject(new Error('Wallpaper load timeout'));
            }, timeout);

            img.src = url;
        });
    },

    // Preload next wallpaper
    async preloadNext(categories = null) {
        if (!categories) {
            const settings = await Storage.get(['wallpaperCategories']);
            categories = settings.wallpaperCategories || getWallpaperCategories();
        }

        const category = categories[Math.floor(Math.random() * categories.length)];
        const photos = this.photos[category] || this.photos.nature;
        const photoId = photos[Math.floor(Math.random() * photos.length)];
        const url = `https://images.unsplash.com/${photoId}?w=1920&q=80&fm=webp&fit=crop`;

        this.loadImage(url).catch(() => {});
    },

    // Get current wallpaper URL
    getCurrentWallpaper() {
        return this.currentWallpaper;
    },

    // Get scheduler state for UI
    getSchedulerState() {
        return this.scheduler?.getState() || { state: RotationState.IDLE };
    },

    // Clear cache
    async clearCache() {
        this.preloadedImages.clear();
        await Storage.setValue('currentWallpaper', null);
        await Storage.setValue('lastWallpaperUpdate', 0);
    }
};

export default Wallpaper;