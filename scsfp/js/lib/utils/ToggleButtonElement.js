export class ToggleButtonElement {
    /**
     * @param {string} elementId - 버튼 ID
     * @param {Array} states - 상태 목록 [{name, text, isActive, style?}]
     * @param {Function} onStateChange - 상태 변경 시 콜백
     * @param {string} initialStateName - 초기 상태 이름 (옵션)
     */
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

        // 1. 기본 활성/비활성 클래스 처리
        if (currentState.isActive) {
            this.button.classList.add('btn-active');
            this.button.classList.remove('btn-inactive');
        } else {
            this.button.classList.add('btn-inactive');
            this.button.classList.remove('btn-active');
        }

        // 2. View Mode 버튼 특수 처리 (기존 로직 유지)
        if (this.states.length > 2) {
             this.button.classList.remove('btn-inactive');
             this.button.classList.add('btn-active');
             this.button.style.backgroundColor = '#6c757d'; 
             this.button.style.borderColor = '#6c757d';
             this.button.style.color = '#fff';
        }

        // 3. [신규] 상태별 커스텀 스타일 적용 (Worst 모드 등)
        if (currentState.style) {
            Object.assign(this.button.style, currentState.style);
        } else {
            // 커스텀 스타일이 없으면 인라인 스타일 초기화 (기존 클래스 스타일 복귀)
            // 단, View Mode 등 예외 케이스가 있으므로 필요한 속성만 초기화하거나 조심스럽게 접근
            if (this.states.length <= 2) {
                this.button.style.color = '';
                this.button.style.borderColor = '';
                this.button.style.backgroundColor = '';
            }
        }

        // 콜백 실행
        if (typeof this.onStateChange === 'function') {
            this.onStateChange(currentState.name, currentState);
        }
    }
}