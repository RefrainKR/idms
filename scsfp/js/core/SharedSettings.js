import { Observable } from '../utils/Observable.js';

/**
 * 가챠 타입 간 공유되는 설정값 관리
 */
export class SharedSettings {
    static instance = null;

    constructor() {
        if (SharedSettings.instance) {
            return SharedSettings.instance;
        }

        // 공유 목표 확률 (3성, 생일, 콜라보 공통)
        this.targetProbability = new Observable(90);

        SharedSettings.instance = this;
    }

    static getInstance() {
        if (!SharedSettings.instance) {
            SharedSettings.instance = new SharedSettings();
        }
        return SharedSettings.instance;
    }

    toJSON() {
        return {
            targetProbability: this.targetProbability.value
        };
    }

    fromJSON(data) {
        if (!data) return;
        if (data.targetProbability !== undefined) {
            this.targetProbability.value = data.targetProbability;
        }
    }
}
