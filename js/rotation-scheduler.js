/**
 * RotationScheduler - Formalized wallpaper rotation state machine
 * States: Idle | Scheduled | Loading | Error
 */

import Storage from './storage.js';

export const RotationState = {
    IDLE: 'idle',
    SCHEDULED: 'scheduled',
    LOADING: 'loading',
    ERROR: 'error'
};

export const RotationInterval = {
    NEWTAB: 'newtab',      // Rotate on each new tab (handled externally)
    MANUAL: 'manual',      // No auto rotation
    MIN_30: '30min',       // 30 minutes
    HOUR_1: '1hour',       // 1 hour
    DAILY: 'daily'         // 24 hours
};

const INTERVAL_MS = {
    [RotationInterval.NEWTAB]: null,
    [RotationInterval.MANUAL]: null,
    [RotationInterval.MIN_30]: 30 * 60 * 1000,
    [RotationInterval.HOUR_1]: 60 * 60 * 1000,
    [RotationInterval.DAILY]: 24 * 60 * 60 * 1000
};

export class RotationScheduler {
    constructor() {
        this.state = RotationState.IDLE;
        this.currentInterval = RotationInterval.NEWTAB;
        this.timer = null;
        this.onTick = null;
        this.onStateChange = null;
        this._initialized = false;
    }

    /**
     * Initialize from storage
     */
    async init(onTickCallback) {
        this.onTick = onTickCallback;

        const settings = await Storage.get(['rotationInterval']);
        this.currentInterval = settings.rotationInterval || RotationInterval.NEWTAB;

        // Listen for storage changes
        Storage.onChanged((changes) => {
            if (changes.rotationInterval) {
                this.setInterval(changes.rotationInterval.newValue);
            }
        });

        this.setInterval(this.currentInterval);
        this._initialized = true;
    }

    /**
     * Set rotation interval
     */
    setInterval(interval) {
        if (!INTERVAL_MS.hasOwnProperty(interval)) {
            console.warn(`RotationScheduler: unknown interval ${interval}`);
            return;
        }

        this.currentInterval = interval;
        this._clearTimer();

        const ms = INTERVAL_MS[interval];
        if (ms) {
            this._transitionTo(RotationState.SCHEDULED);
            this.timer = setInterval(() => this._onTimerTick(), ms);
        } else {
            this._transitionTo(RotationState.IDLE);
        }
    }

    /**
     * Manually trigger rotation (for "Next" button)
     */
    async trigger() {
        if (this.state === RotationState.LOADING) return;
        await this._onTimerTick();
    }

    /**
     * Get current state
     */
    getState() {
        return {
            state: this.state,
            interval: this.currentInterval,
            isRotating: this.state === RotationState.SCHEDULED,
            isLoading: this.state === RotationState.LOADING,
            hasError: this.state === RotationState.ERROR
        };
    }

    /**
     * Subscribe to state changes
     */
    subscribe(listener) {
        this.onStateChange = listener;
        listener(this.getState());
        return () => { this.onStateChange = null; };
    }

    _onTimerTick() {
        if (this.state === RotationState.LOADING) return;

        this._transitionTo(RotationState.LOADING);

        try {
            this.onTick?.();
        } catch (error) {
            this._transitionTo(RotationState.ERROR);
            throw error;
        }
    }

    /**
     * Called when wallpaper load completes (success or failure)
     */
    onLoadComplete(success = true) {
        if (success) {
            this._transitionTo(
                this.currentInterval === RotationInterval.NEWTAB ||
                this.currentInterval === RotationInterval.MANUAL
                    ? RotationState.IDLE
                    : RotationState.SCHEDULED
            );
        } else {
            this._transitionTo(RotationState.ERROR);
        }
    }

    _transitionTo(newState) {
        if (this.state === newState) return;
        this.state = newState;
        this.onStateChange?.(this.getState());
    }

    _clearTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    destroy() {
        this._clearTimer();
        this.onTick = null;
        this.onStateChange = null;
    }
}

export default RotationScheduler;