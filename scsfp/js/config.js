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
        ], PRESETS: [
            {
                id: 'presetGeneral',
                label: '일반',
                title: '일반 통상,한정(한정1+통상1 기준)',
                settings: { pickupCount: 2, pickupRate: 1, maxLoops: 2, step4Rate: 40, rewards: { 2: 'random' } }
            },
            {
                id: 'presetBirthday',
                label: '생일',
                title: '생일 가챠(일반 가챠 기준) (스탭업 가챠는 픽업 확률 2로 조정 필요)',
                settings: { pickupCount: 1, pickupRate: 1.5, maxLoops: 0, step4Rate: 0, rewards: {} }
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
    }
};
// 반복문으로 그룹별 필드 추가
const groupDefaults = [8, 7, 7, 6];
['A', 'B', 'C', 'D'].forEach((grp, idx) => {
    CONFIG.STAR2.INPUTS.push(
        { id: `countStep${grp}`, min: 1, max: 100, def: groupDefaults[idx] },
        { id: `pullsStep${grp}`, min: 0, max: 9999, def: 0 },
        { id: `targetCount${grp}`, min: 0, max: 100, def: 0 } // [신규] 저격 수
    );
});

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
    ],
    EFFICIENCY: [
        { 
            name: 'best', 
            text: 'Best', 
            isActive: true 
            // 기본 스타일(초록색)은 CSS class(.btn-active)가 처리하므로 style 생략 가능
        },
        { 
            name: 'worst', 
            text: 'Worst', 
            isActive: false, 
            style: { 
                backgroundColor: '#fff',
                borderColor: '#dc3545',
                color: '#dc3545',
                textDecoration: 'none'
            }
        }
    ], 
    // 2성 그룹 전환 버튼 상태
    GROUPS: [
        { name: 'A', text: 'Group A', isActive: true, style: { color: '#e91e63', borderColor: '#e91e63',  backgroundColor: '#fff' } }, // 핑크
        { name: 'B', text: 'Group B', isActive: true, style: { color: '#2196f3', borderColor: '#2196f3',  backgroundColor: '#fff' } }, // 블루
        { name: 'C', text: 'Group C', isActive: true, style: { color: '#ff9800', borderColor: '#ff9800',  backgroundColor: '#fff' } }, // 오렌지
        { name: 'D', text: 'Group D', isActive: true, style: { color: '#9c27b0', borderColor: '#9c27b0', backgroundColor: '#fff' } }  // 퍼플
    ]
};