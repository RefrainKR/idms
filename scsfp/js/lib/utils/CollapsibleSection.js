export class CollapsibleSection {
    constructor() {
        this.bindGlobalEvents();
    }

    bindGlobalEvents() {
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('.toggle-btn');
            // 헤더 영역을 클릭해도 토글되도록 처리
            const header = e.target.closest('.section-header');

            if (btn || (header && header.querySelector('.toggle-btn'))) {
                const targetHeader = header || btn.closest('.section-header');
                this.toggleSection(targetHeader);
            }
        });
    }

    toggleSection(header) {
        const container = header.parentElement;
        const content = container.querySelector('.section-content');
        const btn = header.querySelector('.toggle-btn');

        if (!content || !btn) return;

        // 현재 상태 확인
        // style.display가 설정되어 있지 않으면('') computedStyle을 확인
        const currentStyle = content.style.display;
        const computedStyle = window.getComputedStyle(content).display;
        
        const isHidden = currentStyle === 'none' || (currentStyle === '' && computedStyle === 'none');

        if (isHidden) {
            // [핵심 수정] 'block'이 아니라 ''(빈 값)을 주어 CSS(style.css)의 grid/block 설정을 따르게 함
            content.style.display = ''; 
            btn.textContent = '▼';
        } else {
            content.style.display = 'none';
            btn.textContent = '▲';
        }
    }
}