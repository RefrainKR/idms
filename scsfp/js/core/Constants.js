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

export const APP_VERSION = '1.9.5';

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

/**
 * 포맷팅 규칙 - 소수점 자릿수
 * UI 표시를 위한 포맷팅 기준
 */
export const FORMATTING_RULES = {
    DECIMAL_PLACES: {
        PROBABILITY: 3,        // 확률 표시 (0.123%)
        EFFICIENCY: 3,         // 효율 표시 (1.234)
        RAINBOW_PRICE: 3,      // 무돌 가격 (123.456₩)
        RAINBOW_EXPECTED: 2,   // 무돌 기대값 (12.34개)
        PERCENTAGE: 0          // 백분율 정수 표시 (90%)
    }
};
