export const CONFIG = {
    STAR3: {
        KEY: 'shani_gacha_3star',
        INPUTS: [
            { id: 'pickupCount', min: 1, max: 100, def: 2, type: 'int' },
            { id: 'pickupRate', min: 0, max: 100, def: 1, type: 'float' },
            { id: 'maxLoops', min: 0, max: 10, def: 2, type: 'int' },
            { id: 'step4Rate', min: 0, max: 100, def: 40, type: 'float' },
            { id: 'normalPulls', min: 0, max: 9999, def: 0, type: 'int' },
            { id: 'stepPulls', min: 0, def: 0, type: 'int' },
            { id: 'targetCount', min: 0, def: 0, type: 'int' },
            { id: 'targetProbability3', min: 0, max: 100, def: 90, type: 'float' }
        ], 
        PRESETS: [
            {
                id: 'presetGeneral',
                label: '일반',
                title: '일반 통상,한정(한정1+통상1 기준)',
                settings: { pickupCount: 2, pickupRate: 1, maxLoops: 2, step4Rate: 40, rewards: { 2: 'random' } }
            },
            {
                id: 'presetPJ',
                label: 'PJ',
                title: 'PJ: REFRAC7IONS 가챠(4픽업 기준)',
                settings: { pickupCount: 4, pickupRate: 1, maxLoops: 3, step4Rate: 40, rewards: { 2: 'random', 3: 'select' } }
            }
        ],
        // Observable 의존성 정의 (setupDataDependencies 대체)
        DEPENDENCIES: [
            {
                // maxLoops가 변경되면 stepMax를 자동 업데이트
                source: 'maxLoops',
                handler: (value, model, viewModel) => {
                    model.stepMax.value = value * 40; // GACHA_RULES.STAR3.STEPUP_CYCLE
                    if (viewModel && viewModel.updateLoopUI) {
                        viewModel.updateLoopUI();
                    }
                }
            },
            {
                // pickupCount가 변경되면 targetCount를 클램프
                source: 'pickupCount',
                handler: (value, model) => {
                    if (model.targetCount.value > value) {
                        model.targetCount.value = value;
                    }
                }
            }
        ]
    },
    STAR2: {
        KEY: 'shani_gacha_2star',
        INPUTS: [
            { id: 'countNormal2', min: 1, max: 100, def: 28, type: 'int' },
            { id: 'rate2Star', min: 0, max: 100, def: 28, type: 'float' },
            { id: 'pullsNormal2', min: 0, max: 9999, def: 0, type: 'int' }
        ],
        // Observable 의존성 정의
        DEPENDENCIES: [] // 그룹별 의존성은 동적으로 추가됨 (아래 참조)
    },
    BIRTHDAY: {
        KEY: 'shani_gacha_birthday',
        INPUTS: [
            { id: 'birthdayPickupCount', min: 1, max: 10, def: 1, type: 'int' },
            { id: 'birthdayNormalRate', min: 0, max: 100, def: 1.5, type: 'float' },
            { id: 'birthdayStepRate', min: 0, max: 100, def: 2.0, type: 'float' },
            { id: 'birthdayTargetCount', min: 0, max: 10, def: 0, type: 'int' },
            { id: 'birthdayNormalPulls', min: 0, max: 9999, def: 0, type: 'int' },
            { id: 'birthdayStepPulls', min: 0, max: 9999, def: 0, type: 'int' }
        ],
        // Observable 의존성: targetCount의 최대값은 pickupCount
        DEPENDENCIES: [
            { id: 'birthdayTargetCount', max: 'birthdayPickupCount' }
        ],
        PRESETS: {
            birthday: {
                label: '생일',
                pickupCount: 1,
                normalRate: 1.5,
                stepRate: 2.0,
                step3Mode: 'included'
            },
            hongaSecond: {
                label: '본가(2탄)',
                pickupCount: 5,
                normalRate: 0.75,
                stepRate: 1.0,
                step3Mode: 'excluded'
            }
        }
    }
};

// 반복문으로 그룹별 필드 추가
const groupDefaults = [8, 7, 7, 6];
['A', 'B', 'C', 'D'].forEach((grp, idx) => {
    CONFIG.STAR2.INPUTS.push(
        { id: `countStep${grp}`, min: 1, max: 100, def: groupDefaults[idx], type: 'int' },
        { id: `pullsStep${grp}`, min: 0, max: 9999, def: 0, type: 'int' },
        { id: `targetCount${grp}`, min: 0, def: 0, type: 'int' }
    );

    // 그룹별 의존성 추가: countStepX가 변경되면 targetCountX를 클램프
    CONFIG.STAR2.DEPENDENCIES.push({
        source: `countStep${grp}`,
        handler: (value, model) => {
            if (model[`targetCount${grp}`].value > value) {
                model[`targetCount${grp}`].value = value;
            }
        }
    });
});

// 가챠 규칙 상수 정의
export const GACHA_RULES = {
    STAR3: {
        STEPUP_CYCLE: 40,              // Step4가 나오는 주기 (40회마다)
        CEILING_INTERVAL: 200,         // 천장 발동 횟수 (일반+스탭업 합산)
        STEPUP_CEILING_INTERVAL: 200   // 스탭업 천장 (통합)
    },
    STAR2: {
        HIGH_RATE_INTERVAL: 10,        // 95% 보정 주기 (일반 가챠)
        STEPUP_GUARANTEE_FIRST: 5,     // 첫 확정 (5회)
        STEPUP_GUARANTEE_INTERVAL: 10, // 확정 간격 (이후 10회마다)
        NORMAL_CEILING_INTERVAL: 100,  // 일반 천장 (100회당)
        STEPUP_CEILING_INTERVAL: 50    // 스탭업 천장 (50회당)
    },
    BIRTHDAY: {
        STEPUP_MAX: 30,                // 스탭업 최대 횟수
        STEPUP_GUARANTEE: 30,          // 30회째 확정 획득
        CEILING_INTERVAL: 200          // 천장 (일반+스탭업 합산)
    }
};

// 확률 모드 상수 정의
export const PROBABILITY_MODE = {
    INDIVIDUAL: 'individual',
    CUMULATIVE_LESS: 'cumulative_less',
    CUMULATIVE_MORE: 'cumulative_more'
};

export const TOGGLE_STATES = {
    VIEW: [
        { name: PROBABILITY_MODE.INDIVIDUAL, text: '개별', isActive: true },
        { name: PROBABILITY_MODE.CUMULATIVE_LESS, text: '누적(이하)', isActive: true },
        { name: PROBABILITY_MODE.CUMULATIVE_MORE, text: '누적(이상)', isActive: true }
    ],
    CEILING: [
        { name: 'included', text: '천장', isActive: true },
        { name: 'excluded', text: '천장', isActive: false }
    ],
    RANDOM: [
        { name: 'included', text: '랜덤', isActive: true },
        { name: 'excluded', text: '랜덤', isActive: false }
    ],
    STEP4: [
        { name: 'included', text: 'Step4', isActive: true },
        { name: 'excluded', text: 'Step4', isActive: false }
    ],
    STEP3: [
        { name: 'included', text: 'Step3', isActive: true },
        { name: 'excluded', text: 'Step3', isActive: false }
    ],
    EFFICIENCY: [
        { name: 'best', text: 'Best', isActive: true },
        { name: 'worst', text: 'Worst', isActive: false }
    ],
    EFFICIENCY_MODE: [
        { name: 'comparison', text: '비교', isActive: true },
        { name: 'cdf', text: '역추적', isActive: false }
    ],
    GROUPS_VIEW: [
        { name: 'ALL', text: 'All', isActive: true },
        { name: 'A', text: 'A', isActive: true },
        { name: 'B', text: 'B', isActive: true },
        { name: 'C', text: 'C', isActive: true },
        { name: 'D', text: 'D', isActive: true }
    ],
    GROUPS_EFF: [
        { name: 'A', text: 'A', isActive: true },
        { name: 'B', text: 'B', isActive: true },
        { name: 'C', text: 'C', isActive: true },
        { name: 'D', text: 'D', isActive: true }
    ]
};