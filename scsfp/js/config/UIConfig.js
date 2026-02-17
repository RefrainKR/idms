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

    // 무돌 기대값 차트
    RAINBOW_MAX_PULLS: 200    // 200회까지 표시
};
export const OBSERVABLE_DEFAULTS = {
    // 과금 효율 (Payment)
    PAYMENT: {
        EXCHANGE_RATE: {
            value: 950,       // 환율 (KRW per 100 JPY)
            min: 0,
            max: 9999
        },
        JPY_DISCOUNT_RATE: {
            value: 0,         // 엔화 할인율 (%)
            min: 0,
            max: 100
        },
        KRW_DISCOUNT_RATE: {
            value: 0,         // 원화 할인율 (%)
            min: 0,
            max: 100
        }
    },

    // 3성 가챠 (Star3)
    STAR3: {
        PICKUP_COUNT: {
            value: 2,
            min: 1,
            max: 100
        },
        PICKUP_RATE: {
            value: 1.0,
            min: 0,
            max: 100
        },
        TARGET_COUNT: {
            value: 0,
            min: 0,
            max: 'dynamic'    // pickupCount에 의존
        },
        MAX_LOOPS: {
            value: 2,
            min: 0,
            max: 10
        },
        STEP_MAX: {
            value: 80,        // maxLoops * 40
            min: 0,
            max: 400
        },
        STEP4_RATE: {
            value: 40.0,
            min: 0,
            max: 100
        },
        NORMAL_PULLS: {
            value: 0,
            min: 0,
            max: 9999
        },
        STEP_PULLS: {
            value: 0,
            min: 0,
            max: 'dynamic'    // stepMax에 의존
        }
    },

    // 2성 가챠 (Star2)
    STAR2: {
        COUNT_NORMAL: {
            value: 28,
            min: 1,
            max: 100
        },
        RATE_TOTAL: {
            value: 28.0,
            min: 0,
            max: 100
        },
        NORMAL_PULLS: {
            value: 0,
            min: 0,
            max: 9999
        },
        GROUP_A_COUNT: {
            value: 8,
            min: 1,
            max: 100
        },
        GROUP_B_COUNT: {
            value: 7,
            min: 1,
            max: 100
        },
        GROUP_C_COUNT: {
            value: 7,
            min: 1,
            max: 100
        },
        GROUP_D_COUNT: {
            value: 6,
            min: 1,
            max: 100
        },
        GROUP_A_PULLS: {
            value: 0,
            min: 0,
            max: 9999
        },
        GROUP_B_PULLS: {
            value: 0,
            min: 0,
            max: 9999
        },
        GROUP_C_PULLS: {
            value: 0,
            min: 0,
            max: 9999
        },
        GROUP_D_PULLS: {
            value: 0,
            min: 0,
            max: 9999
        }
    },

    // 생일 가챠 (Birthday)
    BIRTHDAY: {
        PICKUP_COUNT: {
            value: 1,
            min: 1,
            max: 10,
            fixed: true       // 고정값
        },
        NORMAL_RATE: {
            value: 1.5,
            min: 0,
            max: 100,
            fixed: true
        },
        STEP_RATE: {
            value: 2.0,
            min: 0,
            max: 100,
            fixed: true
        },
        TARGET_COUNT: {
            value: 0,
            min: 0,
            max: 10
        },
        NORMAL_PULLS: {
            value: 0,
            min: 0,
            max: 9999
        },
        STEP_PULLS: {
            value: 0,
            min: 0,
            max: 30
        }
    },

    // 콜라보 가챠 (Collab)
    COLLAB: {
        PICKUP_COUNT: {
            value: 5,
            min: 1,
            max: 10
        },
        NORMAL_RATE: {
            value: 0.75,
            min: 0,
            max: 100
        },
        STEP_RATE: {
            value: 1.0,
            min: 0,
            max: 100
        },
        TARGET_COUNT: {
            value: 0,
            min: 0,
            max: 10
        },
        NORMAL_PULLS: {
            value: 0,
            min: 0,
            max: 9999
        },
        STEP_PULLS: {
            value: 0,
            min: 0,
            max: 9999
        }
    },

    // 공통 설정 (SharedSettings)
    SHARED: {
        TARGET_PROBABILITY: {
            value: 90,        // 목표 확률 (%)
            min: 0,
            max: 100
        }
    }
};
