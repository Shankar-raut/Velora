/**
 * Dropdown - Reusable accessible dropdown component
 * Replaces duplicated logic in theme-engine.js and search.js
 */

export class Dropdown {
    /**
     * @param {Object} options
     * @param {string} options.triggerSelector - CSS selector for trigger button
     * @param {string} options.dropdownSelector - CSS selector for dropdown element
     * @param {Array<Object>} options.options - [{ value, label, selected?, icon? }]
     * @param {Function} options.onSelect - Callback when option selected
     * @param {Object} options.renderOption - Custom render function (optional)
     * @param {string} options.placement - 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
     */
    constructor({ triggerSelector, dropdownSelector, options = [], onSelect, renderOption, placement = 'bottom-start' }) {
        this.trigger = document.querySelector(triggerSelector);
        this.dropdown = document.querySelector(dropdownSelector);
        this.options = options;
        this.onSelect = onSelect;
        this.renderOption = renderOption;
        this.placement = placement;
        this.isOpen = false;
        this.focusedIndex = -1;

        if (!this.trigger || !this.dropdown) {
            console.warn('Dropdown: trigger or dropdown not found', { triggerSelector, dropdownSelector });
            return;
        }

        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
        this.syncAria();
    }

    render() {
        if (this.renderOption) {
            this.dropdown.innerHTML = this.options.map((opt, i) => this.renderOption(opt, i)).join('');
        } else {
            this.dropdown.innerHTML = this.options.map((opt, i) => `
                <button type="button"
                    class="dropdown-option${opt.selected ? ' active' : ''}"
                    data-value="${opt.value}"
                    role="option"
                    aria-selected="${opt.selected || false}"
                    tabindex="-1">
                    ${opt.icon ? `<img src="${opt.icon}" alt="" class="dropdown-option-icon">` : ''}
                    <span class="dropdown-option-label">${opt.label}</span>
                </button>
            `).join('');
        }
    }

    bindEvents() {
        // Trigger click
        this.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        // Outside click
        document.addEventListener('click', (e) => {
            if (!this.trigger.contains(e.target) && !this.dropdown.contains(e.target)) {
                this.close();
            }
        });

        // Option click (delegated)
        this.dropdown.addEventListener('click', (e) => {
            const option = e.target.closest('[role="option"]');
            if (option && this.dropdown.contains(option)) {
                const value = option.dataset.value;
                this.select(value);
            }
        });

        // Trigger keyboard
        this.trigger.addEventListener('keydown', (e) => this.handleTriggerKeydown(e));

        // Dropdown keyboard
        this.dropdown.addEventListener('keydown', (e) => this.handleDropdownKeydown(e));
    }

    handleTriggerKeydown(e) {
        if (e.key === 'Escape') {
            this.close();
            this.trigger.focus();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.open();
            this.focusFirst();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.open();
            this.focusLast();
        }
    }

    handleDropdownKeydown(e) {
        const options = this.getOptions();

        if (e.key === 'Escape') {
            this.close();
            this.trigger.focus();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.focusNext();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.focusPrev();
        } else if (e.key === 'Home') {
            e.preventDefault();
            this.focusFirst();
        } else if (e.key === 'End') {
            e.preventDefault();
            this.focusLast();
        } else if (e.key === 'Enter' || e.key === ' ') {
            const active = this.dropdown.querySelector('[role="option"]:focus');
            if (active) {
                e.preventDefault();
                active.click();
            }
        } else if (e.key === 'Tab') {
            this.close();
        }
    }

    getOptions() {
        return Array.from(this.dropdown.querySelectorAll('[role="option"]'));
    }

    focusFirst() {
        const options = this.getOptions();
        if (options.length) {
            options[0].focus();
            this.focusedIndex = 0;
        }
    }

    focusLast() {
        const options = this.getOptions();
        if (options.length) {
            options[options.length - 1].focus();
            this.focusedIndex = options.length - 1;
        }
    }

    focusNext() {
        const options = this.getOptions();
        if (!options.length) return;
        this.focusedIndex = (this.focusedIndex + 1) % options.length;
        options[this.focusedIndex].focus();
    }

    focusPrev() {
        const options = this.getOptions();
        if (!options.length) return;
        this.focusedIndex = (this.focusedIndex - 1 + options.length) % options.length;
        options[this.focusedIndex].focus();
    }

    open() {
        if (this.isOpen) return;
        this.dropdown.classList.add('open');
        this.isOpen = true;
        this.syncAria();
    }

    close() {
        if (!this.isOpen) return;
        this.dropdown.classList.remove('open');
        this.isOpen = false;
        this.focusedIndex = -1;
        this.syncAria();
    }

    toggle() {
        if (this.isOpen) this.close(); else this.open();
    }

    select(value) {
        const option = this.options.find(o => o.value === value);
        if (!option) return;

        // Update internal state
        this.options.forEach(o => o.selected = o.value === value);
        this.render();
        this.syncAria();

        // Callback
        if (this.onSelect) {
            this.onSelect(option);
        }

        this.close();
    }

    setOptions(newOptions) {
        this.options = newOptions;
        this.render();
        this.syncAria();
    }

    syncAria() {
        this.trigger.setAttribute('aria-expanded', this.isOpen);
        const options = this.dropdown.querySelectorAll('[role="option"]');
        options.forEach(opt => {
            const value = opt.dataset.value;
            const selected = this.options.find(o => o.value === value)?.selected;
            opt.setAttribute('aria-selected', selected || false);
            opt.classList.toggle('active', !!selected);
        });
    }

    destroy() {
        // Clean up would go here if needed
    }
}

/**
 * Factory for common dropdown patterns
 */
export const DropdownFactory = {
    /**
     * Create theme selector dropdown
     */
    createThemeSelector(triggerSelector, dropdownSelector, currentTheme, onThemeChange) {
        const themes = [
            { value: 'dark', label: 'Dark', icon: null },
            { value: 'light', label: 'Light', icon: null },
            { value: 'auto', label: 'Auto', icon: null },
            { value: 'rose', label: 'Rose', icon: null },
            { value: 'ocean', label: 'Ocean', icon: null },
            { value: 'forest', label: 'Forest', icon: null },
            { value: 'violet', label: 'Violet', icon: null },
            { value: 'amber', label: 'Amber', icon: null },
        ].map(t => ({ ...t, selected: t.value === currentTheme }));

        return new Dropdown({
            triggerSelector,
            dropdownSelector,
            options: themes,
            onSelect: (opt) => onThemeChange(opt.value),
            renderOption: (opt) => `
                <button type="button"
                    class="theme-option${opt.selected ? ' active' : ''}"
                    data-value="${opt.value}"
                    data-theme="${opt.value}"
                    role="option"
                    aria-selected="${opt.selected}"
                    tabindex="-1">
                    <span class="theme-preview ${opt.value}"></span>
                    <span class="theme-name">${opt.label}</span>
                </button>
            `
        });
    },

    /**
     * Create search engine dropdown
     */
    createEngineSelector(triggerSelector, dropdownSelector, engines, currentEngine, onEngineChange) {
        const options = Object.entries(engines).map(([key, engine]) => ({
            value: key,
            label: engine.name,
            icon: engine.icon,
            selected: key === currentEngine
        }));

        return new Dropdown({
            triggerSelector,
            dropdownSelector,
            options,
            onSelect: (opt) => onEngineChange(opt.value),
            renderOption: (opt) => `
                <button type="button"
                    class="engine-option${opt.selected ? ' active' : ''}"
                    data-value="${opt.value}"
                    data-engine="${opt.value}"
                    role="option"
                    aria-selected="${opt.selected}"
                    tabindex="-1">
                    ${opt.icon ? `<img src="${opt.icon}" alt="" class="engine-icon">` : ''}
                    <span class="engine-name">${opt.label}</span>
                </button>
            `
        });
    }
};

export default Dropdown;