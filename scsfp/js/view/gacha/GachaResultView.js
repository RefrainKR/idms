import { ResultView } from '../ResultView.js';
import { Formatter } from '../../utils/Formatter.js';
import { ChartAdapter } from '../../utils/ChartAdapter.js';
import { ChartUtils } from '../../utils/ChartUtils.js';

export class GachaResultView extends ResultView {

    // ==========================================
    // 3성 가챠 화면 렌더링
    // ==========================================
    static render3Star(result, context, model, charts) {
        const mainTab = document.getElementById('tab-3star');
        if (!mainTab || !mainTab.classList.contains('active')) return;

        const activeSubTab = document.querySelector('#sub-tab-system-3star .tab-button.active')?.dataset.tab;
        const viewMode = model.viewMode.value;
        const { N, M, dp, dpTotal } = result;

        // 1. 수집 확률 (Pie Chart)
        if (activeSubTab === 'res-3s-collection') {
            this.renderCollection(M, dp, viewMode,
                { chart: 'resultChart', legend: 'legendList', summary: 'globalSummary', logic: 'globalLogic' },
                {
                    summary: () => `
                        <strong>수집 결과</strong> (전체 ${N}종 중 ${M}종)<br>
                        가챠 횟수 : ${context.totalPulls}회 (일반 ${context.normalPulls} + 스탭업 ${context.stepPulls})<br>
                        천장 교환 : ${context.totalCeilingCount}회 (통합 ${context.normalCeiling} + 스탭업 ${context.selectRewardCount})<br>
                        목표(${M}종) 올컴플릿 확률 : <strong>${Formatter.formatProbability(dp[M])}</strong>
                    `,
                    logic: () => this._generate3StarLogic(context)
                },
                charts.collection
            );
        }
        // 2. 이 획득 수 (Bar Chart)
        else if (activeSubTab === 'res-3s-total') {
            const expected = dpTotal.reduce((acc, p, i) => acc + i * p, 0);
            this.renderTotalCount(dpTotal, viewMode,
                { chart: 'resultChartTotal3', summary: 'globalSummary', logic: 'globalLogic' },
                {
                    summary: () => `
                        타겟(${M}종) 이 획득 기대 수: 약 <strong>${expected.toFixed(3)}개</strong><br>
                        <span style="font-size:0.85rem; color:#666;">* 유효 픽업 ${M}종의 획득 개수 합계입니다.</span><br>
                        <span style="font-size:0.85rem; color:#dc3545;">(천장 포함 버튼이 활성화 되어있는지 주의하세요.)</span>
                    `
                },
                charts.total
            );
        }
        // 3. 효율 비교 (Line Chart)
        else if (activeSubTab === 'res-3s-efficiency') {
            if (context.efficiencyData) {
                this.renderEfficiencyChart(
                    context.efficiencyData,
                    'efficiencyChart',
                    model.efficiencyMode.value === 'worst',
                    charts.efficiency,
                    context.efficiencyLimit,
                    M,
                    '',
                    false
                );
            }
        }
        // 4. CDF 역추적 (Line Chart)
        else if (activeSubTab === 'res-3s-cdf') {
            if (context.cdfData) {
                this.renderCDFChart(
                    context.cdfData,
                    'cdfChart',
                    charts.cdf,
                    model.targetProbability.value,
                    M
                );
            }
        }
    }

    // 3성 상세 로직 HTML 생성
    static _generate3StarLogic(ctx) {
        const strike = (text, cond) => cond ? `<span style="text-decoration:line-through; color:#aaa;">${text}</span>` : text;
        
        let rewardHistory = "";
        for (let i = 1; i <= ctx.maxLoops; i++) {
            let rType = ctx.loopRewards[i];
            let rText = rType === 'random' ? '픽업 티켓' : (rType === 'select' ? '셀렉 티켓' : '없음');
            rewardHistory += strike(`[${i}주: ${rText}]`, i * 40 > ctx.stepPulls) + " ";
        }

        return `
            <div class="section-header" style="cursor: pointer;">
                <span class="logic-title">상세 계산 근거</span>
                <button class="toggle-btn">▼</button>
            </div>
            <div class="section-content logic-view">
                <ul class="logic-list">
                    <li>기본 ${ctx.p_indiv}% (${ctx.countNormal}회), Step4 개별 ${(ctx.p_step4_total/ctx.N).toFixed(3)}% (${ctx.countStep4}회)</li>
                    <li>주회 보상: ${rewardHistory}</li>
                    <li>랜덤 교환(${ctx.randomRewardCount}회), 천장 교환(${ctx.totalCeilingCount}회)</li>
                    <li>알고리즘: DP (Coupon Collector)</li>
                </ul>
            </div>`;
    }

    // ==========================================
    // 생일 가챠 화면 렌더링
    // ==========================================
    static renderBirthday(result, context, model, charts) {
        const mainTab = document.getElementById('tab-birthday');
        if (!mainTab || !mainTab.classList.contains('active')) return;

        const activeSubTab = document.querySelector('#sub-tab-system-birthday .tab-button.active')?.dataset.tab;
        const viewMode = model.viewMode.value;
        const { N, M, dp, dpTotal } = result;

        // 1. 픽업 획득 (Pie Chart)
        if (activeSubTab === 'res-bd-collection') {
            this.renderCollection(M, dp, viewMode,
                { chart: 'resultChartBirthday', legend: 'legendListBirthday', summary: 'globalSummary', logic: 'globalLogic' },
                {
                    summary: () => `
                        <strong>생일 가챠 결과</strong><br>
                        가챠 횟수: ${context.totalPulls}회 (일반 ${context.normalPulls} + 스탭업 ${context.stepPulls})<br>
                        천장 교환: ${context.ceilingCount}회<br>
                        획득 확률: <strong>${Formatter.formatProbability(dp[M])}</strong>
                        ${context.stepGuaranteed ? '<br><span style="color:#45a247;">✅ 스탭업 30회 확정 획득!</span>' : ''}
                    `,
                    logic: () => this._generateBirthdayLogic(context)
                },
                charts.collection
            );
        }
        // 2. 총 획득 (Bar Chart)
        else if (activeSubTab === 'res-bd-total') {
            const expected = dpTotal.reduce((acc, p, i) => acc + i * p, 0);
            this.renderTotalCount(dpTotal, viewMode,
                { chart: 'resultChartTotalBirthday', summary: 'globalSummary', logic: 'globalLogic' },
                {
                    summary: () => `
                        픽업 총 획득 기대 수: 약 <strong>${expected.toFixed(3)}개</strong><br>
                        <span style="font-size:0.85rem; color:#666;">* 중복 포함 획득 개수 합계입니다.</span><br>
                        <span style="font-size:0.85rem; color:#dc3545;">(천장 포함 버튼이 활성화 되어있는지 주의하세요.)</span>
                    `
                },
                charts.total
            );
        }
        // 3. 효율 비교 (Line Chart)
        else if (activeSubTab === 'res-bd-efficiency') {
            if (context.efficiencyData) {
                this.renderEfficiencyChart(
                    context.efficiencyData,
                    'efficiencyChartBirthday',
                    model.efficiencyMode.value === 'worst',
                    charts.efficiency,
                    30,  // 스탭업 30회 기준
                    M,
                    '',
                    false
                );
            }
        }
    }

    static _generateBirthdayLogic(ctx) {
        const isCeilingOff = ctx.ceilingMode === 'excluded';
        const strike = (text, cond) => cond ? `<span style="text-decoration:line-through; color:#aaa;">${text}</span>` : text;

        return `
            <div class="section-header" style="cursor: pointer;">
                <span class="logic-title">상세 계산 근거</span>
                <button class="toggle-btn">▼</button>
            </div>
            <div class="section-content logic-view">
                <ul class="logic-list">
                    <li><strong>일반 가챠:</strong> ${ctx.normalRate}% (${ctx.normalPulls}회)</li>
                    <li><strong>스탭업 가챠:</strong> ${ctx.stepRate}% (${ctx.stepPulls}회)
                        ${ctx.stepGuaranteed ? ' <strong style="color:#45a247;">[30회 확정 획득!]</strong>' : ''}
                    </li>
                    <li><strong>천장:</strong> ${strike(`${ctx.ceilingCount}회 (200회당 1개)`, isCeilingOff)}</li>
                    <li>알고리즘: DP (단일 픽업)</li>
                </ul>
            </div>`;
    }

    // ==========================================
    // 2성 가챠 화면 렌더링
    // ==========================================
    static render2Star(result, context, model, charts) {
        const mainTab = document.getElementById('tab-2star');
        if (!mainTab || !mainTab.classList.contains('active')) return;

        const activeSubTab = document.querySelector('#sub-tab-system-2star .tab-button.active')?.dataset.tab;
        const viewMode = model.viewMode.value;
        const { N, M, dp, dpTotal } = result;

        // 1. 수집 확률 (Pie)
        if (activeSubTab === 'res-2s-collection') {
            this.renderCollection(M, dp, viewMode,
                { chart: 'resultChart2', legend: 'legendList2', summary: 'globalSummary', logic: 'globalLogic' },
                {
                    summary: () => `
                        <strong>수집 결과</strong> (전체 ${N}종 중 ${M}종)<br>
                        가챠 횟수 : ${context.totalPulls}회 / 천장 : ${context.totalCeil}회<br>
                        목표(${M}종) 올컴플릿 확률 : <strong>${Formatter.formatProbability(dp[M])}</strong><br>
                        <span style="font-size:0.85rem; color:#dc3545;">(천장 포함 버튼이 활성화 되어있는지 주의하세요.)</span>
                    `,
                    logic: () => this._generate2StarLogic(context)
                },
                charts.collection
            );
        }
        // 2. 이 획득 (Bar)
        else if (activeSubTab === 'res-2s-total') {
            const expected = dpTotal.reduce((acc, p, i) => acc + i * p, 0);
            this.renderTotalCount(dpTotal, viewMode,
                { chart: 'resultChartTotal2', summary: 'globalSummary', logic: 'globalLogic' },
                {
                    summary: () => `
                        타겟(${M}종) 이 획득 기대 수: 약 <strong>${expected.toFixed(3)}개</strong><br>
                        <span style="font-size:0.85rem; color:#666;">* 타겟 그룹 픽업의 획득 개수 합계입니다.</span><br>
                        <span style="font-size:0.85rem; color:#dc3545;">(천장 포함 버튼이 활성화 되어있는지 주의하세요.)</span>
                    `
                },
                charts.total
            );
        }
        // 3. 효율 비교 (Line)
        else if (activeSubTab === 'res-2s-efficiency') {
            if (context.efficiencyData) {
                this.renderEfficiencyChart(
                    context.efficiencyData,
                    'efficiencyChart2',
                    model.efficiencyMode.value === 'worst',
                    charts.efficiency,
                    100,
                    context.targetGroupInfo ? context.targetGroupInfo.M : M,
                    context.targetGroupInfo ? context.targetGroupInfo.id : '',
                    true
                );
            }
        }
    }

    static _generate2StarLogic(ctx) {
        const strike = (text, cond) => cond ? `<span style="text-decoration:line-through; color:#aaa;">${text}</span>` : text;
        const isCeilingOff = ctx.ceilingMode === 'excluded';

        // 1. 일반 가챠 통계
        let normalHigh = 0, normalBase = 0;
        for (let i = 1; i <= ctx.normalPulls; i++) {
            if (i % 10 === 0) normalHigh++; else normalBase++;
        }
        const pNorm = (ctx.rateTotal * 100 / ctx.N).toFixed(3);
        const pHigh = (95 / ctx.N).toFixed(3);

        // 2. 스탭업 그룹별 통계
        let groupDetails = "";
        let totalStepNormal = 0, totalStepGuar = 0;

        ctx.groups.forEach(g => {
            let gNormal = 0, gGuar = 0;
            for (let i = 1; i <= g.pulls; i++) {
                if (i === 5 || (i > 5 && (i - 5) % 10 === 0)) gGuar++; else gNormal++;
            }
            totalStepNormal += gNormal;
            totalStepGuar += gGuar;
            const pIndiv = (ctx.rateTotal * 100 / g.N).toFixed(3);
            const pGuar = (100 / g.N).toFixed(3);
            groupDetails += `<li>그룹 ${g.id} (${g.N}종): 개별 ${pIndiv}% (${gNormal}회), 확정 ${pGuar}% (${gGuar}회)</li>`;
        });

        return `
            <div class="section-header" style="cursor: pointer;">
                <span class="logic-title">상세 계산 근거</span>
                <button class="toggle-btn">▼</button>
            </div>
            <div class="section-content logic-view">
                <ul class="logic-list">
                    <li><strong>확률 적용(일반):</strong> 일반 ${pNorm}% (${normalBase}회), 보정(전체 95%, 개별 ${pHigh}%) (${normalHigh}회)</li>
                    <li><strong>확률 적용(스탭업):</strong> 일반 (${totalStepNormal}회), 확정 (${totalStepGuar}회)
                        <ul style="padding-left: 20px; margin-top: 5px; list-style-type: none;">${groupDetails}</ul>
                    </li>
                    <li><strong>일반 천장(${Math.floor(ctx.normalPulls/100)}회):</strong> ${strike("100회당 1개", isCeilingOff)}</li>
                    <li><strong>스탭업 천장(${Math.floor(ctx.totalStepPulls/50)}회):</strong> ${strike("50회당 1개", isCeilingOff)}</li>
                    <li>알고리즘: Convolution + DP</li>
                </ul>
            </div>`;
    }

    // ==========================================
    // 공통: 효율 그래프 렌더링 (개선 버전)
    // ==========================================
    static renderEfficiencyChart(data, canvasId, isWorst, chartRef, limit, M, groupName = '', isStar2 = false) {
        const { labels, normalData, stepupData } = data;
        
        const modeKey = isWorst ? 'worst' : 'best';
        const finalStep = stepupData.map(v => parseFloat(v[modeKey]).toFixed(3));
        const finalNorm = normalData.map(v => parseFloat(v[modeKey]).toFixed(3));

        // [개선] ChartUtils 사용으로 중복 제거
        const getPointRadius = (ctx) => {
            return isStar2 
                ? ChartUtils.getPointRadius2Star(ctx.dataIndex)
                : ChartUtils.getPointRadius3Star(ctx.dataIndex);
        };

        const getHitRadius = (ctx) => {
            return ChartUtils.getHitRadius(ctx.dataIndex, isStar2);
        };

        // 색상 및 스타일 정의
        const mainColor = isWorst ? '#dc3545' : '#45a247';
        const subColor = isWorst ? 'rgba(220, 53, 69, 0.1)' : 'rgba(69, 162, 71, 0.1)';

        const datasets = [
            {
                label: groupName ? `스탭업(${groupName})` : '스탭업 가챠',
                data: finalStep,
                borderColor: mainColor,
                backgroundColor: subColor,
                fill: true,
                tension: 0.1,
                pointRadius: getPointRadius,
                pointHoverRadius: (ctx) => getPointRadius(ctx) + 2,
                pointHitRadius: getHitRadius,
                pointBackgroundColor: (ctx) => ChartUtils.getPointBackgroundColor(ctx.dataIndex, mainColor, isStar2),
                pointBorderColor: mainColor,
                borderWidth: 2
            },
            {
                label: '일반 가챠',
                data: finalNorm,
                borderColor: '#283c86',
                borderDash: [5, 5],
                tension: 0.1,
                pointRadius: (ctx) => (ctx.dataIndex % 10 === 0 ? 3.5 : 0),
                pointHitRadius: getHitRadius,
                pointBackgroundColor: '#283c86',
                borderWidth: 1.5
            }
        ];

        ChartAdapter.renderLineChart(canvasId, labels, datasets, chartRef);

        // 요약 텍스트
        const summaryEl = document.getElementById('globalSummary');
        if (summaryEl) {
            const limitIdx = limit;
            const sVal = finalStep[limitIdx];
            const nVal = finalNorm[limitIdx];
            const modeText = isWorst ? '실패(폭사) 확률' : '성공(졸업) 확률';
            const compText = isWorst ? '낮아' : '높아';

            summaryEl.innerHTML = `
                <strong>💡 ${groupName ? `Group ${groupName}` : ''} ${modeText} 분석 (목표 ${M}명)</strong><br>
                ${limit}회 기준 스탭업이 일반보다 ${modeText}이 
                <span style="color:${mainColor}; font-weight:bold;">${compText} 유리합니다.</span><br>
                <span style="font-size:0.85rem; color:#666;">(스탭업 ${sVal}% vs 일반 ${nVal}%)</span>
            `;
        }
        
        const logicEl = document.getElementById('globalLogic');
        if (logicEl) { logicEl.style.display = 'none'; logicEl.innerHTML = ''; }
    }
    
    // ==========================================
    // CDF 누적 확률 차트 렌더링
    // ==========================================
    static renderCDFChart(data, canvasId, chartRef, targetProb, M) {
        const { labels, cdfDataStepup, cdfDataNormal } = data;

        // 목표 확률에 도달하는 지점 찾기 (스탭업 기준)
        let targetPullsStepup = labels.length - 1;
        for (let i = 0; i < cdfDataStepup.length; i++) {
            if (cdfDataStepup[i] >= targetProb) {
                targetPullsStepup = labels[i];
                break;
            }
        }

        // 목표 확률에 도달하는 지점 찾기 (일반 기준)
        let targetPullsNormal = labels.length - 1;
        for (let i = 0; i < cdfDataNormal.length; i++) {
            if (cdfDataNormal[i] >= targetProb) {
                targetPullsNormal = labels[i];
                break;
            }
        }

        const datasets = [
            {
                label: `스탭업 가챠 (목표 ${M}명)`,
                data: cdfDataStepup,
                borderColor: '#45a247',
                backgroundColor: 'rgba(69, 162, 71, 0.1)',
                fill: true,
                tension: 0.3,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHitRadius: 10,
                borderWidth: 2
            },
            {
                label: `일반 가챠 (목표 ${M}명)`,
                data: cdfDataNormal,
                borderColor: '#283c86',
                backgroundColor: 'rgba(40, 60, 134, 0.1)',
                fill: true,
                tension: 0.3,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHitRadius: 10,
                borderWidth: 2,
                borderDash: [5, 5]
            }
        ];

        // 목표 지점 마커 추가 (스탭업)
        if (targetProb > 0 && targetProb <= 100) {
            datasets.push({
                label: `스탭업 목표 지점 (${targetProb}%)`,
                data: labels.map((x, i) => x === targetPullsStepup ? cdfDataStepup[i] : null),
                borderColor: '#45a247',
                backgroundColor: '#45a247',
                pointRadius: 8,
                pointHoverRadius: 10,
                showLine: false,
                pointStyle: 'circle'
            });

            datasets.push({
                label: `일반 목표 지점 (${targetProb}%)`,
                data: labels.map((x, i) => x === targetPullsNormal ? cdfDataNormal[i] : null),
                borderColor: '#283c86',
                backgroundColor: '#283c86',
                pointRadius: 8,
                pointHoverRadius: 10,
                showLine: false,
                pointStyle: 'circle'
            });
        }
        
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        if (chartRef && chartRef.current) {
            chartRef.current.destroy();
            chartRef.current = null;
        }

        chartRef.current = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: { 
                        position: 'top',
                        labels: { boxWidth: 12 }
                    },
                    datalabels: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                if (context.datasetIndex === 0 || context.datasetIndex === 1) {
                                    return ` ${context.dataset.label}: ${context.raw.toFixed(2)}%`;
                                } else {
                                    return ` ${context.dataset.label}`;
                                }
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: { display: true, text: '목표 달성 확률 (%)' },
                        ticks: { callback: (v) => v + '%' }
                    },
                    x: {
                        title: { display: true, text: '가챠 횟수' },
                        ticks: {
                            maxTicksLimit: 21,
                            callback: function(val) {
                                const label = this.getLabelForValue(val);
                                return Number(label) % 50 === 0 ? label : '';
                            }
                        }
                    }
                }
            },
            plugins: [{
                id: 'targetLine',
                afterDatasetsDraw: (chart) => {
                    if (targetProb <= 0 || targetProb > 100) return;

                    const ctx = chart.ctx;
                    const xAxis = chart.scales.x;
                    const yAxis = chart.scales.y;

                    // 가로선 (목표 확률)
                    const yPos = yAxis.getPixelForValue(targetProb);

                    ctx.save();
                    ctx.setLineDash([5, 5]);
                    ctx.strokeStyle = '#999';
                    ctx.lineWidth = 1.5;

                    ctx.beginPath();
                    ctx.moveTo(xAxis.left, yPos);
                    ctx.lineTo(xAxis.right, yPos);
                    ctx.stroke();

                    // 세로선 (스탭업 목표 지점)
                    const xPosStepup = xAxis.getPixelForValue(targetPullsStepup);
                    ctx.strokeStyle = '#45a247';
                    ctx.beginPath();
                    ctx.moveTo(xPosStepup, yAxis.top);
                    ctx.lineTo(xPosStepup, yAxis.bottom);
                    ctx.stroke();

                    // 세로선 (일반 목표 지점)
                    const xPosNormal = xAxis.getPixelForValue(targetPullsNormal);
                    ctx.strokeStyle = '#283c86';
                    ctx.beginPath();
                    ctx.moveTo(xPosNormal, yAxis.top);
                    ctx.lineTo(xPosNormal, yAxis.bottom);
                    ctx.stroke();

                    ctx.restore();
                }
            }]
        });
        
        // 요약 정보 업데이트
        const summaryEl = document.getElementById('globalSummary');
        if (summaryEl) {
            const actualProbStepup = cdfDataStepup[targetPullsStepup] || 0;
            const actualProbNormal = cdfDataNormal[targetPullsNormal] || 0;

            summaryEl.innerHTML = `
                <strong>🎯 목표 확률 역추적 분석 (목표 ${M}명)</strong><br>
                목표 달성 확률: <strong>${targetProb}%</strong><br><br>
                <span style="color:#45a247; font-weight:bold;">스탭업 가챠:</span> 약 <strong>${targetPullsStepup}회</strong> 필요 (실제 ${actualProbStepup.toFixed(2)}%)<br>
                <span style="color:#283c86; font-weight:bold;">일반 가챠:</span> 약 <strong>${targetPullsNormal}회</strong> 필요 (실제 ${actualProbNormal.toFixed(2)}%)
            `;
        }

        const logicEl = document.getElementById('globalLogic');
        if (logicEl) { logicEl.style.display = 'none'; logicEl.innerHTML = ''; }
    }
}