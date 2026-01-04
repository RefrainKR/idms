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

    // ============================================================
    // 1. 탭 시스템 초기화 및 콜백 연결 (Summary 갱신 핵심)
    // ============================================================

    // 1-1. 메인 탭 (3성 <-> 2성)
    const mainTabContainer = document.getElementById('main-tab-system');
    new TabManager(mainTabContainer, (activeTabId) => {
        // 메인 탭이 바뀔 때, 현재 활성화된 탭의 UI(Summary 포함)를 강제로 갱신
        if (activeTabId === 'tab-3star') {
            Star3.render3StarUI();
        } else if (activeTabId === 'tab-2star') {
            Star2.render2StarUI();
        }
    });

    // 1-2. 3성 서브 탭 (수집 종류 <-> 총 획득 <-> 특정 픽업)
    const subTab3Star = document.getElementById('sub-tab-system-3star');
    if (subTab3Star) {
        new TabManager(subTab3Star, (activeTabId) => {
            // 서브 탭을 누를 때마다 Summary와 차트 갱신
            Star3.render3StarUI();
        });
    }

    // 1-3. 2성 서브 탭 (수집 종류 <-> 총 획득 <-> 특정 픽업)
    const subTab2Star = document.getElementById('sub-tab-system-2star');
    if (subTab2Star) {
        new TabManager(subTab2Star, (activeTabId) => {
            // 서브 탭을 누를 때마다 Summary와 차트 갱신
            Star2.render2StarUI();
        });
    }

    // 2. 토글 섹션 기능 초기화
    new CollapsibleSection();

    // ============================================================
    // 3. 버튼 이벤트 바인딩
    // ============================================================
    
    // 3성 관련
    const reset3 = document.getElementById('resetBtn3');
    if (reset3) reset3.addEventListener('click', Star3.reset3Star);
    
    const presetGen = document.getElementById('presetGeneralBtn');
    if (presetGen) presetGen.addEventListener('click', Star3.applyGeneralPreset);
    
    const presetBirth = document.getElementById('presetBirthdayBtn');
    if (presetBirth) presetBirth.addEventListener('click', Star3.applyBirthdayPreset);
    
    const presetPJ = document.getElementById('presetPJBtn');
    if (presetPJ) presetPJ.addEventListener('click', Star3.applyPJPreset);

    // 2성 관련
    const reset2 = document.getElementById('resetBtn2');
    if (reset2) reset2.addEventListener('click', Star2.reset2Star);

    // ============================================================
    // 4. 토글 버튼 설정 (상태 변경 시 재계산 또는 재렌더링)
    // ============================================================

    // --- 3성 토글 ---
    new ToggleButtonElement('toggleCeilingBtn3', TOGGLE_STATES_CEILING, (name) => {
        CEILING_MODE.star3 = name; 
        Star3.calculate3Star(); // 계산 로직 변경됨 -> 재계산
    });
    new ToggleButtonElement('toggleRandomBtn3', TOGGLE_STATES_RANDOM, (name) => {
        RANDOM_MODE.star3 = name; 
        Star3.calculate3Star(); // 계산 로직 변경됨 -> 재계산
    });
    new ToggleButtonElement('toggleStep4Btn3', TOGGLE_STATES_STEP4, (name) => {
        STEP4_MODE.star3 = name; 
        Star3.calculate3Star(); // 계산 로직 변경됨 -> 재계산
    });
    new ToggleButtonElement('toggleViewBtn3', TOGGLE_STATES_VIEW, (name) => {
        VIEW_MODE.star3 = name;
        Star3.render3StarUI(); // 보기 방식만 변경됨 -> 재렌더링
    });

    // --- 2성 토글 ---
    new ToggleButtonElement('toggleCeilingBtn2', TOGGLE_STATES_CEILING, (name) => {
        CEILING_MODE.star2 = name; 
        Star2.calculate2Star(); // 계산 로직 변경됨 -> 재계산
    });
    // 2성에는 Random, Step4 버튼이 제거되었으므로 바인딩하지 않음
    new ToggleButtonElement('toggleViewBtn2', TOGGLE_STATES_VIEW, (name) => {
        VIEW_MODE.star2 = name;
        Star2.render2StarUI(); // 보기 방식만 변경됨 -> 재렌더링
    });

    // ============================================================
    // 5. 데이터 초기화 및 실행
    // ============================================================
    Star3.init3StarInputs();
    Star2.init2StarInputs();

    appState.isInitializing = false; 
};