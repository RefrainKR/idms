export const KEY_3STAR = 'shani_gacha_3star';
export const KEY_2STAR = 'shani_gacha_2star';

export const EXCLUDE_SAVE_IDS = [
    'normalPulls', 'stepPulls', 
    'pullsNormal2', 
    'pullsStepA', 'pullsStepB', 'pullsStepC', 'pullsStepD'
];

export const CONFIG_3STAR = [
    { id: 'pickupCount', min: 1, max: 100, def: 2 },
    { id: 'pickupRate', min: 0, max: 100, def: 1 },
    { id: 'maxLoops', min: 1, max: 10, def: 2 },
    { id: 'step4Rate', min: 0, max: 100, def: 20 },
    { id: 'normalPulls', min: 0, max: 9999, def: 0 },
    { id: 'stepPulls', min: 0, max: 120, def: 0 } 
];

export const CONFIG_2STAR = [
    { id: 'rate2Star', min: 0, max: 100, def: 28 },
    { id: 'countNormal2', min: 1, max: 100, def: 28 },
    { id: 'pullsNormal2', min: 0, max: 9999, def: 0 },
];
// 2성 그룹 동적 추가
['A', 'B', 'C', 'D'].forEach((grp, idx) => {
    const defaultCounts = [8, 7, 7, 6];
    CONFIG_2STAR.push({ id: `countStep${grp}`, min: 1, max: 100, def: defaultCounts[idx] });
    CONFIG_2STAR.push({ id: `pullsStep${grp}`, min: 0, max: 9999, def: 0 });
});

export const TOGGLE_STATES_VIEW = [
    { name: 'individual', text: '개별 확률' },
    { name: 'cumulative_less', text: '누적(이하)' },
    { name: 'cumulative_more', text: '누적(이상)' }
];

export const TOGGLE_STATES_CEILING = [
    { name: 'included', text: '천장 포함' },
    { name: 'excluded', text: '천장 미포함' }
];