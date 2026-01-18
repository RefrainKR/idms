export const CONFIG = {
    STAR3: {
        KEY: 'shani_gacha_3star',
        INPUTS: [
            { id: 'pickupCount', min: 1, max: 100, def: 2 },
            { id: 'pickupRate', min: 0, max: 100, def: 1 },
            { id: 'maxLoops', min: 0, max: 10, def: 2 },
            { id: 'step4Rate', min: 0, max: 100, def: 40 },
            { id: 'normalPulls', min: 0, max: 9999, def: 0 },
            { id: 'stepPulls', min: 0, def: 0 },
            { id: 'targetCount', min: 0, def: 0 }
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
        ]
    },
    STAR2: {
        KEY: 'shani_gacha_2star',
        INPUTS: [
            { id: 'countNormal2', min: 1, max: 100, def: 28 },
            { id: 'rate2Star', min: 0, max: 100, def: 28 },
            { id: 'pullsNormal2', min: 0, max: 9999, def: 0 }
        ]
    },
    BIRTHDAY: {
        KEY: 'shani_gacha_birthday',
        INPUTS: [
            { id: 'birthdayPickupCount', min: 1, max: 10, def: 1 },
            { id: 'birthdayNormalRate', min: 0, max: 100, def: 1.5 },
            { id: 'birthdayStepRate', min: 0, max: 100, def: 2.0 },
            { id: 'birthdayNormalPulls', min: 0, max: 9999, def: 0 },
            { id: 'birthdayStepPulls', min: 0, max: 30, def: 0 }
        ]
    }
};

// 반복문으로 그룹별 필드 추가
const groupDefaults = [8, 7, 7, 6];
['A', 'B', 'C', 'D'].forEach((grp, idx) => {
    CONFIG.STAR2.INPUTS.push(
        { id: `countStep${grp}`, min: 1, max: 100, def: groupDefaults[idx] },
        { id: `pullsStep${grp}`, min: 0, max: 9999, def: 0 },
        { id: `targetCount${grp}`, min: 0, def: 0 }
    );
});

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
    EFFICIENCY: [
        { name: 'best', text: 'Best', isActive: true },
        { name: 'worst', text: 'Worst', isActive: false }
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