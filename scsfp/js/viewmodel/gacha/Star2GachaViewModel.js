import { BaseGachaViewModel } from './BaseGachaViewModel.js';
import { Star2GachaModel } from '../../model/gacha/Star2GachaModel.js';
import { ProbabilityEngine } from '../../core/ProbabilityEngine.js';
import { GachaResultView } from '../../view/gacha/GachaResultView.js';
import { ToggleButton } from '../../view/component/ToggleButton.js';
import { CONFIG, TOGGLE_STATES } from '../../core/GachaConstants.js';

export class Star2GachaViewModel extends BaseGachaViewModel {
    constructor() {
        super(CONFIG.STAR2.KEY, CONFIG.STAR2); // config 인자 추가 확인
        this.model = new Star2GachaModel();
        
        this.inputsMap = {
            'countNormal2': this.model.countNormal,
            'rate2Star': this.model.rateTotal,
            'pullsNormal2': this.model.normalPulls,
        };
        ['A', 'B', 'C', 'D'].forEach(g => {
            this.inputsMap[`countStep${g}`] = this.model[`countStep${g}`];
            this.inputsMap[`pullsStep${g}`] = this.model[`pullsStep${g}`];
            this.inputsMap[`targetCount${g}`] = this.model[`targetCount${g}`];
        });

        this.chartRefs = { collection: { current: null }, total: { current: null }, efficiency: { current: null }, specific: { current: null } };
    }

    init() {
        super.init();

        this.bindToggles();
        this.setupDataDependencies();
    }

    bindToggles() {
        new ToggleButton('toggleCeilingBtn2', TOGGLE_STATES.CEILING, (state) => {
            this.model.ceilingMode.value = state.name;
        }, this.model.ceilingMode.value);

        new ToggleButton('toggleViewBtn2', TOGGLE_STATES.VIEW, (state) => {
            this.model.viewMode.value = state.name;
        }, this.model.viewMode.value);
        
        new ToggleButton('btnToggleGroup2', TOGGLE_STATES.GROUPS, (state) => {
            this.model.selectedGroup.value = state.name;
        }, this.model.selectedGroup.value);

        new ToggleButton('btnToggleEfficiencyMode2', TOGGLE_STATES.EFFICIENCY, (state) => {
            this.model.efficiencyMode.value = state.name;
        }, this.model.efficiencyMode.value);
    }

    setupDataDependencies() {
        ['A', 'B', 'C', 'D'].forEach(id => {
            this.model[`countStep${id}`].subscribe((newN) => {
                // UI: Max 속성 업데이트
                const targetInput = document.getElementById(`targetCount${id}`);
                if (targetInput) {
                    targetInput.max = newN;
                }
                
                // Model: 데이터 보정
                if (this.model[`targetCount${id}`].value > newN) {
                    this.model[`targetCount${id}`].value = newN;
                }
            });
        });
    }

    getCustomBinderOptions(id) {
        // id가 targetCountA 형식이면 countStepA를 감시
        if (id.startsWith('targetCount')) {
            const group = id.slice(-1); // 'A'
            return { maxObserver: this.model[`countStep${group}`] };
        }
        return null;
    }

    _calcGroup(N, M, pulls, rate) {
        let dp = new Array(M + 1).fill(0); dp[0] = 1.0;
        let dpTotal = [1.0];
        if (pulls <= 0) return { dp, dpTotal };

        const p_norm = rate / N;
        const p_guar = 1.0 / N;
        const p_norm_any = p_norm * M;
        const p_guar_any = p_guar * M;

        for (let i = 1; i <= pulls; i++) {
            const isGuar = (i === 5 || (i > 5 && (i - 5) % 10 === 0));
            dp = ProbabilityEngine.runSinglePull(dp, isGuar ? p_guar : p_norm);
            dpTotal = ProbabilityEngine.accumulateCountProb(dpTotal, isGuar ? p_guar_any : p_norm_any);
        }
        return { dp, dpTotal };
    }

    calculate() {
        if (this.isInitializing) return;

        const rateTotal = this.model.rateTotal.value / 100;
        const N_total = this.model.countNormal.value;
        const normalPulls = this.model.normalPulls.value;

        const targetInputs = ['A', 'B', 'C', 'D'].map(id => this.model[`targetCount${id}`].value);
        const isAllZero = targetInputs.every(v => v === 0);

        const groups = ['A', 'B', 'C', 'D'].map(id => {
            const N = this.model[`countStep${id}`].value;
            let M = this.model[`targetCount${id}`].value;

            if (isAllZero) {
                // 전부 0이면 기존처럼 전체 수집(M=N)으로 동작
                M = N;
            } else {
                // 하나라도 입력된 게 있다면, 0은 0으로 처리 (보정만 수행)
                if (M > N) M = N;
                if (M < 0) M = 0;
            }
            return { id, N, M, pulls: this.model[`pullsStep${id}`].value };
        });

        const sumN = groups.reduce((s, g) => s + g.N, 0);
        if (N_total !== sumN) {
            document.getElementById('globalSummary').innerHTML = `<b style="color:red">오류: 픽업 합계 불일치 (${N_total} vs ${sumN})</b>`;
            return;
        }

        let dp = [1.0], dpTotal = [1.0], dpSpecific = [1.0];
        let totalTargets = 0, totalStepPulls = 0;

        groups.forEach(g => {
            const res = this._calcGroup(g.N, g.M, g.pulls, rateTotal);
            dp = ProbabilityEngine.convolve(dp, res.dp);
            dpTotal = ProbabilityEngine.convolve(dpTotal, res.dpTotal);
            
            totalTargets += g.M;
            totalStepPulls += g.pulls;
        });

        const p_norm = rateTotal / N_total;
        const p_high = 0.95 / N_total;

        for (let i = 1; i <= normalPulls; i++) {
            const isHigh = (i % 10 === 0);
            const p = isHigh ? p_high : p_norm;
            dp = ProbabilityEngine.runSinglePull(dp, p);
            dpTotal = ProbabilityEngine.accumulateCountProb(dpTotal, p * totalTargets);
            dpSpecific = ProbabilityEngine.accumulateCountProb(dpSpecific, p);
        }

        const targetGroup = groups.reduce((p, c) => (p.pulls > c.pulls ? p : c), groups[0]);
        if (targetGroup.pulls > 0) {
            const res = this._calcGroup(targetGroup.N, 1, targetGroup.pulls, rateTotal);
            dpSpecific = ProbabilityEngine.convolve(dpSpecific, res.dpTotal);
        }

        const totalCeil = Math.floor(normalPulls / 100) + Math.floor(totalStepPulls / 50);
        if (this.model.ceilingMode.value === 'included') {
            for (let i = 0; i < totalCeil; i++) {
                dp = ProbabilityEngine.runGuaranteedPull(dp);
                dpTotal = ProbabilityEngine.accumulateCountGuaranteed(dpTotal);
                dpSpecific = ProbabilityEngine.accumulateCountGuaranteed(dpSpecific);
            }
        }

        let gid = this.model.selectedGroup.value;
        if (!gid || !['A', 'B', 'C', 'D'].includes(gid)) gid = 'A';
        
        const targetGroupInfo = { 
            id: gid, 
            M: isAllZero ? this.model[`countStep${gid}`].value : this.model[`targetCount${gid}`].value
        };

        const context = { 
            groups, totalPulls: normalPulls + totalStepPulls, 
            normalPulls, totalStepPulls, totalCeil, rateTotal,
            efficiencyData: this._calculateEfficiencyData(isAllZero), // 인자 추가
            targetGroupInfo, N: N_total, M: totalTargets,
            ceilingMode: this.model.ceilingMode.value // Logic 표시용
        };

        GachaResultView.render2Star({ N: N_total, M: totalTargets, dp, dpTotal, dpSpecific }, context, this.model, this.chartRefs);
    }

    _calculateEfficiencyData(isAllZero) {
        let gid = this.model.selectedGroup.value || 'A';
        const N_group = this.model[`countStep${gid}`].value;
        
        let M_group = isAllZero ? N_group : this.model[`targetCount${gid}`].value;
        if (M_group > N_group) M_group = N_group;

        const N_total = this.model.countNormal.value;
        const rateTotal = this.model.rateTotal.value / 100;

        const labels = [], normalData = [], stepupData = [];

        for (let pulls = 0; pulls <= 200; pulls++) {
            labels.push(pulls);
            // 일반 가챠 시뮬레이션
            let dpN = new Array(M_group + 1).fill(0); dpN[0] = 1.0;
            for (let i = 1; i <= pulls; i++) dpN = ProbabilityEngine.runSinglePull(dpN, (i % 10 === 0 ? 0.95 : rateTotal) / N_total);
            if (this.model.ceilingMode.value === 'included') {
                const ceil = Math.floor(pulls / 100);
                for (let i = 0; i < ceil; i++) dpN = ProbabilityEngine.runGuaranteedPull(dpN);
            }
            normalData.push({ best: dpN[M_group] * 100, worst: dpN[0] * 100 });

            // 스탭업 가챠 시뮬레이션
            let dpS = new Array(M_group + 1).fill(0); dpS[0] = 1.0;
            for (let i = 1; i <= pulls; i++) {
                const isGuar = (i === 5 || (i > 5 && (i - 5) % 10 === 0));
                dpS = ProbabilityEngine.runSinglePull(dpS, isGuar ? (1.0 / N_group) : (rateTotal / N_group));
            }
            if (this.model.ceilingMode.value === 'included') {
                const ceil = Math.floor(pulls / 50);
                for (let i = 0; i < ceil; i++) dpS = ProbabilityEngine.runGuaranteedPull(dpS);
            }
            stepupData.push({ best: dpS[M_group] * 100, worst: dpS[0] * 100 });
        }
        return { labels, normalData, stepupData };
    }
}