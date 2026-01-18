import { BaseGachaViewModel } from './BaseGachaViewModel.js';
import { BirthdayGachaModel } from '../../model/gacha/BirthdayGachaModel.js';
import { ProbabilityEngine } from '../../core/ProbabilityEngine.js';
import { GachaResultView } from '../../view/gacha/GachaResultView.js';
import { ToggleButton } from '../../view/component/ToggleButton.js';
import { CONFIG, TOGGLE_STATES } from '../../core/GachaConstants.js';
import { ProbabilityValidator } from '../../utils/ProbabilityValidator.js';

export class BirthdayGachaViewModel extends BaseGachaViewModel {
    constructor() {
        super(CONFIG.BIRTHDAY.KEY, CONFIG.BIRTHDAY);
        this.model = new BirthdayGachaModel();
        
        this.inputsMap = {
            'birthdayNormalPulls': this.model.normalPulls,
            'birthdayStepPulls': this.model.stepPulls
        };
        
        this.chartRefs = { 
            collection: { current: null },
            total: { current: null },
            efficiency: { current: null }
        };
    }

    init() {
        super.init();

        this.bindToggles();

        const resetBtn = document.getElementById('resetBtnBirthday');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }
    }

    bindToggles() {
        new ToggleButton('toggleCeilingBtnBirthday', TOGGLE_STATES.CEILING, (s) => {
            this.model.ceilingMode.value = s.name;
        }, this.model.ceilingMode.value);

        new ToggleButton('toggleViewBtnBirthday', TOGGLE_STATES.VIEW, (s) => {
            this.model.viewMode.value = s.name;
        }, this.model.viewMode.value);

        new ToggleButton('btnEfficiencyToggleBirthday', TOGGLE_STATES.EFFICIENCY, (s) => {
            this.model.efficiencyMode.value = s.name;
        }, this.model.efficiencyMode.value);
    }

    onTabChange(tabId) {
        this.calculate();

        const isEff = (tabId === 'res-bd-efficiency');
        const toggle = (id, show) => {
            const el = document.getElementById(id);
            if (el) el.style.display = show ? '' : 'none';
        };

        // 효율 탭 전용 버튼
        toggle('btnEfficiencyToggleBirthday', isEff);
        
        // 수집/총획득 탭 전용 버튼
        toggle('toggleViewBtnBirthday', !isEff);
    }

    calculate() {
        if (this.isInitializing) return;

        const N = this.model.pickupCount.value;  // 1명 고정
        const M = 1;  // 1명 획득 목표
        
        const normalRate = this.model.normalRate.value / 100;  // 1.5%
        const stepRate = this.model.stepRate.value / 100;      // 2.0%
        const normalPulls = this.model.normalPulls.value;
        const stepPulls = this.model.stepPulls.value;
        const totalPulls = normalPulls + stepPulls;
        
        let dp = [1.0, 0];  // [0명, 1명]
        let dpTotal = [1.0];
        
        // 1. 일반 가챠 (1.5% 확률)
        const p_normal_any = ProbabilityValidator.getTotalProb(normalRate, M);
        
        for (let i = 0; i < normalPulls; i++) {
            dp = ProbabilityEngine.runSinglePull(dp, normalRate);
            dpTotal = ProbabilityEngine.accumulateCountProb(dpTotal, p_normal_any);
        }
        
        // 2. 스탭업 가챠 (2.0% 확률, 최대 30회, 30회째 100% 확정)
        for (let i = 1; i <= stepPulls; i++) {
            if (i === 30) {
                // 30회째는 100% 확정
                dp = ProbabilityEngine.runGuaranteedPull(dp);
                dpTotal = ProbabilityEngine.accumulateCountGuaranteed(dpTotal);
            } else {
                // 1~29회: 2.0% 확률
                const p_step_any = ProbabilityValidator.getTotalProb(stepRate, M);
                dp = ProbabilityEngine.runSinglePull(dp, stepRate);
                dpTotal = ProbabilityEngine.accumulateCountProb(dpTotal, p_step_any);
            }
        }
        
        // 3. 천장 처리 (일반+스탭업 합산 200회당 1개)
        let ceilingCount = 0;
        if (this.model.ceilingMode.value === 'included') {
            ceilingCount = Math.floor(totalPulls / 200);
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
            stepGuaranteed: stepPulls === 30 ? 1 : 0,
            efficiencyData
        };
        
        // 결과 렌더링 (GachaResultView 활용)
        GachaResultView.renderBirthday({ N, M, dp, dpTotal }, context, this.model, this.chartRefs);
    }

    _calculateEfficiencyData() {
        const normalRate = this.model.normalRate.value / 100;
        const stepRate = this.model.stepRate.value / 100;
        const M = 1;

        const labels = [];
        const normalData = [];
        const stepupData = [];

        for (let pulls = 0; pulls <= 200; pulls++) {
            labels.push(pulls);

            // 일반 가챠 시뮬레이션
            let dpN = [1.0, 0];
            for (let i = 0; i < pulls; i++) {
                dpN = ProbabilityEngine.runSinglePull(dpN, normalRate);
            }
            if (this.model.ceilingMode.value === 'included') {
                const nCeil = Math.floor(pulls / 200);
                for (let i = 0; i < nCeil; i++) {
                    dpN = ProbabilityEngine.runGuaranteedPull(dpN);
                }
            }
            normalData.push({ best: dpN[M] * 100, worst: dpN[0] * 100 });

            // 스탭업 가챠 시뮬레이션 (최대 30회까지만)
            let dpS = [1.0, 0];
            const stepPulls = Math.min(pulls, 30);
            
            for (let i = 1; i <= stepPulls; i++) {
                if (i === 30) {
                    dpS = ProbabilityEngine.runGuaranteedPull(dpS);
                } else {
                    dpS = ProbabilityEngine.runSinglePull(dpS, stepRate);
                }
            }
            
            // 스탭업 30회 초과분은 일반 가챠로 처리
            if (pulls > 30) {
                const extraPulls = pulls - 30;
                for (let i = 0; i < extraPulls; i++) {
                    dpS = ProbabilityEngine.runSinglePull(dpS, normalRate);
                }
            }
            
            if (this.model.ceilingMode.value === 'included') {
                const sCeil = Math.floor(pulls / 200);
                for (let i = 0; i < sCeil; i++) {
                    dpS = ProbabilityEngine.runGuaranteedPull(dpS);
                }
            }
            stepupData.push({ best: dpS[M] * 100, worst: dpS[0] * 100 });
        }

        return { labels, normalData, stepupData };
    }
}