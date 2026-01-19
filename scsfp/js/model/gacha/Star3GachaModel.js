import { Observable } from '../../core/Observable.js';

export class Star3GachaModel {
    constructor() {
        this.pickupCount = new Observable(2);
        this.pickupRate = new Observable(1.0);
        this.targetCount = new Observable(0);
        
        this.maxLoops = new Observable(2);
        this.stepMax = new Observable(80);
        this.step4Rate = new Observable(40.0);
        this.loopRewards = new Observable({});

        this.normalPulls = new Observable(0);
        this.stepPulls = new Observable(0);

        this.ceilingMode = new Observable('included');
        this.randomMode = new Observable('included');
        this.step4Mode = new Observable('included');
        this.viewMode = new Observable('individual');
        this.efficiencyMode = new Observable('best');

        // CDF 역추적용 목표 확률
        this.targetProbability = new Observable(90);
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