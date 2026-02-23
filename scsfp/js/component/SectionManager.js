/**
 * SectionManager.js
 * 메인 섹션 전환을 관리하는 클래스
 *
 * 역할:
 * - 사이드바 버튼 클릭 이벤트 처리
 * - 섹션 간 전환 (가챠 계산 ↔ 과금 효율)
 * - 브라우저 히스토리 관리 (옵션)
 */

export class SectionManager {
    constructor() {
        this.currentSection = 'gacha';
        this.sections = {
            gacha: document.getElementById('gacha-section'),
            payment: document.getElementById('payment-section') // 향후 추가 예정
        };
        this.sidebarButtons = {};

        this.initNavigation();
        this.initHistoryManagement();
    }

    /**
     * 사이드바 네비게이션 초기화
     */
    initNavigation() {
        const buttons = document.querySelectorAll('.sidebar-item');

        buttons.forEach(btn => {
            const sectionName = btn.dataset.section;
            this.sidebarButtons[sectionName] = btn;

            btn.addEventListener('click', () => {
                this.switchSection(sectionName);
            });
        });
    }

    /**
     * 브라우저 히스토리 관리 초기화
     */
    initHistoryManagement() {
        // 페이지 로드 시 URL 해시 확인
        const hash = window.location.hash.slice(1); // '#gacha' → 'gacha'
        if (hash && this.sections[hash]) {
            this.switchSection(hash, false); // 히스토리 추가 안 함
        }

        // 브라우저 뒤로가기/앞으로가기 처리
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.section) {
                this.switchSection(e.state.section, false);
            }
        });
    }

    /**
     * 섹션 전환
     * @param {string} sectionName - 전환할 섹션 이름 ('gacha' | 'payment')
     * @param {boolean} pushHistory - 히스토리에 추가할지 여부 (기본값: true)
     */
    switchSection(sectionName, pushHistory = true) {
        // 유효성 검사
        if (!this.sections[sectionName]) {
            console.error(`[SectionManager] 존재하지 않는 섹션: ${sectionName}`);
            return;
        }

        // 동일 섹션이면 무시
        if (this.currentSection === sectionName) {
            return;
        }

        // 이전 섹션 숨기기
        const prevSection = this.sections[this.currentSection];
        const prevButton = this.sidebarButtons[this.currentSection];

        if (prevSection) {
            prevSection.classList.remove('active');
        }
        if (prevButton) {
            prevButton.classList.remove('active');
        }

        // 새 섹션 보이기
        const newSection = this.sections[sectionName];
        const newButton = this.sidebarButtons[sectionName];

        if (newSection) {
            newSection.classList.add('active');
        }
        if (newButton) {
            newButton.classList.add('active');
        }

        // 현재 섹션 업데이트
        this.currentSection = sectionName;

        // 브라우저 히스토리 관리
        if (pushHistory) {
            history.pushState(
                { section: sectionName },
                '',
                `#${sectionName}`
            );
        }

        // 섹션 전환 이벤트 발생 (향후 확장용)
        this.onSectionChange(sectionName);
    }

    /**
     * 섹션 전환 시 호출되는 콜백 (확장 포인트)
     * @param {string} sectionName - 전환된 섹션 이름
     */
    onSectionChange(sectionName) {
        // 향후 섹션별 추가 로직 실행 가능
        // 예: 과금 효율 섹션 진입 시 데이터 로드
        console.log(`[SectionManager] 섹션 전환: ${sectionName}`);
    }

    /**
     * 현재 활성화된 섹션 이름 반환
     * @returns {string}
     */
    getCurrentSection() {
        return this.currentSection;
    }
}
