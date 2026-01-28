import { BaseGachaViewModel } from './BaseGachaViewModel.js';
import { BirthdayGachaModel } from '../../model/gacha/BirthdayGachaModel.js';
import { ProbabilityEngine } from '../../core/ProbabilityEngine.js';
import { EfficiencyCalculator } from '../../core/EfficiencyCalculator.js';
import { GachaResultView } from '../../view/gacha/GachaResultView.js';
import { ToggleButton } from '../../view/component/ToggleButton.js';
import { CONFIG, TOGGLE_STATES, GACHA_RULES } from '../../core/GachaConstants.js';
import { ProbabilityValidator } from '../../utils/ProbabilityValidator.js';
import { getGachaConfig, applyTabVisibility } from '../../view/gacha/GachaTypeConfig.js';

export class BirthdayGachaViewModel extends BaseGachaViewModel {
    constructor() {
        super(CONFIG.BIRTHDAY.KEY, CONFIG.BIRTHDAY);
        this.model = new BirthdayGachaModel();
        
        this.inputsMap = {
            'birthdayPickupCount': this.model.pickupCount,
            'birthdayNormalRate': this.model.normalRate,
            'birthdayStepRate': this.model.stepRate,
            'birthdayTargetCount': this.model.targetCount,
            'birthdayNormalPulls': this.model.normalPulls,
            'birthdayStepPulls': this.model.stepPulls
        };
        
        this.chartRefs = {
            collection: { current: null },
            total: { current: null },
            efficiency: { current: null }
        };

        this.toggleButtons = {};
    }

    init() {
        super.init();

        this.bindToggles();
        this.initPresets();

        const resetBtn = document.getElementById('birthday-reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }
    }

    getCustomBinderOptions(id) {
        if (id === 'birthdayTargetCount') {
            return { maxObserver: this.model.pickupCount };
        }
        return null;
    }

    initPresets() {
        const container = document.getElementById('birthday-preset-container');
        if (!container) return;

        const presets = CONFIG.BIRTHDAY.PRESETS;
        Object.keys(presets).forEach(key => {
            const preset = presets[key];
            const btn = document.createElement('button');
            btn.className = 'preset-btn';
            btn.textContent = preset.label;
            btn.addEventListener('click', () => this.applyPreset(preset));
            container.appendChild(btn);
        });
    }

    applyPreset(preset) {
        this.isInitializing = true;
        this.model.pickupCount.value = preset.pickupCount;
        this.model.normalRate.value = preset.normalRate;
        this.model.stepRate.value = preset.stepRate;
        this.model.step3Mode.value = preset.step3Mode;

        // Step3 토글 버튼 상태 업데이트
        if (this.toggleButtons.step3) {
            this.toggleButtons.step3.setState(preset.step3Mode);
        }

        this.isInitializing = false;
        this.calculate();
    }

    bindToggles() {
        this.toggleButtons.ceiling = new ToggleButton('birthday-toggle-ceiling', TOGGLE_STATES.CEILING, (s) => {
            this.model.ceilingMode.value = s.name;
        }, this.model.ceilingMode.value);

        this.toggleButtons.step3 = new ToggleButton('birthday-toggle-step3', TOGGLE_STATES.STEP3, (s) => {
            this.model.step3Mode.value = s.name;
        }, this.model.step3Mode.value);

        this.toggleButtons.view = new ToggleButton('birthday-toggle-view', TOGGLE_STATES.VIEW, (s) => {
            this.model.viewMode.value = s.name;
        }, this.model.viewMode.value);

        this.toggleButtons.efficiency = new ToggleButton('birthday-efficiency-toggle', TOGGLE_STATES.EFFICIENCY, (s) => {
            this.model.efficiencyMode.value = s.name;
        }, this.model.efficiencyMode.value);
    }

    onTabChange(tabId) {
        this.calculate();

        const config = getGachaConfig('birthday');
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
        
        // 1. 일반 가챠 (1.5% 확률)
        const p_normal_any = ProbabilityValidator.getTotalProb(normalRate, M);
        
        for (let i = 0; i < normalPulls; i++) {
            dp = ProbabilityEngine.runSinglePull(dp, normalRate);
            dpTotal = ProbabilityEngine.accumulateCountProb(dpTotal, p_normal_any);
        }
        
        // 2. 스탭업 가챠 (스탭업 확률, Step3 확정 옵션)
        const step3Mode = this.model.step3Mode.value;
        const p_step_any = ProbabilityValidator.getTotalProb(stepRate, M);

        for (let i = 1; i <= stepPulls; i++) {
            const isStep3 = (i % GACHA_RULES.BIRTHDAY.STEPUP_GUARANTEE === 0);

            if (isStep3 && step3Mode === 'included') {
                // 30회, 60회, 90회... Step3 확정
                dp = ProbabilityEngine.runGuaranteedPull(dp);
                dpTotal = ProbabilityEngine.accumulateCountGuaranteed(dpTotal);
            } else {
                // 일반 스탭업 확률
                dp = ProbabilityEngine.runSinglePull(dp, stepRate);
                dpTotal = ProbabilityEngine.accumulateCountProb(dpTotal, p_step_any);
            }
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
        
        const context = {
            N, M,
            normalRate: this.model.normalRate.value,
            stepRate: this.model.stepRate.value,
            normalPulls,
            stepPulls,
            totalPulls,
            ceilingCount,
            stepGuaranteed: this.model.step3Mode.value === 'included'
                ? Math.floor(stepPulls / GACHA_RULES.BIRTHDAY.STEPUP_GUARANTEE)
                : 0,
            efficiencyData
        };
        
        // 결과 렌더링 (GachaResultView 활용)
        GachaResultView.renderBirthday({ N, M, dp, dpTotal }, context, this.model, this.chartRefs);
    }

    _calculateEfficiencyData() {
        const N = this.model.pickupCount.value;
        const targetVal = this.model.targetCount.value;
        let M = (targetVal === 0 || !targetVal) ? N : Number(targetVal);
        if (M > N) M = N;

        return EfficiencyCalculator.calculateBirthday({
            normalRate: this.model.normalRate.value / 100,
            stepRate: this.model.stepRate.value / 100,
            ceilingMode: this.model.ceilingMode.value,
            step3Mode: this.model.step3Mode.value,
            N: N,
            M: M
        });
    }
}