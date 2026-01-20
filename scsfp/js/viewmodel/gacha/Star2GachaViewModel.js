import { BaseGachaViewModel } from './BaseGachaViewModel.js';
import { Star2GachaModel } from '../../model/gacha/Star2GachaModel.js';
import { ProbabilityEngine } from '../../core/ProbabilityEngine.js';
import { EfficiencyCalculator } from '../../core/EfficiencyCalculator.js';
import { GachaResultView } from '../../view/gacha/GachaResultView.js';
import { ToggleButton } from '../../view/component/ToggleButton.js';
import { CONFIG, TOGGLE_STATES, GACHA_RULES } from '../../core/GachaConstants.js';
import { ProbabilityValidator } from '../../utils/ProbabilityValidator.js';

export class Star2GachaViewModel extends BaseGachaViewModel {
    constructor() {
        super(CONFIG.STAR2.KEY, CONFIG.STAR2);
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

        const resetBtn = document.getElementById('resetBtn2');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }
    }

    bindToggles() {
        new ToggleButton('toggleCeilingBtn2', TOGGLE_STATES.CEILING, (state) => {
            this.model.ceilingMode.value = state.name;
        }, this.model.ceilingMode.value);

        new ToggleButton('toggleViewBtn2', TOGGLE_STATES.VIEW, (state) => {
            this.model.viewMode.value = state.name;
        }, this.model.viewMode.value);

        new ToggleButton('btnGroupViewMode', TOGGLE_STATES.GROUPS_VIEW, (s) => {
            this.model.viewTargetGroup.value = s.name;
            this.calculate();
        }, this.model.viewTargetGroup.value);

        new ToggleButton('btnGroupEfficiencyMode', TOGGLE_STATES.GROUPS_EFF, (s) => {
            this.model.efficiencyTargetGroup.value = s.name;
            this.calculate();
        }, this.model.efficiencyTargetGroup.value);

        new ToggleButton('btnEfficiencyToggle2', TOGGLE_STATES.EFFICIENCY, (s) => {
            this.model.efficiencyMode.value = s.name;
            this.calculate();
        }, this.model.efficiencyMode.value);
    }

    onTabChange(tabId) {
        this.calculate();

        const isEff = (tabId === 'res-2s-efficiency');
        const toggle = (id, show) => {
            const el = document.getElementById(id);
            if (el) el.style.display = show ? '' : 'none';
        };

        // 효율 탭
        toggle('btnEfficiencyToggle2', isEff);
        toggle('btnGroupEfficiencyMode', isEff);
        
        // 수집/이획득 탭
        toggle('toggleViewBtn2', !isEff);
        toggle('btnGroupViewMode', !isEff);
    }

    setupDataDependencies() {
        ['A', 'B', 'C', 'D'].forEach(id => {
            this.model[`countStep${id}`].subscribe((newN) => {
                // [수정] HTML 속성 변경 제거 - 로직만 처리
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

    calculate() {
        if (this.isInitializing) return;

        const rateTotal = this.model.rateTotal.value / 100;
        const N_total = this.model.countNormal.value;
        const normalPulls = this.model.normalPulls.value;

        const targetInputs = ['A', 'B', 'C', 'D'].map(id => this.model[`targetCount${id}`].value);
        const isAllZero = targetInputs.every(v => v === 0);

        const viewGroup = this.model.viewTargetGroup.value; // 'ALL', 'A'...

        const groups = ['A', 'B', 'C', 'D'].map(id => {
            const N = this.model[`countStep${id}`].value;
            let M = this.model[`targetCount${id}`].value;
            
            // [핵심] ALL 모드가 아니고 내 그룹이 아니면 저격 수 0 처리
            if (viewGroup !== 'ALL' && viewGroup !== id) {
                M = 0;
            }
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

        let dp = [1.0], dpTotal = [1.0];
        let totalTargets = 0, totalStepPulls = 0;

        groups.forEach(g => {
            // [개선] ProbabilityEngine.calcStepupGroup으로 이동
            const res = ProbabilityEngine.calcStepupGroup(g.N, g.M, g.pulls, rateTotal);
            dp = ProbabilityEngine.convolve(dp, res.dp);
            dpTotal = ProbabilityEngine.convolve(dpTotal, res.dpTotal);
            
            totalTargets += g.M;
            totalStepPulls += g.pulls;
        });

        const p_norm_one = rateTotal / N_total;
        const p_high_one = 0.95 / N_total;
        
        // [개선] 중앙화된 확률 검증 사용
        const p_norm_any = ProbabilityValidator.getTotalProb(p_norm_one, totalTargets);
        const p_high_any = ProbabilityValidator.getTotalProb(p_high_one, totalTargets);

        for (let i = 1; i <= normalPulls; i++) {
            const isHigh = (i % GACHA_RULES.STAR2.HIGH_RATE_INTERVAL === 0);
            dp = ProbabilityEngine.runSinglePull(dp, isHigh ? p_high_one : p_norm_one);
            dpTotal = ProbabilityEngine.accumulateCountProb(dpTotal, isHigh ? p_high_any : p_norm_any);
        }

        // 천장 처리
        const totalCeil = Math.floor(normalPulls / GACHA_RULES.STAR2.NORMAL_CEILING_INTERVAL) + Math.floor(totalStepPulls / GACHA_RULES.STAR2.STEPUP_CEILING_INTERVAL);
        if (this.model.ceilingMode.value === 'included') {
            for (let i = 0; i < totalCeil; i++) {
                dp = ProbabilityEngine.runGuaranteedPull(dp);
                dpTotal = ProbabilityEngine.accumulateCountGuaranteed(dpTotal);
            }
        }

        // 타겟 그룹 정보 설정
        let gid = this.model.selectedGroup.value;
        if (!gid || !['A', 'B', 'C', 'D'].includes(gid)) gid = 'A';
        
        const targetGroupInfo = { 
            id: gid, 
            M: isAllZero ? this.model[`countStep${gid}`].value : this.model[`targetCount${gid}`].value
        };

        const context = { 
            groups, totalPulls: normalPulls + totalStepPulls, 
            normalPulls, totalStepPulls, totalCeil, rateTotal,
            efficiencyData: this._calculateEfficiencyData(isAllZero),
            targetGroupInfo, N: N_total, M: totalTargets,
            ceilingMode: this.model.ceilingMode.value
        };

        GachaResultView.render2Star({ N: N_total, M: totalTargets, dp, dpTotal }, context, this.model, this.chartRefs);
    }

    _calculateEfficiencyData(isAllZero) {
        let gid = this.model.efficiencyTargetGroup.value || 'A';
        const N_group = this.model[`countStep${gid}`].value;

        let M_group = isAllZero ? N_group : this.model[`targetCount${gid}`].value;
        if (M_group > N_group) M_group = N_group;

        const N_total = this.model.countNormal.value;
        const rateTotal = this.model.rateTotal.value / 100;

        return EfficiencyCalculator.calculate2Star({
            N_group,
            M_group,
            N_total,
            rateTotal,
            ceilingMode: this.model.ceilingMode.value
        });
    }
}