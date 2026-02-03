import { BaseGachaViewModel } from './BaseGachaViewModel.js';
import { CollabGachaModel } from '../../model/gacha/CollabGachaModel.js';
import { ProbabilityEngine } from '../../core/ProbabilityEngine.js';
import { EfficiencyCalculator } from '../../core/EfficiencyCalculator.js';
import { GachaResultView } from '../../view/gacha/GachaResultView.js';
import { ToggleButton } from '../../view/component/ToggleButton.js';
import { CONFIG, TOGGLE_STATES, GACHA_RULES } from '../../core/GachaConstants.js';
import { ProbabilityValidator } from '../../utils/ProbabilityValidator.js';
import { getGachaConfig, applyTabVisibility } from '../../view/gacha/GachaTypeConfig.js';

export class CollabGachaViewModel extends BaseGachaViewModel {
    constructor() {
        super(CONFIG.COLLAB.KEY, CONFIG.COLLAB);
        this.model = new CollabGachaModel();

        this.inputsMap = {
            'collabPickupCount': this.model.pickupCount,
            'collabNormalRate': this.model.normalRate,
            'collabStepRate': this.model.stepRate,
            'collabTargetCount': this.model.targetCount,
            'collabNormalPulls': this.model.normalPulls,
            'collabStepPulls': this.model.stepPulls,
            'targetProbabilityCollab': this.model.targetProbability
        };

        this.chartRefs = {
            collection: { current: null },
            total: { current: null },
            efficiency: { current: null },
            cdf: { current: null }
        };

        this.toggleButtons = {};
    }

    init() {
        super.init();

        this.initPresets();
        this.bindToggles();

        const resetBtn = document.getElementById('collab-reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }
    }

    getCustomBinderOptions(id) {
        if (id === 'collabTargetCount') {
            return { maxObserver: this.model.pickupCount };
        }
        return null;
    }

    initPresets() {
        const presets = CONFIG.COLLAB.PRESETS;
        if (!presets) return;

        for (const [key, preset] of Object.entries(presets)) {
            const btn = document.getElementById(`collab-preset-${key}`);
            if (btn) {
                btn.addEventListener('click', () => this.applyPreset(preset));
            }
        }
    }

    applyPreset(preset) {
        this.isInitializing = true;

        if (preset.pickupCount !== undefined) this.model.pickupCount.value = preset.pickupCount;
        if (preset.normalRate !== undefined) this.model.normalRate.value = preset.normalRate;
        if (preset.stepRate !== undefined) this.model.stepRate.value = preset.stepRate;

        this.isInitializing = false;
        this.calculate();
    }

    bindToggles() {
        this.toggleButtons.ceiling = new ToggleButton('collab-toggle-ceiling', TOGGLE_STATES.CEILING, (s) => {
            this.model.ceilingMode.value = s.name;
        }, this.model.ceilingMode.value);

        this.toggleButtons.view = new ToggleButton('collab-toggle-view', TOGGLE_STATES.VIEW, (s) => {
            this.model.viewMode.value = s.name;
        }, this.model.viewMode.value);

        this.toggleButtons.efficiency = new ToggleButton('collab-efficiency-toggle', TOGGLE_STATES.EFFICIENCY, (s) => {
            this.model.efficiencyMode.value = s.name;
        }, this.model.efficiencyMode.value);
    }

    onTabChange(tabId) {
        this.calculate();

        const config = getGachaConfig('collab');
        applyTabVisibility(config, tabId);
    }

    calculate() {
        if (this.isInitializing) return;

        const N = this.model.pickupCount.value;
        const targetVal = this.model.targetCount.value;

        // targetCount가 0이면 전체(N) 수집, 아니면 해당 값 사용
        let M = (targetVal === 0 || !targetVal) ? N : Number(targetVal);
        if (M > N) M = N;

        const normalRate = this.model.normalRate.value / 100;
        const stepRate = this.model.stepRate.value / 100;
        const normalPulls = this.model.normalPulls.value;
        const stepPulls = this.model.stepPulls.value;
        const totalPulls = normalPulls + stepPulls;

        let dp = new Array(M + 1).fill(0);
        dp[0] = 1.0;
        let dpTotal = [1.0];

        // 1. 일반 가챠
        const p_normal_any = ProbabilityValidator.getTotalProb(normalRate, M);

        for (let i = 0; i < normalPulls; i++) {
            dp = ProbabilityEngine.runSinglePull(dp, normalRate);
            dpTotal = ProbabilityEngine.accumulateCountProb(dpTotal, p_normal_any);
        }

        // 2. 스탭업 가챠 (확률만 변동, 확정 없음)
        const p_step_any = ProbabilityValidator.getTotalProb(stepRate, M);

        for (let i = 0; i < stepPulls; i++) {
            dp = ProbabilityEngine.runSinglePull(dp, stepRate);
            dpTotal = ProbabilityEngine.accumulateCountProb(dpTotal, p_step_any);
        }

        // 3. 천장 처리 (일반+스탭업 합산 200회당 1개)
        let ceilingCount = 0;
        if (this.model.ceilingMode.value === 'included') {
            ceilingCount = Math.floor(totalPulls / GACHA_RULES.BIRTHDAY.CEILING_INTERVAL);
            for (let i = 0; i < ceilingCount; i++) {
                dp = ProbabilityEngine.runGuaranteedPull(dp);
                dpTotal = ProbabilityEngine.accumulateCountGuaranteed(dpTotal);
            }
        }

        // 효율 비교 데이터 생성
        const efficiencyData = this._calculateEfficiencyData();

        // CDF 역추적 데이터 생성
        const cdfData = this._calculateCDFData();

        const context = {
            N, M,
            normalRate: this.model.normalRate.value,
            stepRate: this.model.stepRate.value,
            normalPulls,
            stepPulls,
            totalPulls,
            ceilingCount,
            stepGuaranteed: 0, // 콜라보는 스탭업 확정 없음
            efficiencyData,
            cdfData
        };

        // 결과 렌더링
        GachaResultView.render('collab', { N, M, dp, dpTotal }, context, this.model, this.chartRefs);
    }

    _calculateEfficiencyData() {
        const N = this.model.pickupCount.value;
        const targetVal = this.model.targetCount.value;
        let M = (targetVal === 0 || !targetVal) ? N : Number(targetVal);
        if (M > N) M = N;

        return EfficiencyCalculator.calculateSimpleStepup({
            normalRate: this.model.normalRate.value / 100,
            stepRate: this.model.stepRate.value / 100,
            ceilingMode: this.model.ceilingMode.value,
            step3Mode: 'excluded', // 콜라보는 항상 Step3 확정 없음
            N: N,
            M: M
        });
    }

    _calculateCDFData() {
        const N = this.model.pickupCount.value;
        const targetVal = this.model.targetCount.value;
        let M = (targetVal === 0 || !targetVal) ? N : Number(targetVal);
        if (M > N) M = N;

        const targetProb = this.model.targetProbability.value / 100;

        return EfficiencyCalculator.calculateSimpleStepupCDF({
            normalRate: this.model.normalRate.value / 100,
            stepRate: this.model.stepRate.value / 100,
            ceilingMode: this.model.ceilingMode.value,
            step3Mode: 'excluded', // 콜라보는 항상 Step3 확정 없음
            M: M,
            targetProb: targetProb,
            stepupLimit: 9999 // 콜라보는 스탭업 횟수 제한 없음
        });
    }
}
