export class CollapsibleSection {
    constructor() {
        this.bindGlobalEvents();
    }

    bindGlobalEvents() {
        document.body.addEventListener('click', (e) => {
            // [수정] 오직 toggle-btn 클래스를 가진 요소(또는 그 자식)를 클릭했을 때만 작동
            const btn = e.target.closest('.toggle-btn');

            if (btn) {
                const header = btn.closest('.section-header');
                if (header) {
                    this.toggleSection(header);
                }
            }
        });
    }

    toggleSection(header) {
        const container = header.parentElement;
        const content = container.querySelector('.section-content');
        const btn = header.querySelector('.toggle-btn');

        if (!content || !btn) return;

        const currentStyle = content.style.display;
        const computedStyle = window.getComputedStyle(content).display;
        const isHidden = currentStyle === 'none' || (currentStyle === '' && computedStyle === 'none');

        if (isHidden) {
            // 펼치기: 빈 값을 주어 CSS 설정을 따름 (Grid/Block 유지)
            content.style.display = ''; 
            btn.textContent = '▼';
        } else {
            // 접기
            content.style.display = 'none';
            btn.textContent = '▲';
        }
    }
}