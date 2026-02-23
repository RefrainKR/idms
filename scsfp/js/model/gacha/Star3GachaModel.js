import { Observable } from '../../utils/Observable.js';
import { SharedSettings } from '../SharedSettings.js';
import { CONFIG, getInputDefaults } from '../../config/GachaConfig.js';
import { GACHA_RULES } from '../../core/Constants.js';

export class Star3GachaModel {
    constructor() {
        const def = getInputDefaults(CONFIG.STAR3.INPUTS);

        this.pickupCount = new Observable(def['star3-pickupCount']);
        this.pickupRate = new Observable(def['star3-pickupRate']);
        this.targetCount = new Observable(def['star3-targetCount']);

        this.maxLoops = new Observable(def['star3-maxLoops']);
        this.stepMax = new Observable(def['star3-maxLoops'] * GACHA_RULES.STAR3.STEPUP_CYCLE);
        this.step4Rate = new Observable(def['star3-step4Rate']);
        this.loopRewards = new Observable({});

        this.normalPulls = new Observable(def['star3-normalPulls']);
        this.stepPulls = new Observable(def['star3-stepPulls']);

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
            loopRewards: this.loopRewards.value,
            ceilingMode: this.ceilingMode.value,
            randomMode: this.randomMode.value,
            step4Mode: this.step4Mode.value,
            viewMode: this.viewMode.value,
            efficiencyMode: this.efficiencyMode.value
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
        if (data.ceilingMode !== undefined) this.ceilingMode.value = data.ceilingMode;
        if (data.randomMode !== undefined) this.randomMode.value = data.randomMode;
        if (data.step4Mode !== undefined) this.step4Mode.value = data.step4Mode;
        if (data.viewMode !== undefined) this.viewMode.value = data.viewMode;
        if (data.efficiencyMode !== undefined) this.efficiencyMode.value = data.efficiencyMode;
    }
}
