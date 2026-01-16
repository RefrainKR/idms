import { BaseGachaModule } from './BaseGachaModule.js';
import { CONFIG, TOGGLE_STATES } from '../config.js';
import { VIEW_MODE, CEILING_MODE } from '../state.js';
import * as MathCore from '../lib/math/core.js';
import { renderResultCommon, renderTotalBarResult, renderSpecificBarResult } from '../lib/ui/uiHelper.js';
import { formatProbability } from '../lib/ui/formatter.js';
import { renderLineChart } from '../lib/ui/chartHandler.js';
import { ToggleButtonElement } from '../lib/utils/ToggleButtonElement.js';

export class Star2Module extends BaseGachaModule {
    constructor() {
        super('star2', CONFIG.STAR2);
        this.selectedGroup = 'A';
        this.isWorstMode = false;
    }

    init() {
        super.initInputs();

        new ToggleButtonElement('btnToggleGroup2', TOGGLE_STATES.GROUPS, (name) => {
            this.selectedGroup = name;
            this.renderEfficiencyComparison();
        });
        new ToggleButtonElement('btnToggleEfficiencyMode2', TOGGLE_STATES.EFFICIENCY, (name) => {
            this.isWorstMode = (name === 'worst');
            this.renderEfficiencyComparison();
        });
    }

    onInputChange() {
        this.calculate();
    }

    _calculateGroupDP(N, M, pulls, rateTotal) {
        // M개의 타겟을 모으는 상태 배열 (크기 M+1)
        let dp = new Array(M + 1).fill(0); dp[0] = 1.0;
        let dpTotal = [1.0];
        if (pulls <= 0) return { dp, dpTotal };

        const p_normal_one = rateTotal / N;
        const p_guar_one = 1.0 / N;
        const p_normal_any = p_normal_one * M; // 타겟 중 아무나
        const p_guar_any = p_guar_one * M;     // 타겟 중 아무나

        for (let i = 1; i <= pulls; i++) {
            const isGuar = (i === 5 || (i > 5 && (i - 5) % 10 === 0));
            const p_one = isGuar ? p_guar_one : p_normal_one;
            const p_any = isGuar ? p_guar_any : p_normal_any;
            
            // 수집 DP
            let nextDP = new Array(M + 1).fill(0);
            for (let k = 0; k <= M; k++) {
                if (dp[k] === 0) continue;
                if (k === M) nextDP[k] += dp[k];
                else {
                    let p_new = (M - k) * p_one;
                    nextDP[k] += dp[k] * (1 - p_new);
                    nextDP[k+1] += dp[k] * p_new;
                }
            }
            dp = nextDP;
            
            // 총 획득 수 DP
            dpTotal = MathCore.runTotalCountGacha(dpTotal, p_any);
        }
        return { dp, dpTotal };
    }

    calculate() {
        if (this.isInitializing || !this.inputs['rate2Star']) return;

        const rateTotal = this.inputs['rate2Star'].getValue() / 100;
        const normalCount = this.inputs['countNormal2'].getValue();
        const normalPulls = this.inputs['pullsNormal2'].getValue();
        
        // 1. 그룹 정보 및 저격(M) 설정 수집
        const groups = ['A', 'B', 'C', 'D'].map(id => {
            const count = this.inputs[`countStep${id}`].getValue();
            let target = this.inputs[`targetCount${id}`].getValue();
            // 타겟이 0이거나 전체보다 크면 전체(count)로 보정
            if (target <= 0 || target > count) target = count;
            return { id, count, pulls: this.inputs[`pullsStep${id}`].getValue(), M: target };
        });

        // 특수 조건: 사용자가 타겟 수를 하나도 입력하지 않았을 경우 (전부 0)
        const userInputs = ['A', 'B', 'C', 'D'].map(id => this.inputs[`targetCount${id}`].getValue());
        const isAllZero = userInputs.every(v => v === 0);
        
        // 전체 타겟 수 합계 (예: A(2) + B(1) = 3)
        let totalTargets = groups.reduce((s, g) => s + g.M, 0);

        const sumGroupCounts = groups.reduce((s, g) => s + g.count, 0);
        if (normalCount !== sumGroupCounts) {
            document.getElementById('globalSummary').innerHTML = `<b style="color:red;">오류: 전체 픽업 수(${normalCount})와 그룹 합계(${sumGroupCounts})가 다릅니다.</b>`;
            return;
        }

        let dp = [1.0], dpTotal = [1.0], dpSpecific = [1.0];
        let totalStepPulls = 0;

        // 2. 스탭업 그룹별 계산 및 합성
        groups.forEach(g => {
            if (g.count > 0) {
                // 저격 대상이 전혀 없는 그룹(입력 0)이면서, 다른 그룹에는 저격 대상이 있는 경우 -> 해당 그룹은 M=0으로 처리하여 스킵
                const actualM = (!isAllZero && this.inputs[`targetCount${g.id}`].getValue() === 0) ? 0 : g.M;
                
                const res = this._calculateGroupDP(g.count, actualM, g.pulls, rateTotal);
                dp = MathCore.convolveDistributions(dp, res.dp);
                dpTotal = MathCore.convolveDistributions(dpTotal, res.dpTotal);
                totalStepPulls += g.pulls;
            }
        });

        // [중요] 타겟 수 재정산 (0을 입력한 그룹은 M=0으로 쳐서 합성했으므로, dp의 길이가 최종 타겟 수+1 이 됨)
        totalTargets = dp.length - 1;

        // 3. 일반 가챠 시행 (totalTargets 기준)
        const p_norm_one = rateTotal / normalCount;
        const p_high_one = 0.95 / normalCount;
        const p_norm_any = p_norm_one * totalTargets;
        const p_high_any = p_high_one * totalTargets;

        for (let i = 1; i <= normalPulls; i++) {
            const isHigh = (i % 10 === 0);
            const p_one = isHigh ? p_high_one : p_norm_one;
            const p_any = isHigh ? p_high_any : p_norm_any;

            dp = MathCore.runGacha(dp, p_one); // 크기는 totalTargets로 자동 고정됨
            dpTotal = MathCore.runTotalCountGacha(dpTotal, p_any);
        }

        // 4. 특정 1명(날개) 스탭업 반영 (가장 많이 돌린 그룹 기준)
        const targetGroup = groups.reduce((prev, curr) => (prev.pulls > curr.pulls ? prev : curr), groups[0]);
        if (targetGroup.count > 0 && targetGroup.pulls > 0) {
            const p_spec_norm = rateTotal / targetGroup.count;
            const p_spec_guar = 1.0 / targetGroup.count;
            for (let i = 1; i <= targetGroup.pulls; i++) {
                const isGuar = (i === 5 || (i > 5 && (i - 5) % 10 === 0));
                dpSpecific = MathCore.runTotalCountGacha(dpSpecific, isGuar ? p_spec_guar : p_spec_norm);
            }
        }
        // 일반 가챠 및 특정 1명 처리
        for (let i = 1; i <= normalPulls; i++) {
            const isHigh = (i % 10 === 0);
            dpSpecific = MathCore.runTotalCountGacha(dpSpecific, isHigh ? p_high_one : p_norm_one);
        }

        // 5. 천장 처리
        const totalCeiling = Math.floor(normalPulls / 100) + Math.floor(totalStepPulls / 50);
        if (CEILING_MODE.star2 === 'included') {
            for (let i = 0; i < totalCeiling; i++) {
                dp = MathCore.runSelectTicket(dp);
                dpTotal = MathCore.runGuaranteedTotal(dpTotal);
                dpSpecific = MathCore.runGuaranteedTotal(dpSpecific);
            }
        }

        this.cache = { N: normalCount, M: totalTargets, dp, dpTotal, dpSpecific, context: {
            N: normalCount, totalPulls: normalPulls + totalStepPulls, normalPulls, totalStepPulls, totalCeiling, rateTotal, groups, totalTargets
        }};
        
        this.saveData();
        this.renderUI();
    }

    renderUI() {
        if (!this.cache) return;
        const mainTab = document.getElementById('tab-2star');
        if (mainTab && !mainTab.classList.contains('active')) return;

        const { N, M, dp, dpTotal, dpSpecific, context } = this.cache;
        const activeSubTab = document.querySelector('#sub-tab-system-2star .tab-button.active')?.dataset.tab;
        const ids = { chart: 'resultChart2', legend: 'legendList2', summary: 'globalSummary', logic: 'globalLogic' };

        if (activeSubTab === 'res-2s-collection') {
            renderResultCommon(M, dp, MathCore.transformData(dp, VIEW_MODE.star2), VIEW_MODE.star2, ids, {
                summary: () => `
                    <strong>${M}종 수집 결과</strong> (전체 ${N}종 중)<br>
                    가챠 횟수 : ${context.totalPulls}회 / 천장 : ${context.totalCeiling}회<br>
                    목표(${M}종) 올컴플릿 확률 : <strong>${formatProbability(dp[M])}</strong>
                `,
                logic: () => this.generateLogicHtml(context)
            }, this.chartRefs.collection);
        } else if (activeSubTab === 'res-2s-total') {
            let expected = dpTotal.reduce((acc, p, i) => acc + i * p, 0);
            renderTotalBarResult(dpTotal, VIEW_MODE.star2, { chart: 'resultChartTotal2' }, 
                `타겟(${M}종) 총 획득 기대 수: 약 <strong>${expected.toFixed(3)}개</strong><br><span style="font-size:0.85rem; color:#666;">* 설정한 타겟 그룹 픽업의 획득 개수 합계입니다.</span>`, 
                this.chartRefs.total);
        } else if (activeSubTab === 'res-2s-specific') {
            let expected = dpSpecific.reduce((acc, p, i) => acc + i * p, 0);
            renderSpecificBarResult(dpSpecific, VIEW_MODE.star2, { chart: 'resultChartSpecific2' }, 
                `특정 픽업(1명) 기대 수: 약 <strong>${expected.toFixed(3)}장</strong><br><span style="font-size:0.85rem; color:#666;">(가장 많이 돌린 그룹에 속해있다는 가정)</span>`, 
                this.chartRefs.specific);
        }  else if (activeSubTab === 'res-2s-efficiency') {
            this.renderEfficiencyComparison();
        }
    }

    renderEfficiencyComparison() {
        const gid = this.selectedGroup;
        const N_group = this.inputs[`countStep${gid}`].getValue();
        let M_group = this.inputs[`targetCount${gid}`].getValue();
        if (M_group === 0 || M_group > N_group) M_group = N_group;

        const N_total = this.inputs['countNormal2'].getValue();
        const rateTotal = this.inputs['rate2Star'].getValue() / 100;

        const labels = [];
        const normalData = [];
        const stepupData = [];

        // 0~200회 시뮬레이션
        for (let pulls = 0; pulls <= 200; pulls++) {
            labels.push(pulls);

            // 1. 일반 가챠
            let dpN = new Array(M_group + 1).fill(0); dpN[0] = 1.0;
            const p_norm = rateTotal / N_total;
            const p_high = 0.95 / N_total;

            for (let i = 1; i <= pulls; i++) {
                const p = (i % 10 === 0) ? p_high : p_norm;
                dpN = MathCore.runGacha(dpN, p);
            }
            if (CEILING_MODE.star2 === 'included') {
                const ceil = Math.floor(pulls / 100);
                for (let i = 0; i < ceil; i++) dpN = MathCore.runSelectTicket(dpN);
            }
            
            // [수정] Best/Worst 데이터 둘 다 저장
            normalData.push({ 
                best: (dpN[M_group] * 100).toFixed(2), 
                worst: (dpN[0] * 100).toFixed(2) 
            });

            // 2. 스탭업 가챠
            let dpS = new Array(M_group + 1).fill(0); dpS[0] = 1.0;
            const p_step_norm = rateTotal / N_group;
            const p_step_guar = 1.0 / N_group;

            for (let i = 1; i <= pulls; i++) {
                const isGuar = (i === 5 || (i > 5 && (i - 5) % 10 === 0));
                const p = isGuar ? p_step_guar : p_step_norm;
                dpS = MathCore.runGacha(dpS, p);
            }
            if (CEILING_MODE.star2 === 'included') {
                const ceil = Math.floor(pulls / 50); 
                for (let i = 0; i < ceil; i++) dpS = MathCore.runSelectTicket(dpS);
            }
            
            stepupData.push({ 
                best: (dpS[M_group] * 100).toFixed(2), 
                worst: (dpS[0] * 100).toFixed(2) 
            });
        }

        this.drawEfficiencyChart(labels, normalData, stepupData, gid, M_group, N_group);
    }

    drawEfficiencyChart(labels, normalData, stepupData, gid, M, N) {
        // 모드에 따른 데이터 추출
        const modeKey = this.isWorstMode ? 'worst' : 'best';
        const finalStepupData = stepupData.map(d => d[modeKey]);
        const finalNormalData = normalData.map(d => d[modeKey]);

        // 스타일 (3성과 동일한 로직)
        const mainColor = this.isWorstMode ? '#dc3545' : '#45a247';
        const subColor = this.isWorstMode ? 'rgba(220, 53, 69, 0.1)' : 'rgba(69, 162, 71, 0.1)';
        const normalColor = '#283c86';

        const getPointRadius = (ctx) => {
            if (ctx.dataIndex === 0) return 4;
            return (ctx.dataIndex % 10 === 0) ? 4 : 0;
        };
        const getHitRadius = (ctx) => (ctx.dataIndex % 10 === 0 ? 30 : 0);

        const datasets = [
            {
                label: `스탭업(${gid})`,
                data: finalStepupData,
                borderColor: mainColor,
                backgroundColor: subColor,
                fill: true,
                tension: 0.1,
                pointRadius: getPointRadius,
                pointHoverRadius: (ctx) => getPointRadius(ctx) + 2,
                pointHitRadius: getHitRadius,
                pointBackgroundColor: (ctx) => (ctx.dataIndex % 10 === 0 ? mainColor : '#fff'),
                pointBorderColor: mainColor,
                borderWidth: 2
            },
            {
                label: '일반 가챠',
                data: finalNormalData,
                borderColor: normalColor,
                borderDash: [5, 5],
                tension: 0.1,
                pointRadius: (ctx) => (ctx.dataIndex % 10 === 0 ? 3.5 : 0),
                pointHitRadius: getHitRadius,
                pointBackgroundColor: normalColor,
                borderWidth: 1.5
            }
        ];

        renderLineChart('efficiencyChart2', labels, datasets, this.chartRefs.efficiency);

        // 요약 텍스트
        const summaryEl = document.getElementById('globalSummary');
        if (summaryEl) {
            const limit = 50;
            const sVal = finalStepupData[limit];
            const nVal = finalNormalData[limit];
            const modeText = this.isWorstMode ? '실패(폭사) 확률' : '성공(졸업) 확률';
            const compText = this.isWorstMode ? '낮아' : '높아'; // 실패 확률은 낮을수록 좋음

            summaryEl.innerHTML = `
                <strong>💡 Group ${gid} ${modeText} 분석 (목표 ${M}명)</strong><br>
                해당 그룹의 스탭업 가챠가 일반 가챠보다 ${modeText}이 압도적으로 
                <span style="color:${mainColor}; font-weight:bold;">${compText} 유리합니다.</span><br>
                <span style="font-size:0.85rem; color:#666;">
                (${limit}회 기준: 스탭업 ${sVal}% vs 일반 ${nVal}%)
                </span>
            `;
        }

        const logicEl = document.getElementById('globalLogic');
        if (logicEl) { logicEl.style.display = 'none'; logicEl.innerHTML = ''; }
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