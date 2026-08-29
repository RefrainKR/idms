import { BaseGachaViewModel } from './BaseGachaViewModel.js';
import { BirthdayGachaModel } from '../../model/gacha/BirthdayGachaModel.js';
import { GachaResultView } from '../../view/gacha/GachaResultView.js';
import { ToggleButton } from '../../component/ToggleButton.js';
import { CONFIG, TOGGLE_STATES, GACHA_RULES } from '../../config/GachaConfig.js';
import { getGachaConfig, applyTabVisibility } from '../../view/gacha/GachaViewConfig.js';
import { STEPUP_STRATEGY_KIND } from '../../core/EfficiencyCalculator.js';

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
            efficiency: { current: null }
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
        this.initSettingsUI();
        this.bindMobileCollectionViewToggle('birthday-collection-view-toggle', 'res-bd-collection');
    }

    initSettingsUI() {
        const summary = document.getElementById('birthday-banner-summary-text');
        if (!summary) return;

        const updateSummary = () => {
            summary.textContent = `${this.model.pickupCount.value}명 / 일반 ${this.model.normalRate.value}%, 스탭업 ${this.model.stepRate.value}% / 스탭업 30회`;
        };
        ['pickupCount', 'normalRate', 'stepRate'].forEach((key) => {
            this._subscriptions.push(this.model[key].subscribe(updateSummary));
        });
        updateSummary();
        this.bindSettingsDialog('birthday-settings-dialog', 'birthday-settings-open');
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

        this.toggleButtons.guaranteedTarget = new ToggleButton(
            'birthday-toggle-step3',
            TOGGLE_STATES.GUARANTEED_TARGET,
            (state) => {
                this.model.guaranteedTargetMode.value = state.name;
            },
            this.model.guaranteedTargetMode.value
        );

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

        const guaranteedTargetMode = this.model.guaranteedTargetMode.value;
        const result = this._runRateBoostStepupCalculation({
            rules: GACHA_RULES.BIRTHDAY,
            guaranteedTargetMode,
            guaranteedTargetPullInterval: GACHA_RULES.BIRTHDAY.GUARANTEED_TARGET_PULL
        });

        const strategyOptions = {
            rules: GACHA_RULES.BIRTHDAY,
            guaranteedTargetMode,
            guaranteedTargetPullInterval: GACHA_RULES.BIRTHDAY.GUARANTEED_TARGET_PULL,
            maxStepupPulls: GACHA_RULES.BIRTHDAY.MAX_STEPUP_PULLS,
            comparedStrategyKind: STEPUP_STRATEGY_KIND.STEPUP_FIRST
        };

        const context = {
            pickupCount: result.pickupCount,
            targetCount: result.targetCount,
            normalRate: this.model.normalRate.value,
            stepRate: this.model.stepRate.value,
            normalPulls: result.normalPulls,
            stepPulls: result.stepPulls,
            totalPulls: result.totalPulls,
            ceilingMode: this.model.ceilingMode.value,
            sharedSelectRewardCount: result.sharedSelectRewardCount,
            guaranteedTargetCount: result.guaranteedTargetCount,
            strategyComparison: this._calculateRateBoostStepupComparison(strategyOptions),
            completionCdf: this._calculateRateBoostStepupCompletionCdf(strategyOptions)
        };

        GachaResultView.render('birthday',
            {
                pickupCount: result.pickupCount,
                targetCount: result.targetCount,
                collectionDp: result.collectionDp,
                totalAcquisitionDp: result.totalAcquisitionDp
            },
            context, this.model, this.chartRefs
        );
    }
}
