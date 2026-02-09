/**
 * Constants.js
 * 앱 전체 상수 및 설정
 */

// ========================================
// 앱 버전 관리
// ========================================

export const APP_VERSION = '1.9.4';

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
