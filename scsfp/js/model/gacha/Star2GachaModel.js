import { Observable } from '../../utils/Observable.js';
import { OBSERVABLE_DEFAULTS } from '../../config/UIConfig.js';

export class Star2GachaModel {
    constructor() {
        const defaults = OBSERVABLE_DEFAULTS.STAR2;

        this.countNormal = new Observable(defaults.COUNT_NORMAL.value);
        this.rateTotal = new Observable(defaults.RATE_TOTAL.value);
        this.normalPulls = new Observable(defaults.NORMAL_PULLS.value);

        // 그룹별 데이터 (Observable 개별 생성)
        this.countStepA = new Observable(defaults.GROUP_A_COUNT.value); this.pullsStepA = new Observable(defaults.GROUP_A_PULLS.value); this.targetCountA = new Observable(0);
        this.countStepB = new Observable(defaults.GROUP_B_COUNT.value); this.pullsStepB = new Observable(defaults.GROUP_B_PULLS.value); this.targetCountB = new Observable(0);
        this.countStepC = new Observable(defaults.GROUP_C_COUNT.value); this.pullsStepC = new Observable(defaults.GROUP_C_PULLS.value); this.targetCountC = new Observable(0);
        this.countStepD = new Observable(defaults.GROUP_D_COUNT.value); this.pullsStepD = new Observable(defaults.GROUP_D_PULLS.value); this.targetCountD = new Observable(0);

        // 옵션 (상태)
        this.ceilingMode = new Observable('included');
        this.viewMode = new Observable('individual');
        
        // 효율 탭 상태
        this.selectedGroup = new Observable('A');
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
            countNormal: this.countNormal.value,
            rateTotal: this.rateTotal.value,

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
            targetCountD: this.targetCountD.value
        };
    }

    /**
     * 저장된 데이터로 상태 복원 (로드용)
     */
    fromJSON(data) {
        if (!data) return;
        if (data.countNormal !== undefined) this.countNormal.value = data.countNormal;
        if (data.rateTotal !== undefined) this.rateTotal.value = data.rateTotal;

        ['A', 'B', 'C', 'D'].forEach(g => {
            if (data[`countStep${g}`] !== undefined) this[`countStep${g}`].value = data[`countStep${g}`];
            if (data[`targetCount${g}`] !== undefined) this[`targetCount${g}`].value = data[`targetCount${g}`];
            // pullsStep은 저장하지 않으므로 복원하지 않음 (항상 0으로 시작)
        });
    }
}