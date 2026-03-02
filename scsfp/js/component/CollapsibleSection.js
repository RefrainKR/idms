/**
 * CollapsibleSection.js
 * 접을 수 있는 섹션 컴포넌트 관리
 *
 * 사용법:
 * <div class="collapsible-container" data-collapsible="true">
 *   <div class="section-header">
 *     <h3 class="section-title">제목</h3>
 *     <button class="toggle-btn" data-toggle-section>▼</button>
 *   </div>
 *   <div class="section-content">내용</div>
 * </div>
 */
export class CollapsibleSection {
    constructor() {
        this.initAllSections();
        this.bindGlobalEvents();
    }

    /**
     * 모든 collapsible 섹션 초기화
     */
    initAllSections() {
        const containers = document.querySelectorAll('[data-collapsible]');

        containers.forEach(container => {
            const btn = container.querySelector('[data-toggle-section]');
            const content = container.querySelector('.section-content');

            if (btn && content) {
                // 초기 상태 설정 (기본: 펼쳐진 상태)
                if (!container.dataset.collapsed) {
                    container.dataset.collapsed = 'false';
                }

                // 초기 버튼 텍스트 설정
                this.updateButtonText(btn, container.dataset.collapsed === 'true');

                // 초기 content 표시 상태 설정
                if (container.dataset.collapsed === 'true') {
                    content.style.display = 'none';
                }
            }
        });
    }

    /**
     * 전역 클릭 이벤트 바인딩 (이벤트 위임)
     */
    bindGlobalEvents() {
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-toggle-section]');

            if (btn) {
                const container = btn.closest('[data-collapsible]');
                if (container) {
                    this.toggleSection(container);
                }
            }
        });
    }

    /**
     * 섹션 토글
     * @param {HTMLElement} container - collapsible-container 요소
     */
    toggleSection(container) {
        const content = container.querySelector('.section-content');
        const btn = container.querySelector('[data-toggle-section]');

        if (!content || !btn) return;

        const isCollapsed = container.dataset.collapsed === 'true';

        if (isCollapsed) {
            // 펼치기
            content.style.display = '';
            container.dataset.collapsed = 'false';
            this.updateButtonText(btn, false);
        } else {
            // 접기
            content.style.display = 'none';
            container.dataset.collapsed = 'true';
            this.updateButtonText(btn, true);
        }
    }

    /**
     * 버튼 텍스트 업데이트
     * @param {HTMLElement} btn - 토글 버튼
     * @param {boolean} isCollapsed - 접힌 상태 여부
     */
    updateButtonText(btn, isCollapsed) {
        btn.textContent = isCollapsed ? '▲' : '▼';
    }

    /**
     * 동적으로 삽입된 콘텐츠에 대해 단일 섹션 초기화
     * innerHTML 교체 후 호출하여 data-collapsed 상태를 새 DOM에 적용한다.
     * data-collapsed가 없으면 기본값 'false' (펼쳐진 상태).
     * @param {HTMLElement} container - [data-collapsible] 요소
     */
    static initSection(container) {
        if (!container) return;
        const btn = container.querySelector('[data-toggle-section]');
        const content = container.querySelector('.section-content');
        if (!btn || !content) return;

        if (!container.dataset.collapsed) {
            container.dataset.collapsed = 'false';
        }

        const isCollapsed = container.dataset.collapsed === 'true';
        btn.textContent = isCollapsed ? '▲' : '▼';
        content.style.display = isCollapsed ? 'none' : '';
    }
}
