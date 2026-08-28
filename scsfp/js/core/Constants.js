/**
 * Constants.js
 * 앱 전체 불변 상수 (Constants)
 *
 * 이 파일은 절대 변경되지 않는 값들만 포함합니다:
 * - 앱 버전
 * - 게임 규칙 (GACHA_RULES)
 * - 수학적 상수 (EPSILON 등)
 * - 확률 표시 모드
 *
 * 변경 가능한 설정값은 js/config/ 폴더의 *Config.js 파일들을 참조하세요.
 */

// ========================================
// 앱 버전 관리
// ========================================

export const APP_VERSION = '1.10.0.1';

/**
 * 버전별 마이그레이션 설정
 * StorageManager가 사용하여 버전 변경 시 자동 마이그레이션 수행
 */
export const VERSION_CONFIG = {
    '1.9.0': {
        changes: [
            {
                gacha: 'BIRTHDAY',
                reason: 'fixed_values_applied',
                action: 'reset'
            }
        ]
    }
};

// ========================================
// 게임 규칙 (Game Rules) - 절대 변경 불가
// ========================================

/**
 * 가챠 타입별 게임 규칙
 * 게임 시스템에서 정의된 불변 규칙
 */
export const GACHA_RULES = {
    STAR3: {
        STEPUP_CYCLE: 40,              // Step4가 나오는 주기 (40회마다)
        SHARED_SELECT_REWARD_INTERVAL: 200 // 일반+스탭업 공유 천장
    },
    STAR2: {
        HIGH_RATE_INTERVAL: 10,        // 95% 보정 주기 (일반 가챠)
        HIGH_RATE_PROBABILITY: 0.95,   // 보정 시 적용 확률 (95%)
        FIRST_GUARANTEED_PICKUP_PULL: 5,
        GUARANTEED_PICKUP_INTERVAL: 10,
        NORMAL_SELECT_REWARD_INTERVAL: 100,
        STEPUP_SELECT_REWARD_INTERVAL: 50
    },
    BIRTHDAY: {
        MAX_STEPUP_PULLS: 30,
        GUARANTEED_TARGET_PULL: 30,
        SHARED_SELECT_REWARD_INTERVAL: 200
    },
    COLLAB: {
        PRACTICAL_STEPUP_PULL_LIMIT: 9999,
        SHARED_SELECT_REWARD_INTERVAL: 200
    }
};

// ========================================
// 무돌(虹の結晶) 규칙
// ========================================

/**
 * 무돌 획득 관련 게임 규칙
 * 카드 등급별 무돌 획득량 및 가챠 확률
 */
export const RAINBOW_CRYSTAL_RULES = {
    // 카드 등급별 무돌 획득량
    REWARDS: {
        PCARD_1STAR: 1,   // P카드 1성: 1개
        PCARD_2STAR: 5,   // P카드 2성: 5개
        PCARD_3STAR: 25,  // P카드 3성: 25개
        SCARD_R: 1,       // S카드 R: 1개
        SCARD_SR: 5,      // S카드 SR: 5개
        SCARD_SSR: 25     // S카드 SSR: 25개
    },

    // 일반 3성 가챠 확률 (리뉴얼 후: P카드 + S카드 동시 배출)
    STAR3_RATES: {
        PCARD_3STAR: 0.05,   // P카드 3성: 5%
        PCARD_2STAR: 0.15,   // P카드 2성: 15%
        PCARD_1STAR: 0.33,   // P카드 1성: 33%
        SCARD_SSR: 0.03,     // S카드 SSR: 3%
        SCARD_SR: 0.05,      // S카드 SR: 5%
        SCARD_R: 0.39,       // S카드 R: 39%
        // 10회째 보정 (2성 or SR 이상 확정)
        PCARD_10TH: {
            PCARD_3STAR: 0.05,      // 3성: 5%
            PCARD_2STAR: 0.61333,   // 2성: 61.333% (15% + 46.333%)
            PCARD_1STAR: 0          // 1성: 0%
        },
        SCARD_10TH: {
            SCARD_SSR: 0.03,        // SSR: 3%
            SCARD_SR: 0.30667,      // SR: 30.667% (5% + 25.667%)
            SCARD_R: 0              // R: 0%
        }
    },

    // 10회째 보정 주기
    HIGH_RATE_INTERVAL: 10  // 10회마다 2성/SR 이상 확정
};

// ========================================
// 확률 표시 모드
// ========================================

/**
 * 확률 표시 모드 상수
 * UI에서 확률을 표시하는 방식 정의
 */
export const PROBABILITY_MODE = {
    INDIVIDUAL: 'individual',           // 개별 확률
    CUMULATIVE_LESS: 'cumulative_less', // 누적 (이하)
    CUMULATIVE_MORE: 'cumulative_more'  // 누적 (이상)
};

// ========================================
// 수학 및 프로그래밍 상수
// ========================================

/**
 * 수학적 상수
 * 프로그래밍 계산에 사용되는 불변값
 */
export const MATH_CONSTANTS = {
    EPSILON: 1e-9,                  // 부동소수점 오차 허용 범위
    PERCENTAGE_MULTIPLIER: 100      // 백분율 변환 (0.5 → 50%)
};
