/**
 * GachaConfig.js
 * 가챠 관련 설정 (Configuration)
 *
 * 이 파일은 사용자가 변경 가능한 설정값들을 포함합니다:
 * - CONFIG: 각 가챠 타입별 입력 필드, 프리셋, 의존성
 * - TOGGLE_STATES: UI 토글 버튼 상태 정의
 *
 * 게임 규칙 상수(GACHA_RULES, PROBABILITY_MODE)는 Constants.js에서 re-export됩니다.
 */

import { GACHA_RULES, PROBABILITY_MODE } from '../core/Constants.js';

export const CONFIG = {
    STAR3: {
        KEY: 'shani_gacha_3star',
        INPUTS: [
            { id: 'star3-pickupCount', min: 1, max: 100, def: 2, type: 'int' },
            { id: 'star3-pickupRate', min: 0, max: 100, def: 1, type: 'float' },
            { id: 'star3-maxLoops', min: 0, max: 10, def: 2, type: 'int' },
            { id: 'star3-step4Rate', min: 0, max: 100, def: 40, type: 'float' },
            { id: 'star3-normalPulls', min: 0, max: 9999, def: 0, type: 'int' },
            { id: 'star3-stepPulls', min: 0, def: 0, type: 'int' },
            { id: 'star3-targetCount', min: 0, def: 0, type: 'int' },
            { id: 'star3-targetProbability', min: 0, max: 100, def: 90, type: 'float' },
            { id: 'rainbow-p3star', min: 0, max: 100, def: 5, type: 'float' },
            { id: 'rainbow-p2star', min: 0, max: 100, def: 15, type: 'float' },
            { id: 'rainbow-p1star', min: 0, max: 100, def: 33, type: 'float' },
            { id: 'rainbow-pSSR',   min: 0, max: 100, def: 3, type: 'float' },
            { id: 'rainbow-pSR',    min: 0, max: 100, def: 5, type: 'float' },
            { id: 'rainbow-pR',     min: 0, max: 100, def: 39, type: 'float' }
        ],
        PRESETS: [
            {
                id: 'presetGeneral',
                label: '정규',
                title: '정규 (통상·한정, 픽업2 기준)',
                settings: {
                    pickupCount: 2, pickupRate: 1, maxLoops: 2, step4Rate: 40, rewards: { 2: 'random' },
                    rainbow: { p3star: 5, p2star: 15, p1star: 33, pSSR: 3, pSR: 5, pR: 39 }
                }
            },
            {
                id: 'presetPJ',
                label: 'PJ',
                title: 'PJ: REFRAC7IONS 가챠(4픽업 기준)',
                settings: {
                    pickupCount: 4, pickupRate: 1, maxLoops: 3, step4Rate: 40, rewards: { 2: 'random', 3: 'select' },
                    rainbow: { p3star: 7.5, p2star: 15, p1star: 30.5, pSSR: 3, pSR: 5, pR: 39 }
                }
            }
        ],
        // Observable 의존성 정의 (setupDataDependencies 대체)
        DEPENDENCIES: [
            {
                // maxLoops가 변경되면 stepMax를 자동 업데이트
                source: 'maxLoops',
                handler: (value, model, viewModel) => {
                    model.stepMax.value = value * GACHA_RULES.STAR3.STEPUP_CYCLE;
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
            { id: 'star2-pickupCount', min: 1, max: 100, def: 28, type: 'int' },
            { id: 'star2-pickupRate', min: 0, max: 100, def: 28, type: 'float' },
            { id: 'star2-normalPulls', min: 0, max: 9999, def: 0, type: 'int' }
        ],
        // Observable 의존성 정의
        DEPENDENCIES: [] // 그룹별 의존성은 동적으로 추가됨 (아래 참조)
    },
    BIRTHDAY: {
        KEY: 'shani_gacha_birthday',
        VERSION: '1.9.0',

        // 고정값 정의 (사양 변경 시 여기만 수정)
        FIXED_VALUES: {
            pickupCount: 1,
            normalRate: 1.5,
            stepRate: 2.0
        },

        INPUTS: [
            { id: 'birthday-pickupCount', min: 1, max: 10, def: 1, type: 'int', fixed: true },
            { id: 'birthday-normalRate', min: 0, max: 100, def: 1.5, type: 'float', fixed: true },
            { id: 'birthday-stepRate', min: 0, max: 100, def: 2.0, type: 'float', fixed: true },
            { id: 'birthday-targetCount', min: 0, max: 10, def: 0, type: 'int' },
            { id: 'birthday-normalPulls', min: 0, max: 9999, def: 0, type: 'int' },
            { id: 'birthday-stepPulls', min: 0, max: 30, def: 0, type: 'int' }
        ],

        // Observable 의존성: pickupCount가 변경되면 targetCount를 클램프
        DEPENDENCIES: [
            {
                source: 'pickupCount',
                handler: (value, model) => {
                    if (model.targetCount.value > value) {
                        model.targetCount.value = value;
                    }
                }
            }
        ]
    },

    COLLAB: {
        KEY: 'shani_gacha_collab',
        VERSION: '1.9.0',

        INPUTS: [
            { id: 'collab-pickupCount', min: 1, max: 10, def: 5, type: 'int' },
            { id: 'collab-normalRate', min: 0, max: 100, def: 0.75, type: 'float' },
            { id: 'collab-stepRate', min: 0, max: 100, def: 1.0, type: 'float' },
            { id: 'collab-targetCount', min: 0, max: 10, def: 0, type: 'int' },
            { id: 'collab-normalPulls', min: 0, max: 9999, def: 0, type: 'int' },
            { id: 'collab-stepPulls', min: 0, max: 9999, def: 0, type: 'int' }
        ],

        PRESETS: [
            {
                id: 'honka2nd',
                label: '본가(2탄)',
                title: '본가 콜라보 2탄 (5픽업 기준)',
                settings: { pickupCount: 5, normalRate: 0.75, stepRate: 1.0 }
            }
        ],

        DEPENDENCIES: [
            {
                source: 'pickupCount',
                handler: (value, model) => {
                    if (model.targetCount.value > value) {
                        model.targetCount.value = value;
                    }
                }
            }
        ]
    }
};

// 반복문으로 그룹별 필드 추가
const groupDefaults = [8, 7, 7, 6];
['A', 'B', 'C', 'D'].forEach((grp, idx) => {
    CONFIG.STAR2.INPUTS.push(
        { id: `star2-countStep${grp}`, min: 1, max: 100, def: groupDefaults[idx], type: 'int' },
        { id: `star2-pullsStep${grp}`, min: 0, max: 9999, def: 0, type: 'int' },
        { id: `star2-targetCount${grp}`, min: 0, def: 0, type: 'int' }
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

// GACHA_RULES, PROBABILITY_MODE는 Constants.js에서 관리됩니다.
// 하위 호환성을 위해 re-export합니다.
export { GACHA_RULES, PROBABILITY_MODE } from '../core/Constants.js';

/**
 * CONFIG.INPUTS 배열에서 { id: def값 } 맵을 반환하는 유틸
 * @param {Array} inputs - CONFIG.XXXX.INPUTS 배열
 * @returns {Object} { id: def } 형태의 기본값 맵
 */
export function getInputDefaults(inputs) {
    const map = {};
    if (!inputs) return map;
    inputs.forEach(input => {
        map[input.id] = input.def;
    });
    return map;
}

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
    RAINBOW_10TH: [
        { name: 'included', text: '2/SR확정', isActive: true },
        { name: 'excluded', text: '2/SR확정', isActive: false }
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