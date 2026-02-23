import { BaseGachaViewModel } from './BaseGachaViewModel.js';
import { CollabGachaModel } from '../../model/gacha/CollabGachaModel.js';
import { GachaResultView } from '../../view/gacha/GachaResultView.js';
import { ToggleButton } from '../../component/ToggleButton.js';
import { CONFIG, TOGGLE_STATES, GACHA_RULES } from '../../config/GachaConfig.js';
import { getGachaConfig, applyTabVisibility } from '../../view/gacha/GachaViewConfig.js';

export class CollabGachaViewModel extends BaseGachaViewModel {
    constructor() {
        super(CONFIG.COLLAB.KEY, CONFIG.COLLAB);
        this.model = new CollabGachaModel();

        this.inputsMap = {
            'collab-pickupCount': this.model.pickupCount,
            'collab-normalRate': this.model.normalRate,
            'collab-stepRate': this.model.stepRate,
            'collab-targetCount': this.model.targetCount,
            'collab-normalPulls': this.model.normalPulls,
            'collab-stepPulls': this.model.stepPulls,
            'collab-targetProbability': this.model.targetProbability
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

        this.renderPresetButtons();
        this.bindToggles();

        const resetBtn = document.getElementById('collab-reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }
    }

    getCustomBinderOptions(id) {
        if (id === 'collab-targetCount') {
            return { maxObserver: this.model.pickupCount };
        }
        return null;
    }

    renderPresetButtons() {
        const container = document.getElementById('collab-preset-container');
        if (!container || !CONFIG.COLLAB.PRESETS) return;

        container.innerHTML = '';
        CONFIG.COLLAB.PRESETS.forEach(preset => {
            const btn = document.createElement('button');
            btn.className = 'preset-btn';
            btn.textContent = preset.label;
            btn.title = preset.title;
            btn.onclick = () => this.applyPreset(preset.settings);
            container.appendChild(btn);
        });
    }

    applyPreset(settings) {
        this.isInitializing = true;

        if (settings.pickupCount !== undefined) this.model.pickupCount.value = settings.pickupCount;
        if (settings.normalRate !== undefined) this.model.normalRate.value = settings.normalRate;
        if (settings.stepRate !== undefined) this.model.stepRate.value = settings.stepRate;

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

        const result = this._runSimpleStepupCalculation({
            rules: GACHA_RULES.COLLAB,
            step3Mode: 'excluded',
            stepupLimit: GACHA_RULES.COLLAB.STEPUP_LIMIT,
            stepupGuarantee: null // 콜라보는 스탭업 확정 없음
        });

        const params = { step3Mode: 'excluded', stepupLimit: GACHA_RULES.COLLAB.STEPUP_LIMIT };

        const context = {
            N: result.N, M: result.M,
            normalRate: this.model.normalRate.value,
            stepRate: this.model.stepRate.value,
            normalPulls: result.normalPulls,
            stepPulls: result.stepPulls,
            totalPulls: result.totalPulls,
            ceilingCount: result.ceilingCount,
            stepGuaranteed: 0,
            efficiencyData: this._getSimpleStepupEfficiency(params),
            cdfData: this._getSimpleStepupCDF(params)
        };

        GachaResultView.render('collab',
            { N: result.N, M: result.M, dp: result.dp, dpTotal: result.dpTotal },
            context, this.model, this.chartRefs
        );
    }
}
