/**
 * UIConfig.js
 * UI 표시 설정 (Configuration)
 *
 * 이 파일은 UI 관련 설정값들을 포함합니다:
 * - FORMAT: 포맷팅 설정 (소수점 자릿수)
 * - CHART: 차트 레이아웃 설정
 * - CHART_POINT: 차트 포인트 설정
 * - CHART_RANGE: 차트 렌더링 범위
 *
 * 수학 상수(EPSILON, PERCENTAGE_MULTIPLIER)는 Constants.js에 있습니다.
 * Observable 기본값은 각 Model에서 GachaConfig.INPUTS 기반으로 초기화됩니다.
 */

// ========================================
// 포맷팅 설정
// ========================================

export const FORMAT = {
    // 소수점 자릿수
    DECIMAL_PLACES: {
        PROBABILITY: 3,        // 확률 표시 (0.123%)
        EFFICIENCY: 3,         // 효율 표시 (1.234)
        RAINBOW_PRICE: 3,      // 무돌 가격 (123.456₩)
        RAINBOW_EXPECTED: 2,   // 무돌 기대값 (12.34개)
        PERCENTAGE: 0          // 백분율 정수 표시 (90%)
    }
};

// ========================================
// 차트 공통 설정
// ========================================

export const CHART = {
    // 레이아웃 패딩
    PADDING: {
        PIE: 10,
        BAR_TOP: 30,
        BAR_BOTTOM: 10
    },

    // 폰트 크기
    FONT_SIZE: {
        PIE_LABEL: 14,
        BAR_LABEL: 10,
        CHART_TITLE: 16,
        AXIS_TITLE: 14
    },

    // 틱 제한
    MAX_TICKS: {
        X_AXIS: 20,           // X축 일반 틱
        CDF_AXIS: 21          // CDF 차트 틱
    },

    // CDF 차트 간격 표시
    CDF_INTERVAL: 50,         // 50의 배수만 표시

    // 선 스타일
    LINE_DASH: [5, 5],        // 점선 패턴

    // 색상 불투명도
    OPACITY: {
        MIN: 0.3,
        MAX: 0.7
    }
};

// ========================================
// 차트 색상
// ========================================

export const CHART_COLORS = {
    STEPUP: '#45a247',              // 스탭업 가챠 (초록)
    NORMAL: '#283c86',              // 일반 가챠 (남색)
    ERROR: '#dc3545',               // 에러/실패 (빨강)
    NORMAL_RGBA: 'rgba(40, 60, 134, {opacity})'  // 일반 가챠 RGBA 템플릿
};

// ========================================
// 차트 포인트 설정
// ========================================

export const CHART_POINT = {
    // 포인트 반경
    RADIUS: {
        ORIGIN: 4,            // 시작점 (0회차)
        CEILING_EMPHASIS: 7,  // 천장/주회 강조
        GUARANTEED: 4,        // 확정 슬롯
        MINOR: 3,             // 소확정
        HIDDEN: 0             // 비표시
    },

    // Hit Radius
    HIT_RADIUS: {
        STAR2: 15,            // 2성 가챠 (5의 배수)
        STAR3: 30             // 3성 가챠 (10의 배수)
    },

    // 강조 간격
    EMPHASIS_INTERVAL: {
        STAR2_CEILING: 50,    // 2성 천장 강조
        STAR2_GUARANTEED: 10, // 2성 확정
        STAR2_MINOR: 5,       // 2성 소확정
        STAR3_CYCLE: 40,      // 3성 주회 강조
        STAR3_GUARANTEED: 10  // 3성 확정
    }
};

// ========================================
// 차트 렌더링 범위
// ========================================

export const CHART_RANGE = {
    // X축 최대 범위 (효율 비교 차트)
    EFFICIENCY_X_LIMIT: {
        STAR3: 'dynamic',     // maxLoops * 40 (동적 계산)
        BIRTHDAY: 30,         // 스탭업 30회 기준
        COLLAB: 200,          // 콜라보 제한 없음
        STAR2: 100            // 2성 기준
    },

    // 효율/CDF 시뮬레이션 최대 가챠 횟수
    EFFICIENCY_MAX_PULLS: 200,

    // 무돌 기대값 차트
    RAINBOW_MAX_PULLS: 200    // 200회까지 표시
};
