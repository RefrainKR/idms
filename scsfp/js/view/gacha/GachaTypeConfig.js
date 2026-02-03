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
            efficiency: { canvas: 'efficiencyChart' },
            cdf: { canvas: 'cdfChart' }
        },
        subTabs: {
            collection: 'res-3s-collection',
            total: 'res-3s-total',
            efficiency: 'res-3s-efficiency',
            cdf: 'res-3s-cdf'
        },
        summary: {
            element: 'globalSummary',
            logic: 'globalLogic'
        },
        hasRandomMode: true,
        hasStep4Mode: true,
        hasCdfTab: true,
        // 탭별 버튼 visibility 규칙
        buttonVisibility: {
            efficiency: ['star3-efficiency-toggle'],
            collection: ['star3-toggle-view'],
            total: ['star3-toggle-view'],
            cdf: [] // CDF 탭에서는 토글 버튼 숨김
        }
    },

    birthday: {
        mainTabId: 'tab-birthday',
        subTabContainerId: 'sub-tab-system-birthday',
        charts: {
            collection: { canvas: 'resultChartBirthday', legend: 'legendListBirthday' },
            total: { canvas: 'resultChartTotalBirthday' },
            efficiency: { canvas: 'efficiencyChartBirthday' },
            cdf: { canvas: 'cdfChartBirthday' }
        },
        subTabs: {
            collection: 'res-bd-collection',
            total: 'res-bd-total',
            efficiency: 'res-bd-efficiency',
            cdf: 'res-bd-cdf'
        },
        summary: {
            element: 'globalSummary',
            logic: 'globalLogic'
        },
        hasRandomMode: false,
        hasStep4Mode: false,
        hasCdfTab: true,
        // 탭별 버튼 visibility 규칙
        buttonVisibility: {
            efficiency: ['birthday-efficiency-toggle'],
            collection: ['birthday-toggle-view'],
            total: ['birthday-toggle-view'],
            cdf: []
        }
    },

    collab: {
        mainTabId: 'tab-collab',
        subTabContainerId: 'sub-tab-system-collab',
        charts: {
            collection: { canvas: 'resultChartCollab', legend: 'legendListCollab' },
            total: { canvas: 'resultChartTotalCollab' },
            efficiency: { canvas: 'efficiencyChartCollab' },
            cdf: { canvas: 'cdfChartCollab' }
        },
        subTabs: {
            collection: 'res-cb-collection',
            total: 'res-cb-total',
            efficiency: 'res-cb-efficiency',
            cdf: 'res-cb-cdf'
        },
        summary: {
            element: 'globalSummary',
            logic: 'globalLogic'
        },
        hasRandomMode: false,
        hasStep4Mode: false,
        hasCdfTab: true,
        // 탭별 버튼 visibility 규칙
        buttonVisibility: {
            efficiency: ['collab-efficiency-toggle'],
            collection: ['collab-toggle-view'],
            total: ['collab-toggle-view'],
            cdf: []
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
            element: 'globalSummary',
            logic: 'globalLogic'
        },
        hasRandomMode: false,
        hasStep4Mode: false,
        hasCdfTab: false,
        hasGroupMode: true,
        // 탭별 버튼 visibility 규칙
        buttonVisibility: {
            efficiency: ['star2-efficiency-toggle', 'star2-group-efficiency-mode'],
            collection: ['star2-toggle-view', 'star2-group-view-mode'],
            total: ['star2-toggle-view', 'star2-group-view-mode']
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
    if (!config || !config.buttonVisibility) return;

    // 현재 탭 타입 판별 (subTabs의 키 찾기)
    let currentTabType = null;
    for (const [key, tabId] of Object.entries(config.subTabs)) {
        if (tabId === activeSubTab) {
            currentTabType = key;
            break;
        }
    }

    if (!currentTabType) return;

    // 모든 버튼을 숨김 처리
    const allButtons = new Set();
    Object.values(config.buttonVisibility).forEach(buttons => {
        buttons.forEach(id => allButtons.add(id));
    });

    allButtons.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // 현재 탭에 해당하는 버튼만 표시
    const visibleButtons = config.buttonVisibility[currentTabType] || [];
    visibleButtons.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = '';
    });
}
