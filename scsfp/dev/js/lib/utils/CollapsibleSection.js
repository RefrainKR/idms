export class CollapsibleSection {
    constructor() {
        this.toggles = document.querySelectorAll('.section-header .toggle-btn');
        this.bindEvents();
    }

    bindEvents() {
        this.toggles.forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleSection(e.currentTarget));
        });
    }

    toggleSection(btn) {
        const header = btn.closest('.section-header');
        const container = header.parentElement;
        const content = container.querySelector('.section-content');

        if (content.style.display === 'none') {
            // [핵심] 빈 문자열을 할당하여 CSS(style.css)의 설정값을 따르게 함
            // .force-block 클래스가 있으면 block, 없으면 grid가 적용됨
            content.style.display = ''; 
            btn.textContent = '▼';
        } else {
            // 숨기기 (인라인 스타일 display: none 추가)
            content.style.display = 'none';
            btn.textContent = '▲';
        }
    }
}