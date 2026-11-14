/**
 * Clock Module - Handles time display, formatting, and updates
 */

import Storage from './storage.js';

const Clock = {
    timer: null,
    showSeconds: true,
    use24Hour: false,
    showClock: true,

    // Initialize clock
    async init() {
        const settings = await Storage.get(['showClock', 'use24Hour']);
        this.showClock = settings.showClock !== false;
        this.use24Hour = settings.use24Hour || false;

        this.updateClock();
        this.startTimer();

        // Listen for settings changes using new EventBus API
        Storage.on('showClock', (newValue) => {
            this.showClock = newValue;
            this.toggleClockDisplay();
        });
        Storage.on('use24Hour', (newValue) => {
            this.use24Hour = newValue;
            this.updateClock();
        });

        return this;
    },

    // Start clock timer
    startTimer() {
        // Clear existing timer
        if (this.timer) {
            clearInterval(this.timer);
        }

        // Update immediately
        this.updateClock();

        // Update every second
        this.timer = setInterval(() => {
            this.updateClock();
        }, 1000);
    },

    // Stop clock timer
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    },

    // Update clock display
    updateClock() {
        if (!this.showClock) return;

        const now = new Date();
        const clockEl = document.getElementById('clock');
        const secondsEl = document.getElementById('clockSeconds');
        const dateEl = document.getElementById('date');
        const greetingEl = document.getElementById('greetingText');
        const digitEls = [
            document.getElementById('clockHourTens'),
            document.getElementById('clockHourOnes'),
            document.getElementById('clockMinuteTens'),
            document.getElementById('clockMinuteOnes')
        ];

        if (!clockEl) return;

        // Format time
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        let meridiem = '';

        if (!this.use24Hour) {
            meridiem = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
        }

        const hourText = hours.toString().padStart(2, '0');
        const timeText = `${hourText}:${minutes}`;
        digitEls.forEach((digitEl, index) => {
            if (digitEl) {
                const digit = `${hourText}${minutes}`[index];
                digitEl.textContent = digit;
                digitEl.dataset.digit = digit;
            }
        });
        clockEl.dateTime = now.toISOString();
        clockEl.setAttribute('aria-label', `${timeText}${meridiem ? ` ${meridiem}` : ''}`);

        // Update seconds
        if (secondsEl) {
            secondsEl.textContent = seconds;
            secondsEl.dateTime = now.toISOString();
        }

        // Update date
        if (dateEl) {
            const options = { weekday: 'short', month: 'short', day: 'numeric' };
            dateEl.textContent = now.toLocaleDateString(undefined, options);
        }

        // Update greeting
        if (greetingEl) {
            const hour = now.getHours();
            let greeting = 'Good evening';
            if (hour < 12) greeting = 'Good morning';
            else if (hour < 17) greeting = 'Good afternoon';
            greetingEl.textContent = greeting;
        }
    },

    // Toggle clock display
    toggleClockDisplay() {
        const container = document.getElementById('clockContainer');
        const dateEl = document.getElementById('date');
        const greetingEl = document.getElementById('greetingText');

        if (container) {
            container.style.display = this.showClock ? '' : 'none';
        }
        if (dateEl) {
            dateEl.style.display = this.showClock ? 'block' : 'none';
        }
        if (greetingEl) {
            greetingEl.style.display = this.showClock ? 'block' : 'none';
        }
    },

    // Set 24 hour format
    async set24Hour(use24Hour) {
        this.use24Hour = use24Hour;
        await Storage.setValue('use24Hour', use24Hour);
        this.updateClock();
    },

    // Set show clock
    async setShowClock(show) {
        this.showClock = show;
        await Storage.setValue('showClock', show);
        this.toggleClockDisplay();
        if (show) this.updateClock();
    }
};

export default Clock;