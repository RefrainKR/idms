import { BaseGachaViewModel } from './BaseGachaViewModel.js';
import { Star3GachaModel } from '../../model/gacha/Star3GachaModel.js';
import { ProbabilityEngine } from '../../core/ProbabilityEngine.js';
import { GachaResultView } from '../../view/gacha/GachaResultView.js';
import { ToggleButton } from '../../view/component/ToggleButton.js';
import { CONFIG, TOGGLE_STATES } from '../../core/GachaConstants.js'; // (구 config.js)

export class Star3GachaViewModel extends BaseGachaViewModel {
    constructor() {
        super(CONFIG.STAR3.KEY, CONFIG.STAR3); 
        this.model = new Star3GachaModel();
        
        // HTML ID와 Model 속성 매핑
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
        super.init();

        this.bindToggles();
        this.renderPresetButtons();
        
        // 데이터 관계 설정 (maxLoops -> stepMax 등)
        this.setupDataDependencies(); 
        
        // 초기 UI 렌더링 (데이터 바인딩 직후 1회 실행 보장)
        this.updateLoopUI(this.model.loopRewards.value);

        const resetBtn = document.getElementById('resetBtn3');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }
    }

    bindToggles() {
        // 이제 콜백에서 this.calculate()를 직접 부를 필요가 없습니다. (Base에서 자동 감지)
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

        // 효율 탭 전용 버튼 노출 제어
        toggle('btnEfficiencyToggle3', isEff);
        
        // 수집/총획득 탭 전용 버튼 숨김
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
        // 1. maxLoops 변경 시 -> stepMax 업데이트 및 루프 UI 갱신
        this.model.maxLoops.subscribe((val) => {
            this.model.stepMax.value = val * 40; // Computed 값 업데이트
            this.updateLoopUI();
        });

        // 2. N(전체) -> M(저격) 종속성 관리
        this.model.pickupCount.subscribe((newN) => {
            // [UI Logic] HTML 속성 제어 (ViewModel이 DOM을 아는 것이 100% 순수하진 않지만, 바닐라 JS에선 실용적임)
            const targetInput = document.getElementById('targetCount');
            if (targetInput) {
                targetInput.max = newN;
            }

            // [Business Logic] 데이터 무결성 보장
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
            // [핵심] stepPulls는 stepMax를 자신의 한계로 삼는다.
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

        // 1. 주요 설정
        if (settings.pickupCount !== undefined) this.model.pickupCount.value = settings.pickupCount;
        if (settings.pickupRate !== undefined) this.model.pickupRate.value = settings.pickupRate;
        if (settings.maxLoops !== undefined) this.model.maxLoops.value = settings.maxLoops;
        if (settings.step4Rate !== undefined) this.model.step4Rate.value = settings.step4Rate;
        
        // 2. 횟수 초기화
        this.model.normalPulls.value = 0;
        this.model.stepPulls.value = 0;

        // 3. 보상 설정 (UI 갱신 포함)
        if (settings.rewards) {
            this.model.loopRewards.value = settings.rewards;
            this.updateLoopUI(settings.rewards);
        }
        
        this.calculate();
    }

    calculate() {
        if (this.isInitializing) return;

        // 1. Model에서 데이터 추출
        const N = Number(this.model.pickupCount.value);
        let targetVal = this.model.targetCount.value;
        let M = (targetVal === 0 || !targetVal) ? N : Number(targetVal);
        if (M > N) M = N;

        const p_indiv = Number(this.model.pickupRate.value) / 100;
        const p_step4_total = Number(this.model.step4Rate.value) / 100;
        const normalPulls = Number(this.model.normalPulls.value);
        const stepPulls = Number(this.model.stepPulls.value);
        const loopRewards = this.model.loopRewards.value;

        const p_target_one = p_indiv;
        const p_step4_one = (p_step4_total / N);

        let dp = new Array(M + 1).fill(0); dp[0] = 1.0;
        let dpTotal = [1.0];

        // --- 일반 가챠 ---

        // 총 획득 확률(p * M)이 1.0(100%)을 넘지 않도록 보정
        const p_any_normal = Math.min(p_target_one * M, 1.0);
        for (let i = 0; i < normalPulls; i++) {
            dp = ProbabilityEngine.runSinglePull(dp, p_target_one);
            dpTotal = ProbabilityEngine.accumulateCountProb(dpTotal, p_any_normal);
        }

        // --- 스탭업 가챠 ---
        let countStep4 = 0, countNormal = 0, randomCnt = 0, selectCnt = 0;
        
        for (let i = 1; i <= stepPulls; i++) {
            const isStep4 = (i % 40 === 0);
            const curLoop = Math.ceil(i / 40);
            const useStep4 = (isStep4 && this.model.step4Mode.value === 'included');
            
            if (isStep4) countStep4++; else countNormal++;

            const p = useStep4 ? p_step4_one : p_target_one;
            // 스탭업에서도 총 획득 확률 제한
            const p_any = Math.min(p * M, 1.0);

            dp = ProbabilityEngine.runSinglePull(dp, p);
            dpTotal = ProbabilityEngine.accumulateCountProb(dpTotal, p_any);

            // 보상 처리
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
        // selectCnt(selectRewardCount)는 위 스탭업 루프에서 계산됨
        const totalCeil = selectCnt + normalCeil;

        if (this.model.ceilingMode.value === 'included' && totalCeil > 0) {
            for (let i = 0; i < totalCeil; i++) {
                dp = ProbabilityEngine.runGuaranteedPull(dp);
                dpTotal = ProbabilityEngine.accumulateCountGuaranteed(dpTotal);
            }
        }

        // [수정] 효율 비교 데이터 생성 시 Best/Worst를 모두 계산해서 전달
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
            // Best(성공)와 Worst(폭사) 데이터를 객체로 저장하여 전달
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