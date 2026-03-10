import { BaseGachaViewModel } from './BaseGachaViewModel.js';
import { Star3GachaModel } from '../../model/gacha/Star3GachaModel.js';
import { ProbabilityEngine } from '../../core/ProbabilityEngine.js';
import { EfficiencyCalculator } from '../../core/EfficiencyCalculator.js';
import { GachaResultView } from '../../view/gacha/GachaResultView.js';
import { ToggleButton } from '../../component/ToggleButton.js';
import { CONFIG, TOGGLE_STATES, GACHA_RULES } from '../../config/GachaConfig.js';
import { ProbabilityValidator } from '../../utils/ProbabilityValidator.js';
import { getGachaConfig, applyTabVisibility } from '../../view/gacha/GachaViewConfig.js';
import { RainbowTabView } from '../../view/gacha/RainbowTabView.js';
import { RainbowCrystalCalculator } from '../../core/RainbowCrystalCalculator.js';

export class Star3GachaViewModel extends BaseGachaViewModel {
    constructor() {
        super(CONFIG.STAR3.KEY, CONFIG.STAR3); 
        this.model = new Star3GachaModel();
        
        this.inputsMap = {
            'star3-pickupCount': this.model.pickupCount,
            'star3-pickupRate': this.model.pickupRate,
            'star3-targetCount': this.model.targetCount,
            'star3-maxLoops': this.model.maxLoops,
            'star3-step4Rate': this.model.step4Rate,
            'star3-normalPulls': this.model.normalPulls,
            'star3-stepPulls': this.model.stepPulls,
            'star3-targetProbability': this.model.targetProbability,
            'rainbow-p3star': this.model.rainbow_p3star,
            'rainbow-p2star': this.model.rainbow_p2star,
            'rainbow-p1star': this.model.rainbow_p1star,
            'rainbow-pSSR':   this.model.rainbow_pSSR,
            'rainbow-pSR':    this.model.rainbow_pSR,
            'rainbow-pR':     this.model.rainbow_pR
        };
        
        this.chartRefs = { collection: { current: null }, total: { current: null }, efficiency: { current: null } };
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
        new ToggleButton('star3-rainbow-10th', TOGGLE_STATES.RAINBOW_10TH, (s) => {
            this.model.rainbow10thMode.value = s.name;
            this.renderRainbowTab();
        }, this.model.rainbow10thMode.value);

        const targetModeBtn = document.getElementById('star3-targetMode-btn');
        if (targetModeBtn) {
            targetModeBtn.addEventListener('click', () => {
                this.model.targetMode.value = this.model.targetMode.value === 'snipe' ? 'any' : 'snipe';
            });
            this.model.targetMode.subscribe((mode) => {
                targetModeBtn.textContent = mode === 'snipe' ? '저격' : '아무나';
                targetModeBtn.dataset.mode = mode;
            });
            // 초기 상태 동기화
            targetModeBtn.textContent = this.model.targetMode.value === 'snipe' ? '저격' : '아무나';
            targetModeBtn.dataset.mode = this.model.targetMode.value;
        }
    }

    onTabChange(tabId) {
        const config = getGachaConfig('star3');
        applyTabVisibility(config, tabId);

        if (tabId === 'res-3s-rainbow') {
            this.renderRainbowTab();
        } else {
            this.calculate();
        }
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
        if (id === 'star3-targetCount') {
            return { maxObserver: this.model.pickupCount };
        }
        if (id === 'star3-stepPulls') {
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
        if (settings.rainbow) {
            const r = settings.rainbow;
            if (r.p3star !== undefined) this.model.rainbow_p3star.value = r.p3star;
            if (r.p2star !== undefined) this.model.rainbow_p2star.value = r.p2star;
            if (r.p1star !== undefined) this.model.rainbow_p1star.value = r.p1star;
            if (r.pSSR   !== undefined) this.model.rainbow_pSSR.value   = r.pSSR;
            if (r.pSR    !== undefined) this.model.rainbow_pSR.value    = r.pSR;
            if (r.pR     !== undefined) this.model.rainbow_pR.value     = r.pR;
        }

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

        // 무돌 탭이 활성화된 경우 rainbow 렌더링으로 분기
        const rainbowTab = document.getElementById('res-3s-rainbow');
        if (rainbowTab && rainbowTab.classList.contains('active')) {
            this.renderRainbowTab();
            return;
        }

        const N = Number(this.model.pickupCount.value);
        let targetVal = this.model.targetCount.value;
        let M = (targetVal === 0 || !targetVal) ? N : Number(targetVal);
        if (M > N) M = N;

        const targetMode = this.model.targetMode.value;
        // 아무나 모드: dp 전이 시 capacity=N (N-k개 잔여), 저격 모드: capacity=null (M-k 기본값)
        const cap = targetMode === 'any' ? N : null;

        const p_indiv = Number(this.model.pickupRate.value) / 100;  // 개별 1명 확률
        const p_step4_total = Number(this.model.step4Rate.value) / 100;
        const normalPulls = Number(this.model.normalPulls.value);
        const stepPulls = Number(this.model.stepPulls.value);
        const loopRewards = this.model.loopRewards.value;

        const p_step4_indiv = (p_step4_total / N);  // Step4 개별 1명 확률

        let dp = new Array(M + 1).fill(0); dp[0] = 1.0;
        let dpTotal = [1.0];

        // --- 일반 가챠 ---
        // 아무나 모드: getTotalProb(p, N) — N명 중 1명 이상 획득 확률
        // 저격 모드:   getTotalProb(p, M) — M명 중 1명 이상 획득 확률
        const effectiveCount = targetMode === 'any' ? N : M;
        const p_any_normal = ProbabilityValidator.getTotalProb(p_indiv, effectiveCount);

        for (let i = 0; i < normalPulls; i++) {
            dp = ProbabilityEngine.runSinglePull(dp, p_indiv, cap);
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
            const p_any = ProbabilityValidator.getTotalProb(p, effectiveCount);

            dp = ProbabilityEngine.runSinglePull(dp, p, cap);
            dpTotal = ProbabilityEngine.accumulateCountProb(dpTotal, p_any);

            if (isStep4) {
                const reward = loopRewards[curLoop];
                if (reward === 'random') {
                    randomCnt++;
                    if (this.model.randomMode.value === 'included') {
                        dp = ProbabilityEngine.runRandomTicket(dp, N, cap);
                        dpTotal = ProbabilityEngine.accumulateCountProb(dpTotal, effectiveCount / N);
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

        const efficiencyData = this._calculateEfficiencyData(N, M, p_indiv, p_step4_total, targetMode);
        const cdfData = this._calculateCDFData(N, M, p_indiv, p_step4_total, targetMode);

        const context = {
            N, M, p_indiv: p_indiv * 100, p_step4_total: p_step4_total * 100,
            countNormal, countStep4, totalPulls: normalPulls + stepPulls,
            normalPulls, stepPulls, randomRewardCount: randomCnt,
            totalCeilingCount: totalCeil, selectRewardCount: selectCnt,
            normalCeiling: normalCeil, maxLoops: this.model.maxLoops.value,
            loopRewards, efficiencyData, efficiencyLimit: this.model.maxLoops.value * GACHA_RULES.STAR3.STEPUP_CYCLE,
            cdfData, targetMode
        };

        GachaResultView.render('star3', { N, M, dp, dpTotal }, context, this.model, this.chartRefs);
    }

    _calculateEfficiencyData(N, M, p_indiv, p_step4_total, targetMode = 'snipe') {
        return EfficiencyCalculator.calculate3Star({
            N,
            M,
            p_indiv,
            p_step4_total,
            maxLoops: this.model.maxLoops.value,
            loopRewards: this.model.loopRewards.value,
            ceilingMode: this.model.ceilingMode.value,
            step4Mode: this.model.step4Mode.value,
            randomMode: this.model.randomMode.value,
            targetMode
        });
    }

    _calculateCDFData(N, M, p_indiv, p_step4_total, targetMode = 'snipe') {
        return EfficiencyCalculator.calculate3StarCDF({
            N,
            M,
            p_indiv,
            p_step4_total,
            maxLoops: this.model.maxLoops.value,
            loopRewards: this.model.loopRewards.value,
            ceilingMode: this.model.ceilingMode.value,
            step4Mode: this.model.step4Mode.value,
            randomMode: this.model.randomMode.value,
            targetProb: this.model.targetProbability.value / 100,
            targetMode
        });
    }

    /**
     * 무돌 탭 렌더링 — RainbowTabView에 위임
     */
    renderRainbowTab() {
        const normalPulls = Number(this.model.normalPulls.value);
        const stepPulls = Number(this.model.stepPulls.value);
        const include10th = this.model.rainbow10thMode.value === 'included';

        const rates = {
            p3star: this.model.rainbow_p3star.value / 100,
            p2star: this.model.rainbow_p2star.value / 100,
            p1star: this.model.rainbow_p1star.value / 100,
            pSSR:   this.model.rainbow_pSSR.value / 100,
            pSR:    this.model.rainbow_pSR.value / 100,
            pR:     this.model.rainbow_pR.value / 100
        };

        const { total } = RainbowCrystalCalculator.calcFromInput(rates, normalPulls, include10th);
        const stepTotal = RainbowCrystalCalculator.calcStepupTotal(rates, stepPulls);

        RainbowTabView.render({
            rates, normalPulls, stepPulls, include10th,
            total, stepTotal, grandTotal: total + stepTotal
        });
    }
}