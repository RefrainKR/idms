export class ToggleButtonElement {
    constructor(elementId, states, onStateChange, initialStateName = null) {
        this.button = document.getElementById(elementId);
        if (!this.button) return;

        this.states = states;
        this.onStateChange = onStateChange;
        this.currentIndex = 0;

        if (initialStateName) {
            const initialIndex = this.states.findIndex(s => s.name === initialStateName);
            if (initialIndex !== -1) this.currentIndex = initialIndex;
        }
        
        this.bindEvents();
        this.updateUI();
    }

    bindEvents() {
        this.button.addEventListener('click', () => this.toggleState());
    }

    toggleState() {
        this.currentIndex = (this.currentIndex + 1) % this.states.length;
        this.updateUI();
    }

    updateUI() {
        const currentState = this.states[this.currentIndex];
        this.button.textContent = currentState.text;

        // 스타일 클래스 적용
        // View Mode 버튼(3개 상태)은 항상 활성 스타일 or 별도 클래스 적용 가능
        // 여기서는 states에 isActive가 true면 active, false면 inactive 적용
        if (currentState.isActive) {
            this.button.classList.add('btn-active');
            this.button.classList.remove('btn-inactive');
        } else {
            this.button.classList.add('btn-inactive');
            this.button.classList.remove('btn-active');
        }

        // View Mode 버튼 특수 처리 (항상 켜져있는 느낌을 원하면)
        if (this.states.length > 2) {
             this.button.classList.remove('btn-inactive');
             this.button.classList.add('btn-active');
             this.button.style.backgroundColor = '#6c757d'; // 뷰 모드는 회색 계열
             this.button.style.borderColor = '#6c757d';
        }

        if (typeof this.onStateChange === 'function') {
            this.onStateChange(currentState.name, currentState);
        }
    }
}