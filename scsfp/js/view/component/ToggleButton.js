export class ToggleButton {
    constructor(elementId, states, onStateChange, initialStateName = null) {
        this.button = document.getElementById(elementId);
        if (!this.button) return;

        this.states = states;
        this.onStateChange = onStateChange;
        this.currentIndex = 0;

        if (initialStateName) {
            const idx = this.states.findIndex(s => s.name === initialStateName);
            if (idx !== -1) this.currentIndex = idx;
        }
        
        this.button.addEventListener('click', () => this.toggle());
        this.updateUI();
    }

    toggle() {
        this.currentIndex = (this.currentIndex + 1) % this.states.length;
        const currentState = this.states[this.currentIndex];
        this.updateUI();
        if (this.onStateChange) this.onStateChange(currentState);
    }

    updateUI() {
        const state = this.states[this.currentIndex];
        this.button.textContent = state.text;

        this.button.dataset.state = state.name;
    }

    setState(stateName) {
        const idx = this.states.findIndex(s => s.name === stateName);
        if (idx !== -1) {
            this.currentIndex = idx;
            this.updateUI();
        }
    }
}