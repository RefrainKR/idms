import { BaseGachaViewModel } from './BaseGachaViewModel.js';
import { BirthdayGachaModel } from '../../model/gacha/BirthdayGachaModel.js';
import { GachaResultView } from '../../view/gacha/GachaResultView.js';
import { ToggleButton } from '../../component/ToggleButton.js';
import { CONFIG, TOGGLE_STATES, GACHA_RULES } from '../../config/GachaConfig.js';
import { getGachaConfig, applyTabVisibility } from '../../view/gacha/GachaViewConfig.js';

export class BirthdayGachaViewModel extends BaseGachaViewModel {
    constructor() {
        super(CONFIG.BIRTHDAY.KEY, CONFIG.BIRTHDAY);
        this.model = new BirthdayGachaModel();

        // GachaConfig에서 고정값 로드
        this.fixedValues = CONFIG.BIRTHDAY.FIXED_VALUES || {};

        this.inputsMap = {
            'birthday-pickupCount': this.model.pickupCount,
            'birthday-normalRate': this.model.normalRate,
            'birthday-stepRate': this.model.stepRate,
            'birthday-targetCount': this.model.targetCount,
            'birthday-normalPulls': this.model.normalPulls,
            'birthday-stepPulls': this.model.stepPulls,
            'birthday-targetProbability': this.model.targetProbability
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
     * GachaConfig의 FIXED_VALUES를 모델에 적용
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
        if (id === 'birthday-targetCount') {
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

        const step3Mode = this.model.step3Mode.value;
        const result = this._runSimpleStepupCalculation({
            rules: GACHA_RULES.BIRTHDAY,
            step3Mode,
            stepupLimit: GACHA_RULES.BIRTHDAY.STEPUP_MAX,
            stepupGuarantee: GACHA_RULES.BIRTHDAY.STEPUP_GUARANTEE
        });

        const params = { step3Mode, stepupLimit: GACHA_RULES.BIRTHDAY.STEPUP_MAX };

        const context = {
            N: result.N, M: result.M,
            normalRate: this.model.normalRate.value,
            stepRate: this.model.stepRate.value,
            normalPulls: result.normalPulls,
            stepPulls: result.stepPulls,
            totalPulls: result.totalPulls,
            ceilingCount: result.ceilingCount,
            stepGuaranteed: result.stepGuaranteed,
            efficiencyData: this._getSimpleStepupEfficiency(params),
            cdfData: this._getSimpleStepupCDF(params)
        };

        GachaResultView.render('birthday',
            { N: result.N, M: result.M, dp: result.dp, dpTotal: result.dpTotal },
            context, this.model, this.chartRefs
        );
    }
}