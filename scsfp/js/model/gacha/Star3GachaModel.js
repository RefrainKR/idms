import { Observable } from '../../utils/Observable.js';
import { SharedSettings } from '../SharedSettings.js';
import { CONFIG, getInputDefaults } from '../../config/GachaConfig.js';
import { GACHA_RULES, RAINBOW_CRYSTAL_RULES } from '../../core/Constants.js';

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

        // 무돌 탭 - 확률 입력값 (기본값: 현재 게임 확률)
        const R = RAINBOW_CRYSTAL_RULES.STAR3_RATES;
        this.rainbow_p3star = new Observable(R.PCARD_3STAR * 100);   // P카드 3성 %
        this.rainbow_p2star = new Observable(R.PCARD_2STAR * 100);   // P카드 2성 %
        this.rainbow_p1star = new Observable(R.PCARD_1STAR * 100);   // P카드 1성 %
        this.rainbow_pSSR   = new Observable(R.SCARD_SSR * 100);    // S카드 SSR %
        this.rainbow_pSR    = new Observable(R.SCARD_SR * 100);     // S카드 SR %
        this.rainbow_pR     = new Observable(R.SCARD_R * 100);      // S카드 R %
        this.rainbow10thMode = new Observable('included');            // 2/SR확정 포함 여부

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
            efficiencyMode: this.efficiencyMode.value,
            rainbow_p3star: this.rainbow_p3star.value,
            rainbow_p2star: this.rainbow_p2star.value,
            rainbow_p1star: this.rainbow_p1star.value,
            rainbow_pSSR: this.rainbow_pSSR.value,
            rainbow_pSR: this.rainbow_pSR.value,
            rainbow_pR: this.rainbow_pR.value,
            rainbow10thMode: this.rainbow10thMode.value
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
        if (data.rainbow_p3star !== undefined) this.rainbow_p3star.value = data.rainbow_p3star;
        if (data.rainbow_p2star !== undefined) this.rainbow_p2star.value = data.rainbow_p2star;
        if (data.rainbow_p1star !== undefined) this.rainbow_p1star.value = data.rainbow_p1star;
        if (data.rainbow_pSSR !== undefined) this.rainbow_pSSR.value = data.rainbow_pSSR;
        if (data.rainbow_pSR !== undefined) this.rainbow_pSR.value = data.rainbow_pSR;
        if (data.rainbow_pR !== undefined) this.rainbow_pR.value = data.rainbow_pR;
        if (data.rainbow10thMode !== undefined) this.rainbow10thMode.value = data.rainbow10thMode;
    }
}
