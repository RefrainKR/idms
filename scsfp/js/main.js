import { TabManager } from './lib/utils/TabManager.js';
import { ToggleButtonElement } from './lib/utils/ToggleButtonElement.js';
import { CollapsibleSection } from './lib/utils/CollapsibleSection.js';
import { appState, VIEW_MODE, CEILING_MODE, RANDOM_MODE, STEP4_MODE } from './state.js';
import { TOGGLE_STATES_VIEW, TOGGLE_STATES_CEILING, TOGGLE_STATES_RANDOM, TOGGLE_STATES_STEP4 } from './config.js';
import * as Star3 from './modules/star3.js';
import * as Star2 from './modules/star2.js';

// 차트 플러그인 등록
Chart.register(ChartDataLabels);

window.onload = function() {
    appState.isInitializing = true; 

    // 1. 메인 탭 초기화
    const mainTabContainer = document.getElementById('main-tab-system');
    new TabManager(mainTabContainer);

    // 2. 3성 결과 서브 탭 초기화 및 콜백
    const subTab3Star = document.getElementById('sub-tab-system-3star');
    if (subTab3Star) {
        new TabManager(subTab3Star, () => {
            Star3.render3StarUI();
        });
    }

    // 3. [추가] 2성 결과 서브 탭 초기화 및 콜백
    const subTab2Star = document.getElementById('sub-tab-system-2star');
    if (subTab2Star) {
        new TabManager(subTab2Star, () => {
            Star2.render2StarUI();
        });
    }

    // 4. 토글 섹션 기능 초기화
    new CollapsibleSection();

    // --- 3성 버튼 이벤트 바인딩 (Star3 네임스페이스 추가) ---
    const reset3 = document.getElementById('resetBtn3');
    if (reset3) reset3.addEventListener('click', Star3.reset3Star);
    
    const presetGen = document.getElementById('presetGeneralBtn');
    if (presetGen) presetGen.addEventListener('click', Star3.applyGeneralPreset);
    
    const presetPJ = document.getElementById('presetPJBtn');
    if (presetPJ) presetPJ.addEventListener('click', Star3.applyPJPreset);

    // --- 2성 버튼 이벤트 바인딩 (Star2 네임스페이스 추가) ---
    const reset2 = document.getElementById('resetBtn2');
    if (reset2) reset2.addEventListener('click', Star2.reset2Star);

    // --- 3성 토글 버튼 설정 (오류 수정: Star3. 함수명 호출) ---
    new ToggleButtonElement('toggleCeilingBtn3', TOGGLE_STATES_CEILING, (name) => {
        CEILING_MODE.star3 = name; 
        Star3.calculate3Star(); // 모듈명 추가
    });
    new ToggleButtonElement('toggleRandomBtn3', TOGGLE_STATES_RANDOM, (name) => {
        RANDOM_MODE.star3 = name; 
        Star3.calculate3Star(); // 모듈명 추가
    });
    new ToggleButtonElement('toggleStep4Btn3', TOGGLE_STATES_STEP4, (name) => {
        STEP4_MODE.star3 = name; 
        Star3.calculate3Star(); // 모듈명 추가
    });
    new ToggleButtonElement('toggleViewBtn3', TOGGLE_STATES_VIEW, (name) => {
        VIEW_MODE.star3 = name;
        Star3.render3StarUI(); // 모드 변경은 렌더링만 다시
    });

    // --- 2성 토글 버튼 설정 (오류 수정: Star2. 함수명 호출) ---
    new ToggleButtonElement('toggleCeilingBtn2', TOGGLE_STATES_CEILING, (name) => {
        CEILING_MODE.star2 = name; 
        Star2.calculate2Star(); // 모듈명 추가
    });
    new ToggleButtonElement('toggleRandomBtn2', TOGGLE_STATES_RANDOM, (name) => {
        RANDOM_MODE.star2 = name; 
        Star2.calculate2Star(); // 모듈명 추가
    });
    new ToggleButtonElement('toggleStep4Btn2', TOGGLE_STATES_STEP4, (name) => {
        STEP4_MODE.star2 = name; 
        Star2.calculate2Star(); // 모듈명 추가
    });
    new ToggleButtonElement('toggleViewBtn2', TOGGLE_STATES_VIEW, (name) => {
        VIEW_MODE.star2 = name;
        Star2.render2StarUI(); // 모드 변경은 렌더링만 다시
    });

    // --- 데이터 초기화 및 최초 계산 실행 ---
    Star3.init3StarInputs();
    Star2.init2StarInputs();

    appState.isInitializing = false; 
};