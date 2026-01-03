import { TabManager } from './lib/utils/TabManager.js';
import { ToggleButtonElement } from './lib/utils/ToggleButtonElement.js';
import { CollapsibleSection } from './lib/utils/CollapsibleSection.js';
import { appState, VIEW_MODE, CEILING_MODE, RANDOM_MODE, STEP4_MODE } from './state.js';
import { TOGGLE_STATES_VIEW, TOGGLE_STATES_CEILING, TOGGLE_STATES_RANDOM, TOGGLE_STATES_STEP4 } from './config.js';
import * as Star3 from './modules/star3.js';
import * as Star2 from './modules/star2.js';

Chart.register(ChartDataLabels);

window.onload = function() {
    appState.isInitializing = true; 

    // 1. 탭 초기화
    const mainTabContainer = document.getElementById('main-tab-system');
    new TabManager(mainTabContainer);

    const subTab3Star = document.getElementById('sub-tab-system-3star');
    if (subTab3Star) new TabManager(subTab3Star, () => Star3.render3StarUI());

    const subTab2Star = document.getElementById('sub-tab-system-2star');
    if (subTab2Star) new TabManager(subTab2Star, () => Star2.render2StarUI());

    new CollapsibleSection();

    // 2. 버튼 이벤트 바인딩
    const reset3 = document.getElementById('resetBtn3');
    if (reset3) reset3.addEventListener('click', Star3.reset3Star);
    const presetGen = document.getElementById('presetGeneralBtn');
    if (presetGen) presetGen.addEventListener('click', Star3.applyGeneralPreset);
    const presetBirth = document.getElementById('presetBirthdayBtn');
    if (presetBirth) presetBirth.addEventListener('click', Star3.applyBirthdayPreset);
    const presetPJ = document.getElementById('presetPJBtn');
    if (presetPJ) presetPJ.addEventListener('click', Star3.applyPJPreset);

    const reset2 = document.getElementById('resetBtn2');
    if (reset2) reset2.addEventListener('click', Star2.reset2Star);

    // 3. 토글 버튼 설정 (3성)
    new ToggleButtonElement('toggleCeilingBtn3', TOGGLE_STATES_CEILING, (name) => {
        CEILING_MODE.star3 = name; Star3.calculate3Star();
    });
    new ToggleButtonElement('toggleRandomBtn3', TOGGLE_STATES_RANDOM, (name) => {
        RANDOM_MODE.star3 = name; Star3.calculate3Star();
    });
    new ToggleButtonElement('toggleStep4Btn3', TOGGLE_STATES_STEP4, (name) => {
        STEP4_MODE.star3 = name; Star3.calculate3Star();
    });
    new ToggleButtonElement('toggleViewBtn3', TOGGLE_STATES_VIEW, (name) => {
        VIEW_MODE.star3 = name; Star3.render3StarUI();
    });

    // 4. [수정] 토글 버튼 설정 (2성) - 랜덤/Step4 제거됨
    new ToggleButtonElement('toggleCeilingBtn2', TOGGLE_STATES_CEILING, (name) => {
        CEILING_MODE.star2 = name; 
        Star2.calculate2Star();
    });
    // toggleRandomBtn2, toggleStep4Btn2 설정 제거
    new ToggleButtonElement('toggleViewBtn2', TOGGLE_STATES_VIEW, (name) => {
        VIEW_MODE.star2 = name;
        Star2.render2StarUI();
    });

    Star3.init3StarInputs();
    Star2.init2StarInputs();

    appState.isInitializing = false; 
};