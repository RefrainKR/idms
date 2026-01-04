import { BaseGachaModule } from './BaseGachaModule.js';
import { CONFIG, TOGGLE_STATES } from '../config.js';
import { VIEW_MODE, CEILING_MODE } from '../state.js';
import * as MathCore from '../lib/math/core.js';
import { renderResultCommon, renderTotalBarResult, renderSpecificBarResult } from '../lib/ui/uiHelper.js';
import { formatProbability } from '../lib/ui/formatter.js';

export class Star2Module extends BaseGachaModule {
    constructor() {
        super('star2', CONFIG.STAR2);
    }

    init() {
        super.initInputs();
    }

    onInputChange() {
        this.calculate();
    }

    // 2성 전용: 그룹별 DP 계산 (내부 헬퍼)
    _calculateGroupDP(N, pulls, rateTotal) {
        let dp = new Array(N + 1).fill(0); dp[0] = 1.0;
        let dpTotal = [1.0];
        if (pulls <= 0) return { dp, dpTotal };

        const p_normal = rateTotal / N;
        const p_guar = 1.0 / N;

        for (let i = 1; i <= pulls; i++) {
            const isGuar = (i === 5 || (i > 5 && (i - 5) % 10 === 0));
            const p = isGuar ? p_guar : p_normal;
            
            // 수집 확률 DP
            let nextDP = new Array(N + 1).fill(0);
            for (let k = 0; k <= N; k++) {
                if (dp[k] === 0) continue;
                if (k === N) nextDP[k] += dp[k];
                else {
                    let p_new = (N - k) * p;
                    nextDP[k] += dp[k] * (1 - p_new);
                    nextDP[k+1] += dp[k] * p_new;
                }
            }
            dp = nextDP;
            
            // 총 획득 수 DP
            dpTotal = isGuar ? MathCore.runGuaranteedTotal(dpTotal) : MathCore.runTotalCountGacha(dpTotal, rateTotal);
        }
        return { dp, dpTotal };
    }

    calculate() {
        if (this.isInitializing || !this.inputs['rate2Star']) return;

        const rateTotal = this.inputs['rate2Star'].getValue() / 100;
        const normalCount = this.inputs['countNormal2'].getValue();
        const normalPulls = this.inputs['pullsNormal2'].getValue();
        
        const groups = ['A', 'B', 'C', 'D'].map(g => ({
            id: g,
            count: this.inputs[`countStep${g}`].getValue(),
            pulls: this.inputs[`pullsStep${g}`].getValue()
        }));

        const sumGroupCounts = groups.reduce((s, g) => s + g.count, 0);
        if (normalCount !== sumGroupCounts) {
            document.getElementById('globalSummary').innerHTML = `<b style="color:red;">오류: 전체 픽업 수(${normalCount})와 그룹 합계(${sumGroupCounts})가 다릅니다.</b>`;
            return;
        }

        // 1. 스탭업 그룹별 계산 (독립 풀)
        let dp = [1.0]; 
        let dpTotal = [1.0];
        let dpSpecific = [1.0];
        let totalStepPulls = 0;

        groups.forEach(g => {
            if (g.count > 0) {
                const res = this._calculateGroupDP(g.count, g.pulls, rateTotal);
                dp = MathCore.convolveDistributions(dp, res.dp); // 수집 확률 합성
                dpTotal = MathCore.convolveDistributions(dpTotal, res.dpTotal); // 총 획득 수 합성
                totalStepPulls += g.pulls;
            }
        });

        // [중요] 합성된 dp의 크기가 전체 normalCount+1이 되도록 패딩 (0개 수집 상태 방지)
        if (dp.length < normalCount + 1) {
            const padding = new Array(normalCount + 1 - dp.length).fill(0);
            dp = [...dp, ...padding];
        }

        // 2. 일반 가챠 시행 (전체 풀 공유)
        const p_normal_one = rateTotal / normalCount;
        const p_high_one = 0.95 / normalCount;

        for (let i = 1; i <= normalPulls; i++) {
            const isHigh = (i % 10 === 0);
            const p = isHigh ? p_high_one : p_normal_one;
            const pTot = isHigh ? 0.95 : rateTotal;

            dp = MathCore.runGacha(dp, p);
            dpTotal = MathCore.runTotalCountGacha(dpTotal, pTot);
            dpSpecific = MathCore.runTotalCountGacha(dpSpecific, p);
        }

        // 3. 천장 처리
        const totalCeiling = Math.floor(normalPulls / 100) + Math.floor(totalStepPulls / 50);
        if (CEILING_MODE.star2 === 'included') {
            for (let i = 0; i < totalCeiling; i++) {
                dp = MathCore.runSelectTicket(dp);
                dpTotal = MathCore.runGuaranteedTotal(dpTotal);
                dpSpecific = MathCore.runGuaranteedTotal(dpSpecific);
            }
        }

        this.cache = { N: normalCount, dp, dpTotal, dpSpecific, context: {
            N: normalCount,
            totalPulls: normalPulls + totalStepPulls, 
            normalPulls, 
            totalStepPulls, 
            totalCeiling, 
            rateTotal,
            groups // 그룹 정보 포함
        }};
        
        this.saveData();
        this.renderUI();
    }

    renderUI() {
        // 캐시가 없거나, 현재 2성 메인 탭이 active 상태가 아니면 렌더링하지 않음
        const mainTab = document.getElementById('tab-2star');
        if (!this.cache || (mainTab && !mainTab.classList.contains('active'))) return;

        const { N, dp, dpTotal, dpSpecific, context } = this.cache;
        const activeSubTab = document.querySelector('#sub-tab-system-2star .tab-button.active')?.dataset.tab;

        const ids = { chart: 'resultChart2', legend: 'legendList2', summary: 'globalSummary', logic: 'globalLogic' };

        if (activeSubTab === 'res-2s-collection') {
            renderResultCommon(N, dp, MathCore.transformData(dp, VIEW_MODE.star2), VIEW_MODE.star2, ids, {
                summary: () => `
                    가챠 횟수 : ${context.totalPulls}회 (일반 ${context.normalPulls} + 스탭업 ${context.totalStepPulls})<br>
                    천장 교환 : ${context.totalCeiling}회 (일반 ${Math.floor(context.normalPulls/100)} + 스탭업 ${Math.floor(context.totalStepPulls/50)})<br>
                    <strong>올컴플릿 확률 : ${formatProbability(dp[N])}</strong>
                `,
                logic: () => this.generateLogicHtml(context)
            }, this.chartRefs.collection);
        } else if (activeSubTab === 'res-2s-total') {
            let expected = dpTotal.reduce((acc, p, i) => acc + i * p, 0);
            renderTotalBarResult(dpTotal, VIEW_MODE.star2, { chart: 'resultChartTotal2' }, `2성 평균 기대 획득 수: 약 <strong>${expected.toFixed(3)}개</strong>`, this.chartRefs.total);
        } else if (activeSubTab === 'res-2s-specific') {
            let expected = dpSpecific.reduce((acc, p, i) => acc + i * p, 0);
            renderSpecificBarResult(dpSpecific, VIEW_MODE.star2, { chart: 'resultChartSpecific2' }, `특정 픽업 기대 수: 약 <strong>${expected.toFixed(3)}장</strong><br><span style="font-size:0.85rem; color:#dc3545;">(천장 포함 버튼이 활성화 되어있는지 주의하세요.)</span>`, this.chartRefs.specific);
        }
    }

    generateLogicHtml(ctx) {
        const strike = (text, condition) => condition ? `<span style="text-decoration:line-through; color:#aaa;">${text}</span>` : text;
        const isCeilingOff = CEILING_MODE.star2 === 'excluded';

        // 1. 일반 가챠 통계
        let normalHigh = 0, normalBase = 0;
        for (let i = 1; i <= ctx.normalPulls; i++) {
            if (i % 10 === 0) normalHigh++;
            else normalBase++;
        }
        
        // [수정] ctx.rateTotal은 소수점(0.28)이므로 100을 곱해 %로 변환
        // ctx.N이 calculate에서 넘어왔으므로 이제 0이 아닌 정상 수치가 나옵니다.
        const pNormalIndiv = ctx.N > 0 ? (ctx.rateTotal * 100 / ctx.N).toFixed(3) : "0.000";
        const pHighIndiv = ctx.N > 0 ? (95 / ctx.N).toFixed(3) : "0.000";

        // 2. 스탭업 그룹별 통계
        let groupDetails = "";
        let totalStepNormal = 0;
        let totalStepGuar = 0;

        if (ctx.groups) {
            ctx.groups.forEach(g => {
                let gNormal = 0, gGuar = 0;
                for (let i = 1; i <= g.pulls; i++) {
                    if (i === 5 || (i > 5 && (i - 5) % 10 === 0)) gGuar++;
                    else gNormal++;
                }
                
                totalStepNormal += gNormal;
                totalStepGuar += gGuar;

                // [수정] 그룹별 확률 계산
                const pIndiv = g.count > 0 ? (ctx.rateTotal * 100 / g.count).toFixed(3) : "0.000";
                const pGuar = g.count > 0 ? (100 / g.count).toFixed(3) : "0.000";

                groupDetails += `<li>그룹 ${g.id} (${g.count}종): 개별 ${pIndiv}% (${gNormal}회), 확정 개별 ${pGuar}% (${gGuar}회)</li>`;
            });
        }

        // 3. 천장 설명
        const normalCeilingDesc = strike("일반 가챠 100회당 1개", isCeilingOff);
        const stepCeilingDesc = strike("4개 그룹 스탭업 합산 50회당 1개", isCeilingOff);
        const normalCeilingCount = Math.floor(ctx.normalPulls / 100);
        const stepCeilingCount = Math.floor(ctx.totalStepPulls / 50);

        return `
            <div class="section-header" style="cursor: pointer;">
                <span class="logic-title">상세 계산 근거</span>
                <button class="toggle-btn">▼</button>
            </div>
            <div class="section-content logic-view">
                <ul class="logic-list">
                    <li><strong>확률 적용(일반):</strong> 개별 ${pNormalIndiv}% (${normalBase}회), 보정(개별 ${pHighIndiv}%, 전체 95%) (${normalHigh}회)</li>
                    <li><strong>확률 적용(스탭업):</strong> 일반 (${totalStepNormal}회), 확정 (${totalStepGuar}회)
                        <ul style="padding-left: 20px; margin-top: 5px; list-style-type: none;">
                            ${groupDetails}
                        </ul>
                    </li>
                    <li><strong>일반 천장(${normalCeilingCount}회):</strong> ${normalCeilingDesc}</li>
                    <li><strong>스탭업 천장(${stepCeilingCount}회):</strong> ${stepCeilingDesc}</li>
                    <li><strong>알고리즘:</strong> Coupon Collector 모델 기반 Dynamic Programming</li>
                </ul>
            </div>`;
    }
}