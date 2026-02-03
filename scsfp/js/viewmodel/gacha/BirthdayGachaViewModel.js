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

        // GachaConstants에서 고정값 로드
        this.fixedValues = CONFIG.BIRTHDAY.FIXED_VALUES || {};

        this.inputsMap = {
            'birthdayPickupCount': this.model.pickupCount,
            'birthdayNormalRate': this.model.normalRate,
            'birthdayStepRate': this.model.stepRate,
            'birthdayTargetCount': this.model.targetCount,
            'birthdayNormalPulls': this.model.normalPulls,
            'birthdayStepPulls': this.model.stepPulls,
            'targetProbabilityBirthday': this.model.targetProbability
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
        // 고정값 강제 적용 (LocalStorage 로드 전)
        this.applyFixedValues();

        super.init();

        // Input 비활성화
        this.disableFixedInputs();

        this.bindToggles();

        const resetBtn = document.getElementById('birthday-reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }
    }

    /**
     * GachaConstants의 FIXED_VALUES를 모델에 적용
     */
    applyFixedValues() {
        if (this.fixedValues.pickupCount !== undefined) {
            this.model.pickupCount.value = this.fixedValues.pickupCount;
        }
        if (this.fixedValues.normalRate !== undefined) {
            this.model.normalRate.value = this.fixedValues.normalRate;
        }
        if (this.fixedValues.stepRate !== undefined) {
            this.model.stepRate.value = this.fixedValues.stepRate;
        }
    }

    /**
     * CONFIG.INPUTS에서 fixed: true인 필드 비활성화
     */
    disableFixedInputs() {
        this.config.INPUTS
            .filter(input => input.fixed)
            .forEach(input => {
                const el = document.getElementById(input.id);
                if (el) {
                    el.disabled = true;
                    el.style.backgroundColor = 'var(--gray-100)';
                    el.style.cursor = 'not-allowed';
                }
            });
    }

    getCustomBinderOptions(id) {
        if (id === 'birthdayTargetCount') {
            return { maxObserver: this.model.pickupCount };
        }
        return null;
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
            stepGuaranteed: this.model.step3Mode.value === 'included'
                ? Math.floor(stepPulls / GACHA_RULES.BIRTHDAY.STEPUP_GUARANTEE)
                : 0,
            efficiencyData,
            cdfData
        };

        // 결과 렌더링 (GachaResultView 활용)
        GachaResultView.renderBirthday({ N, M, dp, dpTotal }, context, this.model, this.chartRefs);
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
            step3Mode: this.model.step3Mode.value,
            N: N,
            M: M,
            stepupLimit: GACHA_RULES.BIRTHDAY.STEPUP_MAX
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
            step3Mode: this.model.step3Mode.value,
            M: M,
            targetProb: targetProb,
            stepupLimit: GACHA_RULES.BIRTHDAY.STEPUP_MAX
        });
    }
}