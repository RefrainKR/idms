import { BaseGachaViewModel } from './BaseGachaViewModel.js';
import { Star3GachaModel } from '../../model/gacha/Star3GachaModel.js';
import { ProbabilityEngine } from '../../core/ProbabilityEngine.js';
import { GachaResultView } from '../../view/gacha/GachaResultView.js';
import { ToggleButton } from '../../view/component/ToggleButton.js';
import { CONFIG, TOGGLE_STATES } from '../../core/GachaConstants.js';
import { ProbabilityValidator } from '../../utils/ProbabilityValidator.js';

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
            'stepPulls': this.model.stepPulls
        };
        
        this.chartRefs = { collection: { current: null }, total: { current: null }, efficiency: { current: null } };
    }

    init() {
        // [수정] setupDataDependencies를 super.init() 전에 호출하여
        // InputBinder가 올바른 maxObserver를 받을 수 있도록 함
        this.setupDataDependencies();
        
        super.init(); // 여기서 bindInputs()가 호출됨

        this.bindToggles();
        this.renderPresetButtons();
        this.updateLoopUI(this.model.loopRewards.value);

        const resetBtn = document.getElementById('resetBtn3');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }
    }

    bindToggles() {
        new ToggleButton('toggleCeilingBtn3', TOGGLE_STATES.CEILING, (s) => this.model.ceilingMode.value = s.name, this.model.ceilingMode.value);
        new ToggleButton('toggleRandomBtn3', TOGGLE_STATES.RANDOM, (s) => this.model.randomMode.value = s.name, this.model.randomMode.value);
        new ToggleButton('toggleStep4Btn3', TOGGLE_STATES.STEP4, (s) => this.model.step4Mode.value = s.name, this.model.step4Mode.value);
        new ToggleButton('toggleViewBtn3', TOGGLE_STATES.VIEW, (s) => this.model.viewMode.value = s.name, this.model.viewMode.value);
        new ToggleButton('btnEfficiencyToggle3', TOGGLE_STATES.EFFICIENCY, (s) => {
            this.model.efficiencyMode.value = s.name;
        }, this.model.efficiencyMode.value);
    }

    onTabChange(tabId) {
        this.calculate();

        const isEff = (tabId === 'res-3s-efficiency');
        const toggle = (id, show) => {
            const el = document.getElementById(id);
            if (el) el.style.display = show ? '' : 'none';
        };

        toggle('btnEfficiencyToggle3', isEff);
        toggle('toggleViewBtn3', !isEff);
    }
        
    renderPresetButtons() {
        const container = document.getElementById('star3PresetContainer');
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

    setupDataDependencies() {
        this.model.maxLoops.subscribe((val) => {
            this.model.stepMax.value = val * 40;
            this.updateLoopUI();
        });

        this.model.pickupCount.subscribe((newN) => {
            const targetInput = document.getElementById('targetCount');
            if (targetInput) {
                targetInput.max = newN;
            }

            if (this.model.targetCount.value > newN) {
                this.model.targetCount.value = newN;
            }
        });
    }

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
            const isStep4 = (i % 40 === 0);
            const curLoop = Math.ceil(i / 40);
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
        const normalCeil = Math.floor((normalPulls + stepPulls) / 200);
        const totalCeil = selectCnt + normalCeil;

        if (this.model.ceilingMode.value === 'included' && totalCeil > 0) {
            for (let i = 0; i < totalCeil; i++) {
                dp = ProbabilityEngine.runGuaranteedPull(dp);
                dpTotal = ProbabilityEngine.accumulateCountGuaranteed(dpTotal);
            }
        }

        const efficiencyData = this._calculateEfficiencyData(N, M, p_indiv, p_step4_total);

        const context = {
            N, M, p_indiv: p_indiv * 100, p_step4_total: p_step4_total * 100,
            countNormal, countStep4, totalPulls: normalPulls + stepPulls,
            normalPulls, stepPulls, randomRewardCount: randomCnt,
            totalCeilingCount: totalCeil, selectRewardCount: selectCnt,
            normalCeiling: normalCeil, maxLoops: this.model.maxLoops.value,
            loopRewards, efficiencyData, efficiencyLimit: this.model.maxLoops.value * 40
        };

        GachaResultView.render3Star({ N, M, dp, dpTotal }, context, this.model, this.chartRefs);
    }

    _calculateEfficiencyData(N, M, p_indiv, p_step4_total) {
        const labels = [];
        const normalData = [];
        const stepupData = [];
        const stepupLimit = this.model.maxLoops.value * 40;
        const loopRewards = this.model.loopRewards.value;

        for (let pulls = 0; pulls <= 200; pulls++) {
            labels.push(pulls);

            // 일반 가챠 시뮬레이션
            let dpN = new Array(M + 1).fill(0); dpN[0] = 1.0;
            for (let i = 0; i < pulls; i++) dpN = ProbabilityEngine.runSinglePull(dpN, p_indiv);
            if (this.model.ceilingMode.value === 'included') {
                const nCeil = Math.floor(pulls / 200);
                for (let i = 0; i < nCeil; i++) dpN = ProbabilityEngine.runGuaranteedPull(dpN);
            }
            normalData.push({ best: dpN[M] * 100, worst: dpN[0] * 100 });

            // 스탭업 가챠 시뮬레이션
            let dpS = new Array(M + 1).fill(0); dpS[0] = 1.0;
            let sSelectCnt = 0;
            for (let i = 1; i <= pulls; i++) {
                const isStep4 = (i % 40 === 0);
                const curLoop = Math.ceil(i / 40);
                const useStep4 = (isStep4 && i <= stepupLimit && this.model.step4Mode.value === 'included');
                dpS = ProbabilityEngine.runSinglePull(dpS, useStep4 ? (p_step4_total/N) : p_indiv);
                
                if (isStep4 && i <= stepupLimit) {
                    const reward = loopRewards[curLoop];
                    if (reward === 'random' && this.model.randomMode.value === 'included') dpS = ProbabilityEngine.runRandomTicket(dpS, N);
                    else if (reward === 'select') sSelectCnt++;
                }
            }
            if (this.model.ceilingMode.value === 'included') {
                const sCeil = sSelectCnt + Math.floor(pulls / 200);
                for (let i = 0; i < sCeil; i++) dpS = ProbabilityEngine.runGuaranteedPull(dpS);
            }
            stepupData.push({ best: dpS[M] * 100, worst: dpS[0] * 100 });
        }
        return { labels, normalData, stepupData };
    }
}