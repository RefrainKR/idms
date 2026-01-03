export class CollapsibleSection {
    constructor() {
        this.bindGlobalEvents();
    }

    bindGlobalEvents() {
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('.toggle-btn');
            // 헤더 전체 클릭 허용을 위해
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

        const currentDisplay = window.getComputedStyle(content).display;
        
        // 현재 숨겨져 있다면 -> 펼치기
        if (content.style.display === 'none' || currentDisplay === 'none') {
            content.style.display = 'block'; // force-block 클래스 등 고려
            btn.textContent = '▼'; // 펼쳐졌음을 표시
        } 
        // 현재 보인다면 -> 접기
        else {
            content.style.display = 'none';
            btn.textContent = '▲'; // 접혔음을 표시
        }
    }
}