
export class TabManager {
    /**
     * @param {HTMLElement} container - 탭 시스템을 포함하는 부모 요소.
     * @param {Function} [onTabChange=null] - 탭이 변경될 때 호출될 콜백 함수.
     */
    constructor(container, onTabChange = null) {
        this.container = container;
        this.onTabChange = onTabChange;
        
        // --- 핵심: 이제 container 내부에서만 요소를 찾음 ---
        this.tabButtons = this.container.querySelectorAll('.tab-buttons .tab-button');
        this.tabContents = this.container.querySelectorAll('.tab-content-wrapper .tab-content');

        if (this.tabButtons.length === 0) return;

        this.bindEvents();
        this.activateDefaultTab();
    }

    bindEvents() {
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => this.activateTab(button));
        });
    }

    activateTab(tabButton) {
        this.tabButtons.forEach(btn => btn.classList.remove('active'));
        this.tabContents.forEach(content => content.classList.remove('active'));

        tabButton.classList.add('active');
        const targetContent = this.container.querySelector(`#${tabButton.dataset.tab}`);
        if (targetContent) {
            targetContent.classList.add('active');
        }

        if (this.onTabChange) {
            this.onTabChange(tabButton.dataset.tab);
        }
    }

    activateDefaultTab() {
        const initialActiveButton = this.container.querySelector('.tab-buttons .tab-button.active') || this.tabButtons[0];
        if (initialActiveButton) {
            this.activateTab(initialActiveButton);
        }
    }
}