
export class ToggleButtonElement {
    /**
     * @param {string} elementId - 제어할 버튼 요소의 ID.
     * @param {Array<Object>} states - 순환할 상태들의 배열.
     *   - 각 객체는 { name: string, text: string } 형태여야 합니다.
     *   - name: 상태를 식별하는 고유한 이름 (예: 'highest', 'difference').
     *   - text: 해당 상태일 때 버튼에 표시될 텍스트 (예: '높은 값', '차이 값').
     * @param {Function} onStateChange - 상태가 변경될 때마다 호출될 콜백 함수.
     *   - (새로운 상태의 name, 해당 상태 객체 전체)를 인자로 전달합니다.
     * @param {string} [initialStateName=states[0].name] - 초기 상태의 이름. 지정하지 않으면 첫 번째 상태로 시작합니다.
     */
    constructor(elementId, states, onStateChange, initialStateName = null) {
        this.button = document.getElementById(elementId);
        if (!this.button) {
            console.error(`ToggleButtonElement: Element with ID '${elementId}' not found.`);
            return;
        }

        if (!Array.isArray(states) || states.length === 0) {
            console.error("ToggleButtonElement: 'states' array must be a non-empty array.");
            return;
        }

        this.states = states;
        this.onStateChange = onStateChange;
        this.currentIndex = 0;

        // 초기 상태 설정
        if (initialStateName) {
            const initialIndex = this.states.findIndex(s => s.name === initialStateName);
            if (initialIndex !== -1) {
                this.currentIndex = initialIndex;
            }
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

        if (typeof this.onStateChange === 'function') {
            this.onStateChange(currentState.name, currentState);
        }
    }

    /**
     * 외부에서 현재 상태의 이름을 가져올 수 있는 getter.
     * @returns {string}
     */
    get currentStateName() {
        return this.states[this.currentIndex].name;
    }
}