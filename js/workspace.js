/**
 * Workspace - Provides quick access to Google Workspace sites
 */

const Workspace = {
    button: null,
    dropdown: null,
    isOpen: false,

    init() {
        this.button = document.getElementById('workspaceBtn');
        this.dropdown = document.getElementById('workspaceDropdown');

        if (!this.button || !this.dropdown) return this;

        this.button.addEventListener('click', (event) => {
            event.stopPropagation();
            this.toggle();
        });

        this.dropdown.addEventListener('click', (event) => {
            if (event.target.closest('a')) this.close();
        });

        document.addEventListener('click', (event) => {
            if (!this.button.contains(event.target) && !this.dropdown.contains(event.target)) {
                this.close();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.isOpen) {
                this.close();
                this.button.focus();
            }
        });

        this.syncAria();
        return this;
    },

    open() {
        if (this.isOpen) return;
        this.dropdown.classList.add('open');
        this.isOpen = true;
        this.syncAria();
    },

    close() {
        if (!this.isOpen) return;
        this.dropdown.classList.remove('open');
        this.isOpen = false;
        this.syncAria();
    },

    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    },

    syncAria() {
        this.button.setAttribute('aria-expanded', String(this.isOpen));
    }
};

export default Workspace;
