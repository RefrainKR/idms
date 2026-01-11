export const EXCLUDE_SAVE_IDS = ['normalPulls', 'stepPulls', 'pullsNormal2', 'pullsStepA', 'pullsStepB', 'pullsStepC', 'pullsStepD'];

export const CONFIG = {
    STAR3: {
        KEY: 'shani_gacha_3star',
        INPUTS: [
            { id: 'pickupCount', min: 1, max: 100, def: 2 },
            { id: 'pickupRate', min: 0, max: 100, def: 1 },
            { id: 'maxLoops', min: 0, max: 10, def: 2 },
            { id: 'step4Rate', min: 0, max: 100, def: 20 },
            { id: 'normalPulls', min: 0, max: 9999, def: 0 },
            { id: 'stepPulls', min: 0, max: 120, def: 0 },
            { id: 'targetCount', min: 0, max: 100, def: 0 }
        ]
    },
    STAR2: {
        KEY: 'shani_gacha_2star',
        INPUTS: [
            { id: 'countNormal2', min: 1, max: 100, def: 28 },
            { id: 'rate2Star', min: 0, max: 100, def: 28 },
            { id: 'pullsNormal2', min: 0, max: 9999, def: 0 },
            { id: 'countStepA', min: 1, max: 100, def: 8 }, { id: 'pullsStepA', min: 0, max: 9999, def: 0 },
            { id: 'countStepB', min: 1, max: 100, def: 7 }, { id: 'pullsStepB', min: 0, max: 9999, def: 0 },
            { id: 'countStepC', min: 1, max: 100, def: 7 }, { id: 'pullsStepC', min: 0, max: 9999, def: 0 },
            { id: 'countStepD', min: 1, max: 100, def: 6 }, { id: 'pullsStepD', min: 0, max: 9999, def: 0 }
        ]
    }
};

export const TOGGLE_STATES = {
    VIEW: [
        { name: 'individual', text: '개별', isActive: true },
        { name: 'cumulative_less', text: '누적(이하)', isActive: true },
        { name: 'cumulative_more', text: '누적(이상)', isActive: true }
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
    ]
};