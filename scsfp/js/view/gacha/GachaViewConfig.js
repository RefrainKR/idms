/**
 * 가챠 타입별 UI 설정
 * View/ViewModel 결합도를 낮추기 위한 설정 중앙화
 */

export const GACHA_TYPE_CONFIG = {
    star3: {
        mainTabId: 'tab-3star',
        subTabContainerId: 'sub-tab-system-3star',
        charts: {
            collection: { canvas: 'resultChart', legend: 'legendList' },
            total: { canvas: 'resultChartTotal3' },
            efficiency: { canvas: 'efficiencyChart' }
        },
        subTabs: {
            collection: 'res-3s-collection',
            total: 'res-3s-total',
            efficiency: 'res-3s-efficiency',
            rainbow: 'res-3s-rainbow'
        },
        summary: {
            element: 'gachaSummary',
            logic: 'gachaLogic'
        },
        hasRandomMode: true,
        hasStep4Mode: true,
        // 탭별 버튼 visibility 규칙
        // 천장/랜덤/Step4는 픽업 계산 탭에서만 표시 (rainbow 탭 제외)
        buttonVisibility: {
            efficiency: ['star3-efficiency-toggle', 'star3-toggle-ceiling', 'star3-toggle-random', 'star3-toggle-step4'],
            collection: ['star3-toggle-view', 'star3-toggle-ceiling', 'star3-toggle-random', 'star3-toggle-step4', 'star3-collection-view-toggle'],
            total: ['star3-toggle-view', 'star3-toggle-ceiling', 'star3-toggle-random', 'star3-toggle-step4'],
            rainbow: ['star3-rainbow-10th']
        },
        // 빠른 설정은 기존 입력 요소를 이동한 wrapper만 탭별로 표시한다.
        controlVisibility: {
            collection: ['star3-quick-targetMode', 'star3-quick-targetCount', 'star3-quick-normalPulls', 'star3-quick-stepPulls'],
            total: ['star3-quick-targetMode', 'star3-quick-targetCount', 'star3-quick-normalPulls', 'star3-quick-stepPulls'],
            efficiency: ['star3-quick-targetMode', 'star3-quick-targetCount', 'star3-quick-targetProbability'],
            rainbow: ['star3-quick-normalPulls', 'star3-quick-stepPulls']
        }
    },

    birthday: {
        mainTabId: 'tab-birthday',
        subTabContainerId: 'sub-tab-system-birthday',
        charts: {
            collection: { canvas: 'resultChartBirthday', legend: 'legendListBirthday' },
            total: { canvas: 'resultChartTotalBirthday' },
            efficiency: { canvas: 'efficiencyChartBirthday' }
        },
        subTabs: {
            collection: 'res-bd-collection',
            total: 'res-bd-total',
            efficiency: 'res-bd-efficiency'
        },
        summary: {
            element: 'gachaSummary',
            logic: 'gachaLogic'
        },
        hasRandomMode: false,
        hasStep4Mode: false,
        // 탭별 버튼 visibility 규칙
        buttonVisibility: {
            efficiency: ['birthday-efficiency-toggle'],
            collection: ['birthday-toggle-view', 'birthday-collection-view-toggle'],
            total: ['birthday-toggle-view']
        },
        controlVisibility: {
            collection: ['birthday-quick-normalPulls', 'birthday-quick-stepPulls'],
            total: ['birthday-quick-normalPulls', 'birthday-quick-stepPulls'],
            efficiency: ['birthday-quick-targetProbability']
        }
    },

    collab: {
        mainTabId: 'tab-collab',
        subTabContainerId: 'sub-tab-system-collab',
        charts: {
            collection: { canvas: 'resultChartCollab', legend: 'legendListCollab' },
            total: { canvas: 'resultChartTotalCollab' },
            efficiency: { canvas: 'efficiencyChartCollab' }
        },
        subTabs: {
            collection: 'res-cb-collection',
            total: 'res-cb-total',
            efficiency: 'res-cb-efficiency'
        },
        summary: {
            element: 'gachaSummary',
            logic: 'gachaLogic'
        },
        hasRandomMode: false,
        hasStep4Mode: false,
        // 탭별 버튼 visibility 규칙
        buttonVisibility: {
            efficiency: ['collab-efficiency-toggle'],
            collection: ['collab-toggle-view', 'collab-collection-view-toggle'],
            total: ['collab-toggle-view']
        },
        controlVisibility: {
            collection: ['collab-quick-targetCount', 'collab-quick-normalPulls', 'collab-quick-stepPulls'],
            total: ['collab-quick-targetCount', 'collab-quick-normalPulls', 'collab-quick-stepPulls'],
            efficiency: ['collab-quick-targetCount', 'collab-quick-targetProbability']
        }
    },

    star2: {
        mainTabId: 'tab-2star',
        subTabContainerId: 'sub-tab-system-2star',
        charts: {
            collection: { canvas: 'resultChart2', legend: 'legendList2' },
            total: { canvas: 'resultChartTotal2' },
            efficiency: { canvas: 'efficiencyChart2' }
        },
        subTabs: {
            collection: 'res-2s-collection',
            total: 'res-2s-total',
            efficiency: 'res-2s-efficiency'
        },
        summary: {
            element: 'gachaSummary',
            logic: 'gachaLogic'
        },
        hasRandomMode: false,
        hasStep4Mode: false,
        hasGroupMode: true,
        // 탭별 버튼 visibility 규칙
        buttonVisibility: {
            efficiency: ['star2-efficiency-toggle', 'star2-group-efficiency-mode'],
            collection: ['star2-toggle-view', 'star2-group-view-mode', 'star2-collection-view-toggle'],
            total: ['star2-toggle-view', 'star2-group-view-mode']
        },
        controlVisibility: {
            collection: ['star2-quick-normalPulls', 'star2-quick-stepPulls', 'star2-quick-targetCounts'],
            total: ['star2-quick-normalPulls', 'star2-quick-stepPulls', 'star2-quick-targetCounts'],
            efficiency: ['star2-quick-targetCounts']
        }
    }
};

/**
 * 가챠 타입의 설정 가져오기
 */
export function getGachaConfig(gachaType) {
    const config = GACHA_TYPE_CONFIG[gachaType];
    if (!config) {
        console.error(`Unknown gacha type: ${gachaType}`);
        return null;
    }
    return config;
}

/**
 * 활성화된 서브탭 ID 가져오기
 */
export function getActiveSubTab(config) {
    if (!config) return null;

    const container = document.getElementById(config.subTabContainerId);
    if (!container) return null;

    const activeBtn = container.querySelector('.tab-button.active');
    return activeBtn ? activeBtn.dataset.tab : null;
}

/**
 * 탭 변경 시 버튼 visibility 적용
 * @param {Object} config - 가챠 타입 설정 (GACHA_TYPE_CONFIG[type])
 * @param {string} activeSubTab - 활성 서브탭 ID (예: 'res-3s-efficiency')
 */
export function applyTabVisibility(config, activeSubTab) {
    if (!config) return;

    // 현재 탭 타입 판별 (subTabs의 키 찾기)
    let currentTabType = null;
    for (const [key, tabId] of Object.entries(config.subTabs)) {
        if (tabId === activeSubTab) {
            currentTabType = key;
            break;
        }
    }

    if (!currentTabType) return;

    applyVisibilityRules(config.buttonVisibility, currentTabType);
    applyVisibilityRules(config.controlVisibility, currentTabType);
}

/**
 * 탭별 표시 목록을 적용한다. 버튼과 빠른 설정 wrapper가 같은 규칙을 공유한다.
 * @param {Object<string, string[]>|undefined} visibilityRules - 탭 종류별 요소 ID
 * @param {string} currentTabType - 현재 서브탭 종류
 */
function applyVisibilityRules(visibilityRules, currentTabType) {
    if (!visibilityRules) return;

    const allElementIds = new Set();
    Object.values(visibilityRules).forEach(elementIds => {
        elementIds.forEach(id => allElementIds.add(id));
    });

    allElementIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    const visibleElementIds = visibilityRules[currentTabType] || [];
    visibleElementIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = '';
    });
}
