import { ResultView } from '../ResultView.js';
import { Formatter } from '../../utils/Formatter.js';
import { ChartAdapter } from '../ChartAdapter.js';
import { ChartUtils } from '../ChartUtils.js';
import { getGachaConfig, getActiveSubTab } from './GachaViewConfig.js';
import { FORMAT, CHART, CHART_RANGE, CHART_COLORS } from '../../config/UIConfig.js';

export class GachaResultView extends ResultView {

    // ==========================================
    // 통합 렌더링 (리팩토링)
    // ==========================================
    static render(gachaType, result, context, model, charts) {
        const config = getGachaConfig(gachaType);
        if (!config) return;

        const mainTab = document.getElementById(config.mainTabId);
        if (!mainTab || !mainTab.classList.contains('active')) return;

        const activeSubTab = getActiveSubTab(config);
        if (!activeSubTab) return;

        const viewMode = model.viewMode.value;
        const { N, M, dp, dpTotal } = result;

        // 수집 확률 (Pie Chart)
        if (activeSubTab === config.subTabs.collection) {
            this._renderCollectionTab(gachaType, config, M, dp, viewMode, context, charts);
        }
        // 총 획득 수 (Bar Chart)
        else if (activeSubTab === config.subTabs.total) {
            this._renderTotalTab(gachaType, config, M, dpTotal, viewMode, context, charts);
        }
        // 효율 비교 (Line Chart)
        else if (activeSubTab === config.subTabs.efficiency) {
            this._renderEfficiencyTab(gachaType, config, M, context, model, charts);
        }
        // CDF 역추적
        else if (config.hasCdfTab && activeSubTab === config.subTabs.cdf) {
            this._renderCdfTab(gachaType, config, M, context, model, charts);
        }
    }

    // 수집 확률 탭 렌더링
    static _renderCollectionTab(gachaType, config, M, dp, viewMode, context, charts) {
        const summaryFn = this._getCollectionSummary(gachaType, context, M, dp);
        const logicFn = this._getLogic(gachaType, context);

        this.renderCollection(M, dp, viewMode,
            {
                chart: config.charts.collection.canvas,
                legend: config.charts.collection.legend,
                summary: config.summary.element,
                logic: config.summary.logic
            },
            {
                summary: summaryFn,
                logic: logicFn
            },
            charts.collection
        );
    }

    // 총 획득 수 탭 렌더링
    static _renderTotalTab(gachaType, config, M, dpTotal, viewMode, context, charts) {
        const expected = dpTotal.reduce((acc, p, i) => acc + i * p, 0);
        const summaryFn = () => `
            타겟(${M}종) 총 획득 기대 수: 약 <strong>${expected.toFixed(FORMAT.DECIMAL_PLACES.PROBABILITY)}개</strong><br>
            <span style="font-size:0.85rem; color:#666;">※ 유효 픽업 ${M}종의 획득 개수 합계입니다.</span><br>
            <span style="font-size:0.85rem; color:${CHART_COLORS.ERROR};">※ 천장 포함 버튼이 활성화 되어있는지 확인하세요.</span>
        `;

        this.renderTotalCount(dpTotal, viewMode,
            {
                chart: config.charts.total.canvas,
                summary: config.summary.element,
                logic: config.summary.logic
            },
            { summary: summaryFn },
            charts.total
        );
    }

    // 효율 비교 탭 렌더링
    static _renderEfficiencyTab(gachaType, config, M, context, model, charts) {
        if (!context.efficiencyData) return;

        let xLimit, targetM, targetLabel, showMultipleLines;

        if (gachaType === 'star3') {
            xLimit = context.efficiencyLimit;
            targetM = M;
            targetLabel = '';
            showMultipleLines = false;
        } else if (gachaType === 'birthday') {
            xLimit = CHART_RANGE.EFFICIENCY_X_LIMIT.BIRTHDAY;
            targetM = M;
            targetLabel = '';
            showMultipleLines = false;
        } else if (gachaType === 'collab') {
            xLimit = CHART_RANGE.EFFICIENCY_X_LIMIT.COLLAB;
            targetM = M;
            targetLabel = '';
            showMultipleLines = false;
        } else if (gachaType === 'star2') {
            xLimit = CHART_RANGE.EFFICIENCY_X_LIMIT.STAR2;
            targetM = context.targetGroupInfo ? context.targetGroupInfo.M : M;
            targetLabel = context.targetGroupInfo ? context.targetGroupInfo.id : '';
            showMultipleLines = true;
        }

        this.renderEfficiencyChart(
            context.efficiencyData,
            config.charts.efficiency.canvas,
            model.efficiencyMode.value === 'worst',
            charts.efficiency,
            xLimit,
            targetM,
            targetLabel,
            showMultipleLines,
            config.summary.element,
            config.summary.logic
        );

        // 효율 비교 탭 summary 업데이트
        this._updateEfficiencySummary(gachaType, config, M, context);
    }

    // CDF 역추적 탭 렌더링
    static _renderCdfTab(gachaType, config, M, context, model, charts) {
        if (!context.cdfData) return;

        this.renderCDFChart(
            context.cdfData,
            config.charts.cdf.canvas,
            charts.cdf,
            model.targetProbability.value,
            M,
            config.summary.element,
            config.summary.logic
        );

        // CDF 역추적 탭 summary 업데이트
        this._updateCdfSummary(gachaType, config, M, context);
    }

    // 가챠 타입별 수집 요약 생성
    static _getCollectionSummary(gachaType, context, M, dp) {
        const N = context.N || M;

        if (gachaType === 'star3') {
            return () => `
                <strong>결과</strong> (${N}픽업 중 ${M}픽업)<br>
                - 가챠 횟수 : ${context.totalPulls}회 (일반 ${context.normalPulls} + 스탭업 ${context.stepPulls})<br>
                - 천장 교환 : ${context.totalCeilingCount}회 (통합 ${context.normalCeiling} + 스탭업 ${context.selectRewardCount})<br>
                - 목표(${M}종) 올컴플릿 확률 : <strong>${Formatter.probabilityFraction(dp[M])}</strong>
            `;
        } else if (gachaType === 'birthday') {
            const guaranteedMsg = context.stepGuaranteed > 0
                ? `<br><span style="color:${CHART_COLORS.STEPUP};">✅ Step3 확정 ${context.stepGuaranteed}회 획득!</span>`
                : '';
            return () => `
                <strong>생일 가챠 결과</strong><br>
                - 가챠 횟수: ${context.totalPulls}회 (일반 ${context.normalPulls} + 스탭업 ${context.stepPulls})<br>
                - 천장 교환: ${context.ceilingCount}회<br>
                - 획득 확률: <strong>${Formatter.probabilityFraction(dp[M])}</strong>
                ${guaranteedMsg}
            `;
        } else if (gachaType === 'collab') {
            return () => `
                <strong>콜라보 가챠 결과</strong> (전체 ${N}종 중 ${M}종)<br>
                - 가챠 횟수: ${context.totalPulls}회 (일반 ${context.normalPulls} + 스탭업 ${context.stepPulls})<br>
                - 천장 교환: ${context.ceilingCount}회<br>
                - 목표(${M}종) 올컴플릿 확률: <strong>${Formatter.probabilityFraction(dp[M])}</strong>
            `;
        } else if (gachaType === 'star2') {
            return () => `
                <strong>결과</strong> (${N}픽업 중 ${M}픽업)<br>
                - 가챠 횟수 : ${context.totalPulls}회 / 천장 : ${context.totalCeil}회<br>
                - 목표(${M}종) 올컴플릿 확률 : <strong>${Formatter.probabilityFraction(dp[M])}</strong>
            `;
        }
    }

    // 가챠 타입별 로직 생성
    static _getLogic(gachaType, context) {
        if (gachaType === 'star3') {
            return () => this._generate3StarLogic(context);
        } else if (gachaType === 'birthday' || gachaType === 'collab') {
            return () => this._generateSimpleStepupLogic(context, gachaType);
        } else if (gachaType === 'star2') {
            return () => this._generate2StarLogic(context);
        }
    }

    // 효율 비교 탭 summary 업데이트
    static _updateEfficiencySummary(gachaType, config, M, context) {
        const summaryEl = document.getElementById(config.summary.element);
        if (!summaryEl) return;

        let summaryHTML = `<strong>효율 비교</strong><br>`;

        if (gachaType === 'birthday') {
            summaryHTML += `- 목표: 픽업 획득 (${M}종)<br>`;
            summaryHTML += `<span style="color:#666; font-size:0.9em;">※ 스탭업은 최대 30회까지 가능하며, 초과분은 일반 가챠 확률(${context.normalRate}%)로 계산됩니다.</span>`;
        } else if (gachaType === 'collab') {
            summaryHTML += `- 목표: ${M}종 올컴플릿<br>`;
            summaryHTML += `<span style="color:#666; font-size:0.9em;">※ 스탭업 횟수 제한 없음 (계속 ${context.stepRate}% 확률 적용)</span>`;
        } else if (gachaType === 'star3') {
            summaryHTML += `- 목표: ${M}종 올컴플릿`;
        } else if (gachaType === 'star2') {
            summaryHTML += `- 목표: ${M}종 올컴플릿`;
        }

        summaryEl.innerHTML = summaryHTML;
        summaryEl.style.display = 'block';

        // 로직 영역 숨김
        const logicEl = document.getElementById(config.summary.logic);
        if (logicEl) logicEl.style.display = 'none';
    }

    // CDF 역추적 탭 summary 업데이트
    static _updateCdfSummary(gachaType, config, M, context) {
        const summaryEl = document.getElementById(config.summary.element);
        if (!summaryEl) return;

        let summaryHTML = `<strong>역추적 결과</strong><br>`;

        if (gachaType === 'birthday') {
            const { stepupRequired, normalRequired } = context.cdfData || {};
            summaryHTML += `- 목표: 픽업 획득 (${M}종)<br>`;
            summaryHTML += `- 스탭업 필요 횟수: ${stepupRequired}회<br>`;
            summaryHTML += `- 일반 필요 횟수: ${normalRequired}회<br>`;
            summaryHTML += `<span style="color:#666; font-size:0.9em;">※ 스탭업은 최대 30회까지 가능하며, 초과분은 일반 가챠 확률(${context.normalRate}%)로 계산됩니다.</span>`;
        } else if (gachaType === 'collab') {
            const { stepupRequired, normalRequired } = context.cdfData || {};
            summaryHTML += `- 목표: ${M}종 올컴플릿<br>`;
            summaryHTML += `- 스탭업 필요 횟수: ${stepupRequired}회<br>`;
            summaryHTML += `- 일반 필요 횟수: ${normalRequired}회<br>`;
            summaryHTML += `<span style="color:#666; font-size:0.9em;">※ 스탭업 횟수 제한 없음 (계속 ${context.stepRate}% 확률 적용)</span>`;
        } else if (gachaType === 'star3') {
            const { stepupRequired, normalRequired } = context.cdfData || {};
            summaryHTML += `- 목표: ${M}종 올컴플릿<br>`;
            summaryHTML += `- 스탭업 필요 횟수: ${stepupRequired}회<br>`;
            summaryHTML += `- 일반 필요 횟수: ${normalRequired}회`;
        }

        summaryEl.innerHTML = summaryHTML;
        summaryEl.style.display = 'block';

        // 로직 영역 숨김
        const logicEl = document.getElementById(config.summary.logic);
        if (logicEl) logicEl.style.display = 'none';
    }

    // 3성 (주회 보상형) 상세 로직 HTML 생성
    static _generate3StarLogic(ctx) {
        const strike = (text, cond) => cond ? `<span style="text-decoration:line-through; color:#aaa;">${text}</span>` : text;
        
        let rewardHistory = "";
        for (let i = 1; i <= ctx.maxLoops; i++) {
            let rType = ctx.loopRewards[i];
            let rText = rType === 'random' ? '픽업 티켓' : (rType === 'select' ? '셀렉 티켓' : '없음');
            rewardHistory += strike(`[${i}주: ${rText}]`, i * 40 > ctx.stepPulls) + " ";
        }

        return `
            <div class="section-header">
                <span class="logic-title">상세 계산 근거</span>
                <button class="toggle-btn" data-toggle-section>▼</button>
            </div>
            <div class="section-content logic-view">
                <ul class="logic-list">
                    <li>기본 ${ctx.p_indiv}% (${ctx.countNormal}회), Step4 개별 ${Formatter.probabilityBounded(ctx.p_step4_total/ctx.N/100, 3)} (${ctx.countStep4}회)</li>
                    <li>주회 보상: ${rewardHistory}</li>
                    <li>랜덤 교환(${ctx.randomRewardCount}회), 천장 교환(${ctx.totalCeilingCount}회)</li>
                    <li>알고리즘: DP (Coupon Collector)</li>
                </ul>
            </div>`;
    }

    // 단순 스탭업 (확률 증가형) 상세 로직 HTML 생성 - Type B (생일/콜라보)
    static _generateSimpleStepupLogic(ctx, gachaType) {
        const isCeilingOff = ctx.ceilingMode === 'excluded';
        const strike = (text, cond) => cond ? `<span style="text-decoration:line-through; color:#aaa;">${text}</span>` : text;

        return `
            <div class="section-header">
                <span class="logic-title">상세 계산 근거</span>
                <button class="toggle-btn" data-toggle-section>▼</button>
            </div>
            <div class="section-content logic-view">
                <ul class="logic-list">
                    <li><strong>일반 가챠:</strong> ${ctx.normalRate}% (${ctx.normalPulls}회)</li>
                    <li><strong>스탭업 가챠:</strong> ${ctx.stepRate}% (${ctx.stepPulls}회)
                        ${ctx.stepGuaranteed ? ` <strong style="color:${CHART_COLORS.STEPUP};">[30회 확정 획득!]</strong>` : ''}
                    </li>
                    <li><strong>천장:</strong> ${strike(`${ctx.ceilingCount}회 (200회당 1개)`, isCeilingOff)}</li>
                    <li>알고리즘: DP (단일 픽업)</li>
                </ul>
            </div>`;
    }

    // 그룹별 스탭업 (확정 시스템형) 상세 로직 HTML 생성 - Type C (2성)
    static _generate2StarLogic(ctx) {
        const strike = (text, cond) => cond ? `<span style="text-decoration:line-through; color:#aaa;">${text}</span>` : text;
        const isCeilingOff = ctx.ceilingMode === 'excluded';

        // 1. 일반 가챠 통계
        let normalHigh = 0, normalBase = 0;
        for (let i = 1; i <= ctx.normalPulls; i++) {
            if (i % 10 === 0) normalHigh++; else normalBase++;
        }
        const pNorm = Formatter.probabilityBounded(ctx.rateTotal / ctx.N, 3);
        const pHigh = Formatter.probabilityBounded(0.95 / ctx.N, 3);

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
            const pIndiv = Formatter.probabilityBounded(ctx.rateTotal / g.N, 3);
            const pGuar = Formatter.probabilityBounded(1 / g.N, 3);
            groupDetails += `<li>그룹 ${g.id} (${g.N}종): 개별 ${pIndiv} (${gNormal}회), 확정 ${pGuar} (${gGuar}회)</li>`;
        });

        return `
            <div class="section-header">
                <span class="logic-title">상세 계산 근거</span>
                <button class="toggle-btn" data-toggle-section>▼</button>
            </div>
            <div class="section-content logic-view">
                <ul class="logic-list">
                    <li><strong>확률 적용(일반):</strong> 일반 ${pNorm} (${normalBase}회), 보정(전체 95%, 개별 ${pHigh}) (${normalHigh}회)</li>
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
    static renderEfficiencyChart(data, canvasId, isWorst, chartRef, limit, M, groupName = '', isStar2 = false, summaryId = 'globalSummary', logicId = 'globalLogic') {
        const { labels, normalData, stepupData } = data;
        
        const modeKey = isWorst ? 'worst' : 'best';
        const finalStep = stepupData.map(v => parseFloat(v[modeKey]));
        const finalNorm = normalData.map(v => parseFloat(v[modeKey]));

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
        const mainColor = isWorst ? CHART_COLORS.ERROR : CHART_COLORS.STEPUP;
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
                borderColor: CHART_COLORS.NORMAL,
                borderDash: CHART.LINE_DASH,
                tension: 0.1,
                pointRadius: (ctx) => (ctx.dataIndex % 10 === 0 ? 3.5 : 0),
                pointHitRadius: getHitRadius,
                pointBackgroundColor: CHART_COLORS.NORMAL,
                borderWidth: 1.5
            }
        ];

        ChartAdapter.renderLineChart(canvasId, labels, datasets, chartRef);

        // 요약 텍스트
        const summaryEl = document.getElementById(summaryId);
        if (summaryEl) {
            const limitIdx = limit;
            const sVal = finalStep[limitIdx];
            const nVal = finalNorm[limitIdx];
            const sValText = Formatter.probabilityBounded(sVal / 100, 3);
            const nValText = Formatter.probabilityBounded(nVal / 100, 3);
            const modeText = isWorst ? '실패(폭사) 확률' : '성공(졸업) 확률';
            const compText = isWorst ? '낮아' : '높아';

            summaryEl.innerHTML = `
                <strong>💡 ${groupName ? `Group ${groupName}` : ''} ${modeText} 분석 (목표 ${M}명)</strong><br>
                ${limit}회 기준 스탭업이 일반보다 ${modeText}이
                <span style="color:${mainColor}; font-weight:bold;">${compText} 유리합니다.</span><br>
                <span style="font-size:0.85rem; color:#666;">(스탭업 ${sValText} vs 일반 ${nValText})</span>
            `;
        }

        const logicEl = document.getElementById(logicId);
        if (logicEl) { logicEl.style.display = 'none'; logicEl.innerHTML = ''; }
    }
    
    // ==========================================
    // CDF 누적 확률 차트 렌더링
    // ==========================================
    static renderCDFChart(data, canvasId, chartRef, targetProb, M, summaryId = 'globalSummary', logicId = 'globalLogic') {
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
                borderColor: CHART_COLORS.STEPUP,
                backgroundColor: `rgba(69, 162, 71, ${CHART.OPACITY.MIN})`,
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
                borderColor: CHART_COLORS.NORMAL,
                backgroundColor: `rgba(40, 60, 134, ${CHART.OPACITY.MIN})`,
                fill: true,
                tension: 0.3,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHitRadius: 10,
                borderWidth: 2,
                borderDash: CHART.LINE_DASH
            }
        ];

        // 목표 지점 마커 추가 (스탭업)
        if (targetProb > 0 && targetProb <= 100) {
            datasets.push({
                label: `스탭업 목표 지점 (${targetProb}%)`,
                data: labels.map((x, i) => x === targetPullsStepup ? cdfDataStepup[i] : null),
                borderColor: CHART_COLORS.STEPUP,
                backgroundColor: CHART_COLORS.STEPUP,
                pointRadius: 8,
                pointHoverRadius: 10,
                showLine: false,
                pointStyle: 'circle'
            });

            datasets.push({
                label: `일반 목표 지점 (${targetProb}%)`,
                data: labels.map((x, i) => x === targetPullsNormal ? cdfDataNormal[i] : null),
                borderColor: CHART_COLORS.NORMAL,
                backgroundColor: CHART_COLORS.NORMAL,
                pointRadius: 8,
                pointHoverRadius: 10,
                showLine: false,
                pointStyle: 'circle'
            });
        }
        
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // [개선] 기존 차트가 있으면 데이터만 업데이트
        if (chartRef && chartRef.current) {
            const chart = chartRef.current;
            chart.data.labels = labels;
            chart.data.datasets = datasets;
            chart._cdf = { targetProb, targetPullsStepup, targetPullsNormal };
            chart.update('none');

            const summaryEl = document.getElementById(summaryId);
            if (summaryEl) {
                const actualProbStepup = cdfDataStepup[targetPullsStepup] || 0;
                const actualProbNormal = cdfDataNormal[targetPullsNormal] || 0;
                const stepupProbText = Formatter.probabilityBounded(actualProbStepup / 100, FORMAT.DECIMAL_PLACES.EFFICIENCY);
                const normalProbText = Formatter.probabilityBounded(actualProbNormal / 100, FORMAT.DECIMAL_PLACES.EFFICIENCY);
                summaryEl.innerHTML = `
                    <strong>🎯 목표 확률 역추적 분석 (목표 ${M}명)</strong><br>
                    목표 달성 확률: <strong>${targetProb}%</strong><br><br>
                    <span style="color:${CHART_COLORS.STEPUP}; font-weight:bold;">스탭업 가챠:</span> 약 <strong>${targetPullsStepup}회</strong> 필요 (실제 ${stepupProbText})<br>
                    <span style="color:${CHART_COLORS.NORMAL}; font-weight:bold;">일반 가챠:</span> 약 <strong>${targetPullsNormal}회</strong> 필요 (실제 ${normalProbText})
                `;
            }
            const logicEl = document.getElementById(logicId);
            if (logicEl) { logicEl.style.display = 'none'; logicEl.innerHTML = ''; }
            return;
        }

        const ctx = canvas.getContext('2d');
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
                                    const probText = Formatter.probabilityBounded(context.raw / 100, 3);
                                    return ` ${context.dataset.label}: ${probText}`;
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
                            maxTicksLimit: CHART.MAX_TICKS.CDF_AXIS,
                            callback: function(val) {
                                const label = this.getLabelForValue(val);
                                return Number(label) % CHART.CDF_INTERVAL === 0 ? label : '';
                            }
                        }
                    }
                }
            },
            plugins: [{
                id: 'targetLine',
                afterDatasetsDraw: (chart) => {
                    const cdf = chart._cdf || { targetProb, targetPullsStepup, targetPullsNormal };
                    if (cdf.targetProb <= 0 || cdf.targetProb > 100) return;

                    const ctx = chart.ctx;
                    const xAxis = chart.scales.x;
                    const yAxis = chart.scales.y;

                    // 가로선 (목표 확률)
                    const yPos = yAxis.getPixelForValue(cdf.targetProb);

                    ctx.save();
                    ctx.setLineDash(CHART.LINE_DASH);
                    ctx.strokeStyle = '#999';
                    ctx.lineWidth = 1.5;

                    ctx.beginPath();
                    ctx.moveTo(xAxis.left, yPos);
                    ctx.lineTo(xAxis.right, yPos);
                    ctx.stroke();

                    // 세로선 (스탭업 목표 지점)
                    const xPosStepup = xAxis.getPixelForValue(cdf.targetPullsStepup);
                    ctx.strokeStyle = CHART_COLORS.STEPUP;
                    ctx.beginPath();
                    ctx.moveTo(xPosStepup, yAxis.top);
                    ctx.lineTo(xPosStepup, yAxis.bottom);
                    ctx.stroke();

                    // 세로선 (일반 목표 지점)
                    const xPosNormal = xAxis.getPixelForValue(cdf.targetPullsNormal);
                    ctx.strokeStyle = CHART_COLORS.NORMAL;
                    ctx.beginPath();
                    ctx.moveTo(xPosNormal, yAxis.top);
                    ctx.lineTo(xPosNormal, yAxis.bottom);
                    ctx.stroke();

                    ctx.restore();
                }
            }]
        });
        chartRef.current._cdf = { targetProb, targetPullsStepup, targetPullsNormal };

        // 요약 정보 업데이트
        const summaryEl = document.getElementById(summaryId);
        if (summaryEl) {
            const actualProbStepup = cdfDataStepup[targetPullsStepup] || 0;
            const actualProbNormal = cdfDataNormal[targetPullsNormal] || 0;

            const stepupProbText = Formatter.probabilityBounded(actualProbStepup / 100, FORMAT.DECIMAL_PLACES.EFFICIENCY);
            const normalProbText = Formatter.probabilityBounded(actualProbNormal / 100, FORMAT.DECIMAL_PLACES.EFFICIENCY);

            summaryEl.innerHTML = `
                <strong>🎯 목표 확률 역추적 분석 (목표 ${M}명)</strong><br>
                목표 달성 확률: <strong>${targetProb}%</strong><br><br>
                <span style="color:${CHART_COLORS.STEPUP}; font-weight:bold;">스탭업 가챠:</span> 약 <strong>${targetPullsStepup}회</strong> 필요 (실제 ${stepupProbText})<br>
                <span style="color:${CHART_COLORS.NORMAL}; font-weight:bold;">일반 가챠:</span> 약 <strong>${targetPullsNormal}회</strong> 필요 (실제 ${normalProbText})
            `;
        }

        const logicEl = document.getElementById(logicId);
        if (logicEl) { logicEl.style.display = 'none'; logicEl.innerHTML = ''; }
    }
}