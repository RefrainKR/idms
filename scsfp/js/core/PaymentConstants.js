/**
 * PaymentConstants.js
 * 과금 효율 계산에 사용되는 상수 정의
 *
 * 출처: CLAUDE.md - 유료돌 패키지 정보
 */

export const PAYMENT_CONFIG = {
    KEY: 'shani_payment_settings'
};

/**
 * 플랫폼별 패키지 정보
 * 구조: { platform: { category: { packageId: { price, paidGems, freeGems?, wings?, pieces?, ourstream?, rainbow? } } } }
 *
 * 용어:
 * - price: 가격 (엔화 또는 원화, 플랫폼별로 다름)
 * - paidGems: 유료돌 (프리즘 쥬얼)
 * - freeGems: 무료돌 (무료 프리즘 쥬얼)
 * - wings: 날개 (P카드 전용 재화)
 * - pieces: 피스 (S카드 전용 재화)
 * - rainbow: 무돌 (虹の結晶, Rainbow Crystal) - 범용 업그레이드 재화
 * - ourstream: OurSTREAM (스트리밍 컨텐츠 해금)
 *
 * 플랫폼별 통화:
 * - ASOBI: 엔화 (¥)
 * - ANDROID: 엔화 (¥)
 * - IOS: 원화 (₩)
 */
export const PACKAGES = {
    // 아소비 스토어 (Android/iOS 공유, 엔화)
    ASOBI: {
        currency: 'JPY',

        // 한정 패키지
        LIMITED: {
            'pj_release': {
                name: 'PJ 증량',
                price: 10000,
                paidGems: 10000,
                limit: 'PJ 가챠 개최 시 1회 한정'
            }
        },

        // 월 주기 패키지
        MONTHLY: {
            'monthly_platinum': {
                name: '플라티나(월)',
                price: 10000,
                paidGems: 10000,
                rainbow: 50,
                limit: '월 1회'
            }
        },

        // 상시 패키지
        NORMAL: {
            'A': { name: 'A팩', price: 160, paidGems: 85 },
            'B': { name: 'B팩', price: 480, paidGems: 380 },
            'C': { name: 'C팩', price: 1000, paidGems: 820 },
            'D': { name: 'D팩', price: 3200, paidGems: 2700, rainbow: 15 },
            'E': { name: 'E팩', price: 5000, paidGems: 4410, rainbow: 25 },
            'F': { name: 'F팩', price: 10000, paidGems: 8875, rainbow: 50 }
        }
    },

    // Android 스토어 (엔화)
    ANDROID: {
        currency: 'JPY',

        // 월 주기 패키지
        MONTHLY: {
            'monthly_b': {
                name: 'B팩 (월 주기)',
                price: 480,
                paidGems: 360,
                ourstream: 1,
                limit: '월 1회, iOS와 배타적'
            }
        },

        // 상시 패키지
        NORMAL: {
            'A': { name: 'A팩', price: 160, paidGems: 80 },
            'B': { name: 'B팩', price: 480, paidGems: 360 },
            'C': { name: 'C팩', price: 1000, paidGems: 780 },
            'D': { name: 'D팩', price: 3200, paidGems: 2570 },
            'E': { name: 'E팩', price: 5000, paidGems: 4200 },
            'F': { name: 'F팩', price: 10000, paidGems: 8450 }
        }
    },

    // iOS 스토어 (원화)
    IOS: {
        currency: 'KRW',

        // 월 주기 패키지
        MONTHLY: {
            'monthly_b': {
                name: 'B팩 (월 주기)',
                price: 4400,
                paidGems: 360,
                ourstream: 1,
                limit: '월 1회, Android와 배타적'
            }
        },

        // 상시 패키지
        NORMAL: {
            'A': { name: 'A팩', price: 1100, paidGems: 80 },
            'B': { name: 'B팩', price: 4400, paidGems: 360 },
            'C': { name: 'C팩', price: 8800, paidGems: 780 },
            'D': { name: 'D팩', price: 29000, paidGems: 2570 },
            'E': { name: 'E팩', price: 44000, paidGems: 4200 },
            'F': { name: 'F팩', price: 88000, paidGems: 8450 }
        }
    }
};

/**
 * 보너스 재화 가치 추정
 * (향후 사용자 입력 또는 역산 기능으로 대체 가능)
 */
export const BONUS_VALUES = {
    RAINBOW_PER_YEN: 0, // 무돌 1개당 엔 가치 (미정)
    WINGS_PER_YEN: 0, // 날개 1개당 엔 가치 (미정)
    PIECES_PER_YEN: 0, // 피스 1개당 엔 가치 (미정)
    OURSTREAM_PER_YEN: 0 // OurSTREAM 1개당 엔 가치 (감상용, 환산 불가)
};

/**
 * 플랫폼 표시 이름
 */
export const PLATFORM_NAMES = {
    ASOBI: '아소비 스토어',
    ANDROID: 'Android',
    IOS: 'iOS'
};

/**
 * 패키지 카테고리 표시 이름
 */
export const CATEGORY_NAMES = {
    NORMAL: '상시 패키지',
    MONTHLY: '월 주기 패키지',
    SUBSCRIPTION: '월정액 패스',
    LIMITED: '한정 패키지'
};

/**
 * 통화 기호
 */
export const CURRENCY_SYMBOLS = {
    JPY: '¥',
    KRW: '₩'
};
