import { Observable } from '../../utils/Observable.js';
import { SharedSettings } from '../SharedSettings.js';
import { CONFIG, getInputDefaults } from '../../config/GachaConfig.js';

export class BirthdayGachaModel {
    constructor() {
        const def = getInputDefaults(CONFIG.BIRTHDAY.INPUTS);

        // 생일 가챠 기본 설정 (변경 가능성 대비)
        this.pickupCount = new Observable(def['birthday-pickupCount']);
        this.normalRate = new Observable(def['birthday-normalRate']);
        this.stepRate = new Observable(def['birthday-stepRate']);

        // 사용자 입력
        this.targetCount = new Observable(def['birthday-targetCount']);
        this.normalPulls = new Observable(def['birthday-normalPulls']);
        this.stepPulls = new Observable(def['birthday-stepPulls']);

        // 옵션
        this.ceilingMode = new Observable('included');
        this.step3Mode = new Observable('included');
        this.viewMode = new Observable('individual');
        this.efficiencyMode = new Observable('best');

        // CDF 역추적용 목표 확률 (공유 설정)
        this.targetProbability = SharedSettings.getInstance().targetProbability;
    }

    toJSON() {
        // 픽업 개수와 확률은 저장 (사용자가 커스터마이징 가능)
        // 횟수는 저장하지 않음 (매번 새로 입력)
        return {
            pickupCount: this.pickupCount.value,
            normalRate: this.normalRate.value,
            stepRate: this.stepRate.value,
            targetCount: this.targetCount.value,
            ceilingMode: this.ceilingMode.value,
            step3Mode: this.step3Mode.value,
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
        if (data.step3Mode !== undefined) this.step3Mode.value = data.step3Mode;
        if (data.viewMode !== undefined) this.viewMode.value = data.viewMode;
        if (data.efficiencyMode !== undefined) this.efficiencyMode.value = data.efficiencyMode;
    }
}
