import { Observable } from '../../utils/Observable.js';
import { SharedSettings } from '../SharedSettings.js';
import { CONFIG, getInputDefaults } from '../../config/GachaConfig.js';

export class CollabGachaModel {
    constructor() {
        const def = getInputDefaults(CONFIG.COLLAB.INPUTS);

        // 콜라보 가챠 기본 설정 (프리셋으로 변경 가능)
        this.pickupCount = new Observable(def['collab-pickupCount']);
        this.normalRate = new Observable(def['collab-normalRate']);
        this.stepRate = new Observable(def['collab-stepRate']);

        // 사용자 입력
        this.targetCount = new Observable(def['collab-targetCount']);
        this.normalPulls = new Observable(def['collab-normalPulls']);
        this.stepPulls = new Observable(def['collab-stepPulls']);

        // 옵션
        this.ceilingMode = new Observable('included');
        this.viewMode = new Observable('individual');
        this.efficiencyMode = new Observable('best');

        // CDF 역추적용 목표 확률 (공유 설정)
        this.targetProbability = SharedSettings.getInstance().targetProbability;
    }

    toJSON() {
        // 픽업 개수와 확률은 저장 (프리셋으로 변경 가능)
        // 횟수는 저장하지 않음 (매번 새로 입력)
        return {
            pickupCount: this.pickupCount.value,
            normalRate: this.normalRate.value,
            stepRate: this.stepRate.value,
            targetCount: this.targetCount.value,
            ceilingMode: this.ceilingMode.value,
            viewMode: this.viewMode.value,
            efficiencyMode: this.efficiencyMode.value
        };
    }

    fromJSON(data) {
        if (!data) return;

        // 픽업 설정
        if (data.pickupCount !== undefined) this.pickupCount.value = data.pickupCount;
        if (data.normalRate !== undefined) this.normalRate.value = data.normalRate;
        if (data.stepRate !== undefined) this.stepRate.value = data.stepRate;
        if (data.targetCount !== undefined) this.targetCount.value = data.targetCount;

        // 옵션
        if (data.ceilingMode !== undefined) this.ceilingMode.value = data.ceilingMode;
        if (data.viewMode !== undefined) this.viewMode.value = data.viewMode;
        if (data.efficiencyMode !== undefined) this.efficiencyMode.value = data.efficiencyMode;
    }
}
