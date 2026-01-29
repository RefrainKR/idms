import { BaseGachaViewModel } from './BaseGachaViewModel.js';
import { Star3GachaModel } from '../../model/gacha/Star3GachaModel.js';
import { ProbabilityEngine } from '../../core/ProbabilityEngine.js';
import { EfficiencyCalculator } from '../../core/EfficiencyCalculator.js';
import { GachaResultView } from '../../view/gacha/GachaResultView.js';
import { ToggleButton } from '../../view/component/ToggleButton.js';
import { CONFIG, TOGGLE_STATES, GACHA_RULES } from '../../core/GachaConstants.js';
import { ProbabilityValidator } from '../../utils/ProbabilityValidator.js';
import { getGachaConfig, applyTabVisibility } from '../../view/gacha/GachaTypeConfig.js';

export class Star3GachaViewModel extends BaseGachaViewModel {
    constructor() {
        super(CONFIG.STAR3.KEY, CONFIG.STAR3); 
        this.model = new Star3GachaModel();
        
        this.inputsMap = {
            'pickupCount': this.model.pickupCount,
            'pickupRate': this.model.pickupRate,
            'targetCount': this.model.targetCount,
            'maxLoops': this.model.maxLoops,
            'step4Rate': this.model.step4Rate,
            'normalPulls': this.model.normalPulls,
            'stepPulls': this.model.stepPulls,
            'targetProbability3': this.model.targetProbability
        };
        
        this.chartRefs = { collection: { current: null }, total: { current: null }, efficiency: { current: null }, cdf: { current: null } };
    }

    init() {
        super.init(); // fromJSON → applyDependencies → bindInputs 순서로 실행됨

        this.bindToggles();
        this.renderPresetButtons();
        this.updateLoopUI(this.model.loopRewards.value);

        const resetBtn = document.getElementById('star3-reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }
    }

    bindToggles() {
        new ToggleButton('star3-toggle-ceiling', TOGGLE_STATES.CEILING, (s) => this.model.ceilingMode.value = s.name, this.model.ceilingMode.value);
        new ToggleButton('star3-toggle-random', TOGGLE_STATES.RANDOM, (s) => this.model.randomMode.value = s.name, this.model.randomMode.value);
        new ToggleButton('star3-toggle-step4', TOGGLE_STATES.STEP4, (s) => this.model.step4Mode.value = s.name, this.model.step4Mode.value);
        new ToggleButton('star3-toggle-view', TOGGLE_STATES.VIEW, (s) => this.model.viewMode.value = s.name, this.model.viewMode.value);
        new ToggleButton('star3-efficiency-toggle', TOGGLE_STATES.EFFICIENCY, (s) => {
            this.model.efficiencyMode.value = s.name;
        }, this.model.efficiencyMode.value);
    }

    onTabChange(tabId) {
        this.calculate();

        const config = getGachaConfig('star3');
        applyTabVisibility(config, tabId);
    }
        
    renderPresetButtons() {
        const container = document.getElementById('star3-preset-container');
        if (!container || !CONFIG.STAR3.PRESETS) return;
        
        container.innerHTML = '';
        CONFIG.STAR3.PRESETS.forEach(preset => {
            const btn = document.createElement('button');
            btn.className = 'preset-btn';
            btn.textContent = preset.label;
            btn.title = preset.title;
            btn.onclick = () => this.applyPreset(preset.settings);
            container.appendChild(btn);
        });
    }

    // setupDataDependencies 제거됨 - CONFIG.STAR3.DEPENDENCIES로 대체

    getCustomBinderOptions(id) {
        if (id === 'targetCount') {
            return { maxObserver: this.model.pickupCount };
        }
        if (id === 'stepPulls') {
            return { maxObserver: this.model.stepMax }; 
        }
        return null;
    }

    updateLoopUI(savedRewards = {}) {
        const maxLoops = this.model.maxLoops.value;
        const container = document.getElementById('loopRewardsArea');
        if (!container) return;

        container.innerHTML = '';
        const currentRewards = { ...savedRewards };

        for (let i = 1; i <= maxLoops; i++) {
            const wrapper = document.createElement('div');
            wrapper.className = 'loop-reward-item';
            wrapper.innerHTML = `
                <label>${i}주 보상</label>
                <select class="loop-reward-select">
                    <option value="none">없음</option>
                    <option value="random">랜덤(픽업 티켓)</option>
                    <option value="select">천장(셀렉 티켓)</option>
                </select>
            `;
            const select = wrapper.querySelector('select');
            select.value = currentRewards[i] || 'none';
            
            select.addEventListener('change', () => {
                currentRewards[i] = select.value;
                this.model.loopRewards.value = currentRewards;
                this.calculate();
                this.save();
            });
            container.appendChild(wrapper);
        }
    }

    applyPreset(settings) {
        if (this.isInitializing) return;

        if (settings.pickupCount !== undefined) this.model.pickupCount.value = settings.pickupCount;
        if (settings.pickupRate !== undefined) this.model.pickupRate.value = settings.pickupRate;
        if (settings.maxLoops !== undefined) this.model.maxLoops.value = settings.maxLoops;
        if (settings.step4Rate !== undefined) this.model.step4Rate.value = settings.step4Rate;
        
        this.model.normalPulls.value = 0;
        this.model.stepPulls.value = 0;

        if (settings.rewards) {
            this.model.loopRewards.value = settings.rewards;
            this.updateLoopUI(settings.rewards);
        }
        
        this.calculate();
    }

    calculate() {
        if (this.isInitializing) return;

        const N = Number(this.model.pickupCount.value);
        let targetVal = this.model.targetCount.value;
        let M = (targetVal === 0 || !targetVal) ? N : Number(targetVal);
        if (M > N) M = N;

        const p_indiv = Number(this.model.pickupRate.value) / 100;  // 개별 1명 확률
        const p_step4_total = Number(this.model.step4Rate.value) / 100;
        const normalPulls = Number(this.model.normalPulls.value);
        const stepPulls = Number(this.model.stepPulls.value);
        const loopRewards = this.model.loopRewards.value;

        const p_step4_indiv = (p_step4_total / N);  // Step4 개별 1명 확률

        let dp = new Array(M + 1).fill(0); dp[0] = 1.0;
        let dpTotal = [1.0];

        // --- 일반 가챠 ---
        // p_indiv: 특정 1명을 얻을 개별 확률
        // runSinglePull 내부에서 (M-k) × p_indiv 계산
        const p_any_normal = ProbabilityValidator.getTotalProb(p_indiv, M);
        
        for (let i = 0; i < normalPulls; i++) {
            dp = ProbabilityEngine.runSinglePull(dp, p_indiv);
            dpTotal = ProbabilityEngine.accumulateCountProb(dpTotal, p_any_normal);
        }

        // --- 스탭업 가챠 ---
        let countStep4 = 0, countNormal = 0, randomCnt = 0, selectCnt = 0;
        
        for (let i = 1; i <= stepPulls; i++) {
            const isStep4 = (i % GACHA_RULES.STAR3.STEPUP_CYCLE === 0);
            const curLoop = Math.ceil(i / GACHA_RULES.STAR3.STEPUP_CYCLE);
            const useStep4 = (isStep4 && this.model.step4Mode.value === 'included');
            
            if (isStep4) countStep4++; else countNormal++;

            const p = useStep4 ? p_step4_indiv : p_indiv;
            const p_any = ProbabilityValidator.getTotalProb(p, M);

            dp = ProbabilityEngine.runSinglePull(dp, p);
            dpTotal = ProbabilityEngine.accumulateCountProb(dpTotal, p_any);

            if (isStep4) {
                const reward = loopRewards[curLoop];
                if (reward === 'random') {
                    randomCnt++;
                    if (this.model.randomMode.value === 'included') {
                        dp = ProbabilityEngine.runRandomTicket(dp, N);
                        dpTotal = ProbabilityEngine.accumulateCountProb(dpTotal, M/N);
                    }
                } else if (reward === 'select') {
                    selectCnt++;
                }
            }
        }

        // --- 천장 처리 ---
        const normalCeil = Math.floor((normalPulls + stepPulls) / GACHA_RULES.STAR3.CEILING_INTERVAL);
        const totalCeil = selectCnt + normalCeil;

        if (this.model.ceilingMode.value === 'included' && totalCeil > 0) {
            for (let i = 0; i < totalCeil; i++) {
                dp = ProbabilityEngine.runGuaranteedPull(dp);
                dpTotal = ProbabilityEngine.accumulateCountGuaranteed(dpTotal);
            }
        }

        const efficiencyData = this._calculateEfficiencyData(N, M, p_indiv, p_step4_total);
        const cdfData = this._calculateCDFData(N, M, p_indiv, p_step4_total);

        const context = {
            N, M, p_indiv: p_indiv * 100, p_step4_total: p_step4_total * 100,
            countNormal, countStep4, totalPulls: normalPulls + stepPulls,
            normalPulls, stepPulls, randomRewardCount: randomCnt,
            totalCeilingCount: totalCeil, selectRewardCount: selectCnt,
            normalCeiling: normalCeil, maxLoops: this.model.maxLoops.value,
            loopRewards, efficiencyData, efficiencyLimit: this.model.maxLoops.value * GACHA_RULES.STAR3.STEPUP_CYCLE,
            cdfData
        };

        GachaResultView.render3Star({ N, M, dp, dpTotal }, context, this.model, this.chartRefs);
    }

    _calculateEfficiencyData(N, M, p_indiv, p_step4_total) {
        return EfficiencyCalculator.calculate3Star({
            N,
            M,
            p_indiv,
            p_step4_total,
            maxLoops: this.model.maxLoops.value,
            loopRewards: this.model.loopRewards.value,
            ceilingMode: this.model.ceilingMode.value,
            step4Mode: this.model.step4Mode.value,
            randomMode: this.model.randomMode.value
        });
    }
    
    _calculateCDFData(N, M, p_indiv, p_step4_total) {
        // [개선] EfficiencyCalculator로 위임하여 중복 제거
        return EfficiencyCalculator.calculate3StarCDF({
            N,
            M,
            p_indiv,
            p_step4_total,
            maxLoops: this.model.maxLoops.value,
            loopRewards: this.model.loopRewards.value,
            ceilingMode: this.model.ceilingMode.value,
            step4Mode: this.model.step4Mode.value,
            randomMode: this.model.randomMode.value
        });
    }
}