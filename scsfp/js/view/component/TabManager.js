export class TabManager {
    constructor(container, onTabChange = null, options = {}) {
        this.container = container;
        this.onTabChange = onTabChange;

        const wrapperClass = options.wrapperClass || 'tab-content-wrapper';

        // 1. 해당 컨테이너의 직계 버튼 그룹 찾기
        const btnContainer = this.container.querySelector('.tab-buttons');

        // 2. wrapper가 있으면 사용, 없으면 container 자체에서 tab-content 검색
        let contentContainer = this.container.querySelector(`.${wrapperClass}`);
        if (!contentContainer) {
            contentContainer = this.container;
        }

        if (!btnContainer) return;

        // 3. :scope > 를 사용하여 직계 자식만 선택 (중첩 탭 간섭 방지)
        this.tabButtons = btnContainer.querySelectorAll(':scope > .tab-button');

        // wrapper가 있으면 직계 자식, 없으면 container 내 모든 직계 tab-content
        if (contentContainer === this.container) {
            // wrapper 없음: data-tab ID로 매칭되는 요소들을 container 내에서 찾음
            this.tabContents = [];
            this.tabButtons.forEach(btn => {
                const targetId = btn.dataset.tab;
                const content = this.container.querySelector(`#${targetId}`);
                if (content) this.tabContents.push(content);
            });
        } else {
            // wrapper 있음: 기존 방식
            this.tabContents = contentContainer.querySelectorAll(':scope > .tab-content');
        }

        if (this.tabButtons.length === 0) return;

        this.bindEvents();

        // 초기화 시 active 클래스가 있는 탭을 찾아 활성화, 없으면 첫 번째
        const activeBtn = Array.from(this.tabButtons).find(btn => btn.classList.contains('active')) || this.tabButtons[0];
        if (activeBtn) this.activateTab(activeBtn);
    }

    bindEvents() {
        this.tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation(); // 이벤트 전파 방지 (중첩 탭 필수)
                this.activateTab(button);
            });
        });
    }

    activateTab(tabButton) {
        // 현재 매니저 영역 내에서만 active 클래스 토글
        this.tabButtons.forEach(btn => btn.classList.remove('active'));
        this.tabContents.forEach(content => content.classList.remove('active'));

        tabButton.classList.add('active');

        const targetId = tabButton.dataset.tab;
        // ID로 찾되, 현재 매니저의 컨텐츠 목록 안에 있는 것만 유효
        const targetContent = Array.from(this.tabContents).find(el => el.id === targetId);

        if (targetContent) {
            targetContent.classList.add('active');
        }

        if (this.onTabChange) {
            this.onTabChange(targetId);
        }
    }
}
