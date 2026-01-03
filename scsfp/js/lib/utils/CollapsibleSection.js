export class CollapsibleSection {
    constructor() {
        // 특정 요소가 아닌 document 전체에 이벤트를 등록하여
        // 동적으로 생성되는 요소(상세 계산 근거)와 정적 요소(입력창) 모두 처리
        this.bindGlobalEvents();
    }

    bindGlobalEvents() {
        document.body.addEventListener('click', (e) => {
            // 클릭된 요소가 toggle-btn인지 확인
            if (e.target && e.target.classList.contains('toggle-btn')) {
                this.toggleSection(e.target);
            }
        });
    }

    toggleSection(btn) {
        const header = btn.closest('.section-header');
        if (!header) return;

        const container = header.parentElement;
        const content = container.querySelector('.section-content');
        if (!content) return;

        // 현재 display 상태 확인 (getComputedStyle 사용으로 확실하게 체크)
        const currentDisplay = window.getComputedStyle(content).display;

        if (currentDisplay === 'none') {
            // 펼치기: 빈 값을 주어 CSS 정의(block or grid)를 따르게 함
            content.style.display = ''; 
            btn.textContent = '▼';
        } else {
            // 접기
            content.style.display = 'none';
            btn.textContent = '▲';
        }
    }
}