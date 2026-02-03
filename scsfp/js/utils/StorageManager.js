import { APP_VERSION, VERSION_CONFIG, CONFIG } from '../core/GachaConstants.js';
import { SharedSettings } from '../core/SharedSettings.js';

export const StorageManager = {
    /**
     * 앱 초기화 시 버전 체크 및 마이그레이션 수행
     */
    init() {
        const savedVersion = localStorage.getItem('app_version');

        if (savedVersion !== APP_VERSION) {
            console.log(`[Migration] ${savedVersion || 'none'} → ${APP_VERSION}`);
            this.migrate(savedVersion, APP_VERSION);
            localStorage.setItem('app_version', APP_VERSION);
        }

        // 공유 설정 로드
        this.loadSharedSettings();
    },

    /**
     * 공유 설정 로드
     */
    loadSharedSettings() {
        const sharedSettings = SharedSettings.getInstance();
        const data = this.load('shani_gacha_shared');
        if (data) {
            sharedSettings.fromJSON(data);
        }
    },

    /**
     * 공유 설정 저장
     */
    saveSharedSettings() {
        const sharedSettings = SharedSettings.getInstance();
        this.save('shani_gacha_shared', sharedSettings.toJSON());
    },

    /**
     * 버전별 마이그레이션 실행
     * @param {string} fromVersion - 이전 버전
     * @param {string} toVersion - 새 버전
     */
    migrate(fromVersion, toVersion) {
        const versionChanges = VERSION_CONFIG[toVersion];
        if (!versionChanges) return;

        versionChanges.changes.forEach(change => {
            const config = CONFIG[change.gacha];
            if (!config) {
                console.warn(`[Migration] Unknown gacha type: ${change.gacha}`);
                return;
            }

            if (change.action === 'reset') {
                // 간접 참조: CONFIG에서 KEY 가져오기 (하드코딩 금지)
                localStorage.removeItem(config.KEY);
                console.log(`[Migration] Reset ${change.gacha} (${config.KEY}): ${change.reason}`);
            }
        });
    },

    load(key, defaultValue = null) {
        const item = localStorage.getItem(key);
        if (item === null) {
            return defaultValue;
        }
        try {
            return JSON.parse(item);
        } catch (e) {
            console.error(`Error parsing JSON from localStorage for key "${key}":`, e);
            localStorage.removeItem(key);
            return defaultValue;
        }
    },

    save(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(key, serializedValue);
        } catch (e) {
            console.error(`Error saving data to localStorage for key "${key}":`, e);
        }
    },

    remove(key) {
        localStorage.removeItem(key);
    }
};