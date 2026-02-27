import { BaseGachaViewModel } from './BaseGachaViewModel.js';
import { Star3GachaModel } from '../../model/gacha/Star3GachaModel.js';
import { ProbabilityEngine } from '../../core/ProbabilityEngine.js';
import { EfficiencyCalculator } from '../../core/EfficiencyCalculator.js';
import { GachaResultView } from '../../view/gacha/GachaResultView.js';
import { ToggleButton } from '../../component/ToggleButton.js';
import { CONFIG, TOGGLE_STATES, GACHA_RULES } from '../../config/GachaConfig.js';
import { RAINBOW_CRYSTAL_RULES } from '../../core/Constants.js';
import { ProbabilityValidator } from '../../utils/ProbabilityValidator.js';
import { getGachaConfig, applyTabVisibility } from '../../view/gacha/GachaViewConfig.js';
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

        GachaResultView.render('star3', { N, M, dp, dpTotal }, context, this.model, this.chartRefs);
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
            randomMode: this.model.randomMode.value,
            targetProb: this.model.targetProbability.value / 100
        });
    }

    /**
     * 무돌 탭 렌더링 (카드 형태)
     */
    renderRainbowTab() {
        const resultArea = document.getElementById('rainbow-result-area');
        if (!resultArea) return;

        const normalPulls = Number(this.model.normalPulls.value);
        const include10th = this.model.rainbow10thMode.value === 'included';

        const rates = {
            p3star: this.model.rainbow_p3star.value / 100,
            p2star: this.model.rainbow_p2star.value / 100,
            p1star: this.model.rainbow_p1star.value / 100,
            pSSR:   this.model.rainbow_pSSR.value / 100,
            pSR:    this.model.rainbow_pSR.value / 100,
            pR:     this.model.rainbow_pR.value / 100
        };

        const stepPulls = Number(this.model.stepPulls.value);
        const { perPull, per10, total } = RainbowCrystalCalculator.calcFromInput(rates, normalPulls, include10th);
        const stepTotal = RainbowCrystalCalculator.calcStepupTotal(rates, stepPulls);
        const grandTotal = total + stepTotal;
        const { REWARDS } = RAINBOW_CRYSTAL_RULES;

        const breakdown_p3  = rates.p3star * REWARDS.PCARD_3STAR;
        const breakdown_p2  = rates.p2star * REWARDS.PCARD_2STAR;
        const breakdown_p1  = rates.p1star * REWARDS.PCARD_1STAR;
        const breakdown_SSR = rates.pSSR   * REWARDS.SCARD_SSR;
        const breakdown_SR  = rates.pSR    * REWARDS.SCARD_SR;
        const breakdown_R   = rates.pR     * REWARDS.SCARD_R;

        const pTotal = rates.p3star + rates.p2star + rates.p1star;
        const sTotal = rates.pSSR + rates.pSR + rates.pR;
        const sumWarning = Math.abs(pTotal + sTotal - 1.0) > 0.001
            ? `<p class="reference-caution">※ 확률 합계 ${((pTotal + sTotal) * 100).toFixed(3)}% (100%와 다름)</p>` : '';

        // summary 숨김
        const summaryEl = document.getElementById('gachaSummary');
        if (summaryEl) {
            summaryEl.style.display = 'none';
            summaryEl.innerHTML = '';
        }

        const hasAnyPulls = normalPulls > 0 || stepPulls > 0;

        // result-area: 기대값 카드
        resultArea.innerHTML = `
            <div class="rainbow-card">
                <div class="rainbow-card-title">1회 기대값</div>
                <div class="rainbow-card-value">${perPull.toFixed(3)}<span class="rainbow-unit">개</span></div>
                <div class="rainbow-card-sub">
                    P카드: 3성 ${breakdown_p3.toFixed(3)} + 2성 ${breakdown_p2.toFixed(3)} + 1성 ${breakdown_p1.toFixed(3)}<br>
                    S카드: SSR ${breakdown_SSR.toFixed(3)} + SR ${breakdown_SR.toFixed(3)} + R ${breakdown_R.toFixed(3)}
                </div>
            </div>
            <div class="rainbow-card">
                <div class="rainbow-card-title">10연 기대값${include10th ? ' <span class="rainbow-card-note">(2/SR확정 포함)</span>' : ''}</div>
                <div class="rainbow-card-value">${per10.toFixed(3)}<span class="rainbow-unit">개</span></div>
                <div class="rainbow-card-sub">10회 합산 (단차 기준: ${(perPull * 10).toFixed(3)}개)</div>
            </div>
            ${normalPulls > 0 ? `
            <div class="rainbow-card">
                <div class="rainbow-card-title">일반 기대값 (${normalPulls}회)</div>
                <div class="rainbow-card-value">${total.toFixed(2)}<span class="rainbow-unit">개</span></div>
                <div class="rainbow-card-sub">일반 가챠 ${normalPulls}회 기준</div>
            </div>` : ''}
            ${stepPulls > 0 ? `
            <div class="rainbow-card">
                <div class="rainbow-card-title">스탭업 기대값 (${stepPulls}회)</div>
                <div class="rainbow-card-value">${stepTotal.toFixed(2)}<span class="rainbow-unit">개</span></div>
                <div class="rainbow-card-sub">스탭업 가챠 ${stepPulls}회 기준</div>
            </div>` : ''}
            ${hasAnyPulls ? `
            <div class="rainbow-card rainbow-card-total">
                <div class="rainbow-card-title">합계 (${normalPulls + stepPulls}회)</div>
                <div class="rainbow-card-value">${grandTotal.toFixed(2)}<span class="rainbow-unit">개</span></div>
                <div class="rainbow-card-sub">일반 ${normalPulls}회 + 스탭업 ${stepPulls}회</div>
            </div>` : ''}
            ${sumWarning}
        `;

        // logic 영역: breakdown + 확률 상세
        const logicEl = document.getElementById('gachaLogic');
        if (logicEl) {
            // 재렌더링 전 현재 열림/닫힘 상태 보존
            const wasCollapsed = logicEl.dataset.collapsed !== 'false';

            logicEl.innerHTML = this._buildRainbowLogicDetail(rates, include10th, REWARDS, { breakdown_p3, breakdown_p2, breakdown_p1, breakdown_SSR, breakdown_SR, breakdown_R }, normalPulls, stepPulls);
            logicEl.style.display = 'block';
            const btn = logicEl.querySelector('[data-toggle-section]');
            const content = logicEl.querySelector('.section-content');
            if (btn && content) {
                if (wasCollapsed) {
                    logicEl.dataset.collapsed = 'true';
                    content.style.display = 'none';
                    btn.textContent = '▲';
                } else {
                    logicEl.dataset.collapsed = 'false';
                    content.style.display = '';
                    btn.textContent = '▼';
                }
            }
        }
    }

    _buildRainbowLogicDetail(rates, include10th, REWARDS, bd, normalPulls, stepPulls) {
        const fmt = (v) => (v * 100).toFixed(3);
        const dash = '—';

        // Step3 보정 확률 계산
        const s3 = RainbowCrystalCalculator.step3Rates(rates);
        // Step1/Normal 10회째: P카드 1성→2성, S카드 R→SR
        const r10 = { p3star: rates.p3star, p2star: rates.p2star + rates.p1star, p1star: 0, pSSR: rates.pSSR, pSR: rates.pSR + rates.pR, pR: 0 };
        // Step2/3 10회째: 게임 고정값
        const step23_10th = RainbowCrystalCalculator.step2_10thRates();

        const expBase   = RainbowCrystalCalculator.singleExpected(rates, false);
        const expS3     = RainbowCrystalCalculator.singleExpected(s3, false);
        const exp10th   = RainbowCrystalCalculator.singleExpected(r10, false);
        const expS23    = RainbowCrystalCalculator.singleExpected(step23_10th, false);

        // 일반 10회째 행 (include10th가 참일 때만 표시)
        const normal10thRow = include10th ? `
                        <tr class="logic-table-confirm">
                            <td>통상 10회째 확정<br><small>(게임 자동 적용)</small></td>
                            <td>${fmt(r10.p3star)}%</td>
                            <td>${fmt(r10.p2star)}%</td>
                            <td>0%</td>
                            <td>${fmt(r10.pSSR)}%</td>
                            <td>${fmt(r10.pSR)}%</td>
                            <td>0%</td>
                            <td>${exp10th.toFixed(2)}개</td>
                        </tr>` : '';

        // 스탭업 전용 행들 (stepPulls > 0일 때만 표시)
        const stepupRows = stepPulls > 0 ? `
                        <tr>
                            <td>Step3 1~9회<br><small>(3성/SSR 2배 보정)</small></td>
                            <td>${fmt(s3.p3star)}%</td>
                            <td>${fmt(s3.p2star)}%</td>
                            <td>${fmt(s3.p1star)}%</td>
                            <td>${fmt(s3.pSSR)}%</td>
                            <td>${fmt(s3.pSR)}%</td>
                            <td>${fmt(s3.pR)}%</td>
                            <td>${expS3.toFixed(2)}개</td>
                        </tr>
                        <tr class="logic-table-confirm">
                            <td>Step2/3 10회째 확정<br><small>(게임 고정값)</small></td>
                            <td>10%</td>
                            <td>56%</td>
                            <td>0%</td>
                            <td>6%</td>
                            <td>28%</td>
                            <td>0%</td>
                            <td>${expS23.toFixed(2)}개</td>
                        </tr>
                        <tr class="logic-table-confirm">
                            <td>Step4 40회째 확정<br><small>(★3/SSR 확정枠)</small></td>
                            <td>60%</td>
                            <td>${dash}</td>
                            <td>${dash}</td>
                            <td>40%</td>
                            <td>${dash}</td>
                            <td>${dash}</td>
                            <td>25.00개</td>
                        </tr>` : '';

        return `
            <div class="section-header">
                <span class="logic-title">상세 계산 근거</span>
                <button class="toggle-btn" data-toggle-section>▼</button>
            </div>
            <div class="section-content logic-view">
                <ul class="logic-list">
                    <li>일반 가챠: ${normalPulls}회 / 스탭업 가챠: ${stepPulls}회</li>
                    <li>2/SR확정 보정 (일반): ${include10th ? '포함 (10연 단위)' : '미포함 (단차 기준)'}</li>
                    <li>알고리즘: 기대값 선형 합산 / Step4 40회째 항상 중복 가정 (25무돌 고정)</li>
                </ul>
                <table class="data-table" style="margin-top:8px; font-size:0.82rem;">
                    <thead>
                        <tr>
                            <th>구간</th>
                            <th>3성(P)</th>
                            <th>2성(P)</th>
                            <th>1성(P)</th>
                            <th>SSR(S)</th>
                            <th>SR(S)</th>
                            <th>R(S)</th>
                            <th>기대 무돌</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>통상 1~9회</td>
                            <td>${fmt(rates.p3star)}%</td>
                            <td>${fmt(rates.p2star)}%</td>
                            <td>${fmt(rates.p1star)}%</td>
                            <td>${fmt(rates.pSSR)}%</td>
                            <td>${fmt(rates.pSR)}%</td>
                            <td>${fmt(rates.pR)}%</td>
                            <td>${expBase.toFixed(2)}개</td>
                        </tr>
                        ${normal10thRow}
                        ${stepupRows}
                    </tbody>
                </table>
            </div>`;
    }
}