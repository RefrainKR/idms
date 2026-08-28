import { Observable } from '../../utils/Observable.js';
import { CONFIG, getInputDefaults } from '../../config/GachaConfig.js';

export class Star2GachaModel {
    constructor() {
        const def = getInputDefaults(CONFIG.STAR2.INPUTS);

        this.pickupCount = new Observable(def['star2-pickupCount']);
        this.pickupRate = new Observable(def['star2-pickupRate']);
        this.normalPulls = new Observable(def['star2-normalPulls']);

        // 그룹별 데이터 (Observable 개별 생성)
        this.countStepA = new Observable(def['star2-countStepA']); this.pullsStepA = new Observable(def['star2-pullsStepA']); this.targetCountA = new Observable(0);
        this.countStepB = new Observable(def['star2-countStepB']); this.pullsStepB = new Observable(def['star2-pullsStepB']); this.targetCountB = new Observable(0);
        this.countStepC = new Observable(def['star2-countStepC']); this.pullsStepC = new Observable(def['star2-pullsStepC']); this.targetCountC = new Observable(0);
        this.countStepD = new Observable(def['star2-countStepD']); this.pullsStepD = new Observable(def['star2-pullsStepD']); this.targetCountD = new Observable(0);

        // 옵션 (상태)
        this.ceilingMode = new Observable('included');
        this.viewMode = new Observable('individual');

        // 효율 탭 상태
        this.efficiencyMode = new Observable('best');

        this.viewTargetGroup = new Observable('ALL');
        this.efficiencyTargetGroup = new Observable('A');
    }

    /**
     * 데이터를 JSON 객체로 변환 (저장용)
     * 가챠 횟수(normalPulls, pullsStep*)는 세션마다 초기화되도록 저장하지 않음
     */
    toJSON() {
        return {
            pickupCount: this.pickupCount.value,
            pickupRate: this.pickupRate.value,

            // 그룹 A
            countStepA: this.countStepA.value,
            targetCountA: this.targetCountA.value,

            // 그룹 B
            countStepB: this.countStepB.value,
            targetCountB: this.targetCountB.value,

            // 그룹 C
            countStepC: this.countStepC.value,
            targetCountC: this.targetCountC.value,

            // 그룹 D
            countStepD: this.countStepD.value,
            targetCountD: this.targetCountD.value,

            // 토글 상태
            ceilingMode: this.ceilingMode.value,
            viewMode: this.viewMode.value,
            efficiencyMode: this.efficiencyMode.value,
            viewTargetGroup: this.viewTargetGroup.value,
            efficiencyTargetGroup: this.efficiencyTargetGroup.value
        };
    }

    /**
     * 저장된 데이터로 상태 복원 (로드용)
     */
    fromJSON(data) {
        if (!data) return;
        if (data.pickupCount !== undefined) this.pickupCount.value = data.pickupCount;
        if (data.pickupRate !== undefined) this.pickupRate.value = data.pickupRate;
        // 하위 호환: 이전 저장 데이터 (countNormal/rateTotal 키)
        if (data.countNormal !== undefined && data.pickupCount === undefined) this.pickupCount.value = data.countNormal;
        if (data.rateTotal !== undefined && data.pickupRate === undefined) this.pickupRate.value = data.rateTotal;

        ['A', 'B', 'C', 'D'].forEach(g => {
            if (data[`countStep${g}`] !== undefined) this[`countStep${g}`].value = data[`countStep${g}`];
            if (data[`targetCount${g}`] !== undefined) this[`targetCount${g}`].value = data[`targetCount${g}`];
            // pullsStep은 저장하지 않으므로 복원하지 않음 (항상 0으로 시작)
        });

        if (data.ceilingMode !== undefined) this.ceilingMode.value = data.ceilingMode;
        if (data.viewMode !== undefined) this.viewMode.value = data.viewMode;
        if (data.efficiencyMode !== undefined) this.efficiencyMode.value = data.efficiencyMode;
        if (data.viewTargetGroup !== undefined) this.viewTargetGroup.value = data.viewTargetGroup;
        if (data.efficiencyTargetGroup !== undefined) this.efficiencyTargetGroup.value = data.efficiencyTargetGroup;
    }
}
