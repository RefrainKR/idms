import { TabManager } from './lib/utils/TabManager.js';
import { ToggleButtonElement } from './lib/utils/ToggleButtonElement.js';
import { CollapsibleSection } from './lib/utils/CollapsibleSection.js';
import { appState, VIEW_MODE, CEILING_MODE } from './state.js';
import { TOGGLE_STATES_VIEW, TOGGLE_STATES_CEILING } from './config.js';
import * as Star3 from './modules/star3.js';
import * as Star2 from './modules/star2.js';

Chart.register(ChartDataLabels);

window.onload = function() {
    appState.isInitializing = true; 

    // 1. 메인 탭 초기화
    const mainTabContainer = document.getElementById('main-tab-system');
    new TabManager(mainTabContainer);

    // 2. [중요] 3성 결과 서브 탭 초기화
    const subTab3Star = document.getElementById('sub-tab-system-3star');
    if (subTab3Star) {
        new TabManager(subTab3Star);
    }

    // 3. 토글 섹션 기능 초기화 (전역 위임 방식)
    new CollapsibleSection();


    // --- 버튼 이벤트 바인딩 ---
    const reset3 = document.getElementById('resetBtn3');
    if (reset3) reset3.addEventListener('click', Star3.reset3Star);
    
    const presetGen = document.getElementById('presetGeneralBtn');
    if (presetGen) presetGen.addEventListener('click', Star3.applyGeneralPreset);
    
    const presetPJ = document.getElementById('presetPJBtn');
    if (presetPJ) presetPJ.addEventListener('click', Star3.applyPJPreset);

    const reset2 = document.getElementById('resetBtn2');
    if (reset2) reset2.addEventListener('click', Star2.reset2Star);

    // --- 토글 버튼 설정 ---
    new ToggleButtonElement('toggleViewBtn3', TOGGLE_STATES_VIEW, (name) => {
        VIEW_MODE.star3 = name;
        Star3.render3StarUI();
    });
    new ToggleButtonElement('toggleCeilingBtn3', TOGGLE_STATES_CEILING, (name) => {
        CEILING_MODE.star3 = name;
        Star3.calculate3Star();
    });

    new ToggleButtonElement('toggleViewBtn2', TOGGLE_STATES_VIEW, (name) => {
        VIEW_MODE.star2 = name;
        Star2.render2StarUI();
    });
    new ToggleButtonElement('toggleCeilingBtn2', TOGGLE_STATES_CEILING, (name) => {
        CEILING_MODE.star2 = name;
        Star2.calculate2Star();
    });

    // --- 데이터 초기화 및 계산 ---
    Star3.init3StarInputs();
    Star2.init2StarInputs();

    appState.isInitializing = false; 
};