import { Observable } from '../../utils/Observable.js';
import { SharedSettings } from '../../core/SharedSettings.js';
import { OBSERVABLE_DEFAULTS } from '../../config/UIConfig.js';

export class Star3GachaModel {
    constructor() {
        const defaults = OBSERVABLE_DEFAULTS.STAR3;

        this.pickupCount = new Observable(defaults.PICKUP_COUNT.value);
        this.pickupRate = new Observable(defaults.PICKUP_RATE.value);
        this.targetCount = new Observable(defaults.TARGET_COUNT.value);

        this.maxLoops = new Observable(defaults.MAX_LOOPS.value);
        this.stepMax = new Observable(defaults.STEP_MAX.value);
        this.step4Rate = new Observable(defaults.STEP4_RATE.value);
        this.loopRewards = new Observable({});

        this.normalPulls = new Observable(defaults.NORMAL_PULLS.value);
        this.stepPulls = new Observable(defaults.STEP_PULLS.value);

        this.ceilingMode = new Observable('included');
        this.randomMode = new Observable('included');
        this.step4Mode = new Observable('included');
        this.viewMode = new Observable('individual');
        this.efficiencyMode = new Observable('best');

        // CDF 역추적용 목표 확률 (공유 설정)
        this.targetProbability = SharedSettings.getInstance().targetProbability;
    }

    toJSON() {
        return {
            pickupCount: this.pickupCount.value,
            pickupRate: this.pickupRate.value,
            targetCount: this.targetCount.value,
            maxLoops: this.maxLoops.value,
            step4Rate: this.step4Rate.value,
            loopRewards: this.loopRewards.value
        };
    }

    fromJSON(data) {
        if (!data) return;
        if (data.pickupCount !== undefined) this.pickupCount.value = data.pickupCount;
        if (data.pickupRate !== undefined) this.pickupRate.value = data.pickupRate;
        if (data.targetCount !== undefined) this.targetCount.value = data.targetCount;
        if (data.maxLoops !== undefined) this.maxLoops.value = data.maxLoops;
        if (data.step4Rate !== undefined) this.step4Rate.value = data.step4Rate;
        if (data.loopRewards !== undefined) this.loopRewards.value = data.loopRewards;
    }
}