import { Star3Module } from './modules/Star3Module.js';
import { Star2Module } from './modules/Star2Module.js';
import { TabManager } from './lib/utils/TabManager.js';
import { ToggleButtonElement } from './lib/utils/ToggleButtonElement.js'; // 추가됨
import { CollapsibleSection } from './lib/utils/CollapsibleSection.js'; // 추가됨
import { TOGGLE_STATES } from './config.js'; // 추가됨
import { VIEW_MODE, CEILING_MODE, RANDOM_MODE, STEP4_MODE } from './state.js'; // 추가됨

// Chart.js 플러그인 등록
Chart.register(ChartDataLabels);

window.onload = function() {
    // 1. 모듈 인스턴스 생성
    const star3 = new Star3Module();
    const star2 = new Star2Module();

    star3.init();
    star2.init();

    // 2. 공통 UI 유틸리티 초기화
    new CollapsibleSection();

    // 3. 메인 탭 시스템 초기화
    const mainTabManager = new TabManager(document.getElementById('main-tab-system'), (tabId) => {
        // 탭이 바뀔 때마다 해당 모듈의 UI를 강제로 다시 그림
        if (tabId === 'tab-3star') star3.renderUI();
        else if (tabId === 'tab-2star') star2.renderUI();
    });

    // 4. 서브 탭 시스템 초기화 (결과 보기 탭)
    new TabManager(document.getElementById('sub-tab-system-3star'), () => star3.renderUI());
    new TabManager(document.getElementById('sub-tab-system-2star'), () => star2.renderUI());

    // 5. 3성 토글 버튼들 연결
    new ToggleButtonElement('toggleCeilingBtn3', TOGGLE_STATES.CEILING, (name) => {
        CEILING_MODE.star3 = name;
        star3.calculate();
    });
    new ToggleButtonElement('toggleRandomBtn3', TOGGLE_STATES.RANDOM, (name) => {
        RANDOM_MODE.star3 = name;
        star3.calculate();
    });
    new ToggleButtonElement('toggleStep4Btn3', TOGGLE_STATES.STEP4, (name) => {
        STEP4_MODE.star3 = name;
        star3.calculate();
    });
    new ToggleButtonElement('toggleViewBtn3', TOGGLE_STATES.VIEW, (name) => {
        VIEW_MODE.star3 = name;
        star3.renderUI();
    });

    // 6. 2성 토글 버튼들 연결
    new ToggleButtonElement('toggleCeilingBtn2', TOGGLE_STATES.CEILING, (name) => {
        CEILING_MODE.star2 = name;
        star2.calculate();
    });
    new ToggleButtonElement('toggleViewBtn2', TOGGLE_STATES.VIEW, (name) => {
        VIEW_MODE.star2 = name;
        star2.renderUI();
    });

    // 7. 리셋 버튼 이벤트 연결
    document.getElementById('resetBtn3')?.addEventListener('click', () => star3.reset());
    document.getElementById('resetBtn2')?.addEventListener('click', () => star2.reset());

    // 8. 마지막 확인: 현재 활성화된 탭의 UI를 다시 한 번 호출하여 초기 화면을 확정함
    const currentMainTab = document.querySelector('.tab-button.active')?.dataset.tab;
    if (currentMainTab === 'tab-3star') star3.renderUI();
    else if (currentMainTab === 'tab-2star') star2.renderUI();
};