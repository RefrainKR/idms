import { GachaBaseView } from './GachaBaseView.js';
import { Formatter } from '../../utils/Formatter.js';
import { ChartUtils } from '../ChartUtils.js';
import { getGachaConfig, getActiveSubTab } from './GachaViewConfig.js';
import { FORMAT, CHART, CHART_RANGE, CHART_COLORS } from '../../config/UIConfig.js';

export class GachaResultView extends GachaBaseView {

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
        const { targetCount, collectionDp, totalAcquisitionDp } = result;

        // 수집 확률 (Pie Chart)
        if (activeSubTab === config.subTabs.collection) {
            this._renderCollectionTab(gachaType, config, targetCount, collectionDp, viewMode, context, charts);
        }
        // 총 획득 수 (Bar Chart)
        else if (activeSubTab === config.subTabs.total) {
            this._renderTotalTab(gachaType, config, targetCount, totalAcquisitionDp, viewMode, context, charts);
        }
        // 효율 비교 (Line Chart) + CDF 역추적 통합
        else if (activeSubTab === config.subTabs.efficiency) {
            this._renderEfficiencyTab(gachaType, config, targetCount, context, model, charts);
        }
    }

    // 수집 확률 탭 렌더링
    static _renderCollectionTab(gachaType, config, targetCount, collectionDp, viewMode, context, charts) {
        const summaryFn = this._getCollectionSummary(gachaType, context, targetCount, collectionDp);
        const logicFn = this._getLogic(gachaType, context);

        this.renderCollection(targetCount, collectionDp, viewMode,
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
    static _renderTotalTab(gachaType, config, targetCount, totalAcquisitionDp, viewMode, context, charts) {
        const expected = totalAcquisitionDp.reduce((acc, probability, count) => acc + count * probability, 0);
        const summaryFn = () => `
            타겟(${targetCount}종) 총 획득 기대 수: 약 <strong>${expected.toFixed(FORMAT.DECIMAL_PLACES.PROBABILITY)}개</strong>
            <p class="reference-info">※ 유효 픽업 ${targetCount}종의 중복 포함 획득 개수 합계입니다.</p>
            <p class="reference-caution">※ 천장 버튼이 활성화되어 있는지 확인하세요.</p>
        `;

        this.renderTotalCount(totalAcquisitionDp, viewMode,
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
    static _renderEfficiencyTab(gachaType, config, targetCount, context, model, charts) {
        if (!context.strategyComparison) return;

        let xLimit, comparedTargetCount, targetLabel, useStar2PointStyle;

        if (gachaType === 'star3') {
            xLimit = context.strategyComparisonLimit;
            comparedTargetCount = targetCount;
            targetLabel = '';
            useStar2PointStyle = false;
        } else if (gachaType === 'birthday') {
            xLimit = CHART_RANGE.EFFICIENCY_X_LIMIT.BIRTHDAY;
            comparedTargetCount = targetCount;
            targetLabel = '';
            useStar2PointStyle = false;
        } else if (gachaType === 'collab') {
            xLimit = CHART_RANGE.EFFICIENCY_X_LIMIT.COLLAB;
            comparedTargetCount = targetCount;
            targetLabel = '';
            useStar2PointStyle = false;
        } else if (gachaType === 'star2') {
            xLimit = CHART_RANGE.EFFICIENCY_X_LIMIT.STAR2;
            comparedTargetCount = context.targetGroupInfo
                ? context.targetGroupInfo.targetCount
                : targetCount;
            targetLabel = context.targetGroupInfo ? context.targetGroupInfo.id : '';
            useStar2PointStyle = true;
        }

        this.renderEfficiencyChart(
            context.strategyComparison,
            config.charts.efficiency.canvas,
            model.efficiencyMode.value === 'worst',
            charts.efficiency,
            xLimit,
            comparedTargetCount,
            targetLabel,
            useStar2PointStyle,
            config.summary.element,
            config.summary.logic,
            context.completionCdf || null,
            model.targetProbability ? model.targetProbability.value : null,
            targetCount
        );
    }

    // 가챠 타입별 수집 요약 생성
    static _getCollectionSummary(gachaType, context, targetCount, collectionDp) {
        const pickupCount = context.pickupCount || targetCount;

        if (gachaType === 'star3') {
            const tMode = context.targetMode;
            const modeLabel = tMode === 'any'
                ? `아무나 ${targetCount}픽업 이상`
                : `${targetCount}픽업 저격`;
            return () => `
                <strong>결과</strong> (${pickupCount}픽업 중 ${modeLabel})<br>
                - 가챠 횟수 : ${context.totalPulls}회 (일반 ${context.normalPulls} + 스탭업 ${context.stepPulls})<br>
                - 확정 획득 : ${context.totalGuaranteedSelectCount}회 (공유 200스택 천장 ${context.sharedCeilingSelectCount} + 스탭업 셀렉 티켓 ${context.loopSelectTicketCount})<br>
                - ${modeLabel} 확률 : <strong>${Formatter.probabilityFraction(collectionDp[targetCount])}</strong>
            `;
        } else if (gachaType === 'birthday') {
            const guaranteedMsg = context.guaranteedTargetCount > 0
                ? `<br><span style="color:${CHART_COLORS.STEPUP};">✅ Step3 확정 ${context.guaranteedTargetCount}회 획득!</span>`
                : '';
            return () => `
                <strong>생일 가챠 결과</strong><br>
                - 가챠 횟수: ${context.totalPulls}회 (일반 ${context.normalPulls} + 스탭업 ${context.stepPulls})<br>
                - 공유 200스택 천장: ${context.sharedSelectRewardCount}회<br>
                - 획득 확률: <strong>${Formatter.probabilityFraction(collectionDp[targetCount])}</strong>
                ${guaranteedMsg}
            `;
        } else if (gachaType === 'collab') {
            return () => `
                <strong>콜라보 가챠 결과</strong> (전체 ${pickupCount}종 중 ${targetCount}종)<br>
                - 가챠 횟수: ${context.totalPulls}회 (일반 ${context.normalPulls} + 스탭업 ${context.stepPulls})<br>
                - 공유 200스택 천장: ${context.sharedSelectRewardCount}회<br>
                - 목표(${targetCount}종) 올컴플릿 확률: <strong>${Formatter.probabilityFraction(collectionDp[targetCount])}</strong>
            `;
        } else if (gachaType === 'star2') {
            return () => `
                <strong>결과</strong> (${pickupCount}픽업 중 ${targetCount}픽업)<br>
                - 가챠 횟수 : ${context.totalPulls}회 / 천장 : ${context.totalGuaranteedSelectCount}회 (일반 ${context.normalSelectRewardCount} + 스탭업 ${context.stepupSelectRewardCount})<br>
                - 목표(${targetCount}종) 올컴플릿 확률 : <strong>${Formatter.probabilityFraction(collectionDp[targetCount])}</strong>
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
                    <li>스탭업 일반 구간 개별 ${ctx.individualPickupRatePercent}% (${ctx.regularStepupPullCount}회), Step4 개별 ${Formatter.probabilityBounded(ctx.step4PickupTotalRatePercent/ctx.pickupCount/100, 3)} (${ctx.step4PullCount}회)</li>
                    <li>주회 보상: ${rewardHistory}</li>
                    <li>랜덤 픽업 티켓 ${ctx.randomTicketCount}회, 확정 획득 ${ctx.totalGuaranteedSelectCount}회 (공유 200스택 천장 ${ctx.sharedCeilingSelectCount} + 스탭업 셀렉 티켓 ${ctx.loopSelectTicketCount})</li>
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
                        ${ctx.guaranteedTargetCount ? ` <strong style="color:${CHART_COLORS.STEPUP};">[30회 확정 획득!]</strong>` : ''}
                    </li>
                    <li><strong>공유 200스택 천장:</strong> ${strike(`${ctx.sharedSelectRewardCount}회`, isCeilingOff)}</li>
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
        const pNorm = Formatter.probabilityBounded(ctx.totalPickupRate / ctx.pickupCount, 3);
        const pHigh = Formatter.probabilityBounded(0.95 / ctx.pickupCount, 3);

        // 2. 스탭업 그룹별 통계
        let groupDetails = "";
        let totalStepNormal = 0, totalStepGuar = 0;

        ctx.groups.forEach(group => {
            let gNormal = 0, gGuar = 0;
            for (let i = 1; i <= group.stepupPulls; i++) {
                if (i === 5 || (i > 5 && (i - 5) % 10 === 0)) gGuar++; else gNormal++;
            }
            totalStepNormal += gNormal;
            totalStepGuar += gGuar;
            const pIndiv = Formatter.probabilityBounded(ctx.totalPickupRate / group.pickupCount, 3);
            const pGuar = Formatter.probabilityBounded(1 / group.pickupCount, 3);
            groupDetails += `<li>그룹 ${group.id} (${group.pickupCount}종): 개별 ${pIndiv} (${gNormal}회), 확정 ${pGuar} (${gGuar}회)</li>`;
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
                    <li><strong>일반 100스택 천장(${ctx.normalSelectRewardCount}회):</strong> ${strike("100회당 1개", isCeilingOff)}</li>
                    <li><strong>스탭업 50스택 천장(${ctx.stepupSelectRewardCount}회):</strong> ${strike("50회당 1개", isCeilingOff)}</li>
                    <li>알고리즘: Convolution + DP</li>
                </ul>
            </div>`;
    }

    // ==========================================
    // 공통: 효율 그래프 렌더링 (CDF 통합 버전)
    // ==========================================
    static renderEfficiencyChart(data, canvasId, isWorst, chartRef, limit, targetCount, groupName = '', isStar2 = false, summaryId = 'gachaSummary', logicId = 'gachaLogic', completionCdf = null, targetProbability = 0, totalTargetCount = targetCount) {
        const {
            labels,
            normalOnlyData,
            comparedStrategyData
        } = data;

        const modeKey = isWorst ? 'worst' : 'best';
        const comparedStrategyValues = comparedStrategyData.map(value => parseFloat(value[modeKey]));
        const normalOnlyValues = normalOnlyData.map(value => parseFloat(value[modeKey]));
        const comparedStrategyLabel = groupName
            ? `스탭업 (${groupName} 그룹)`
            : '스탭업';

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
                label: comparedStrategyLabel,
                data: comparedStrategyValues,
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
                label: '일반',
                data: normalOnlyValues,
                borderColor: CHART_COLORS.NORMAL,
                borderDash: CHART.LINE_DASH,
                tension: 0.1,
                pointRadius: (ctx) => (ctx.dataIndex % 10 === 0 ? 3.5 : 0),
                pointHitRadius: getHitRadius,
                pointBackgroundColor: CHART_COLORS.NORMAL,
                borderWidth: 1.5
            }
        ];

        // CDF 목표 지점 마커 추가
        let comparedStrategyRequiredPulls = null;
        let normalOnlyRequiredPulls = null;
        if (completionCdf && targetProbability > 0 && targetProbability <= 100) {
            const {
                labels: cdfLabels,
                comparedStrategyCompletionCdf,
                normalOnlyCompletionCdf,
                comparedStrategyRequiredPulls: calculatedComparedRequiredPulls,
                normalOnlyRequiredPulls: calculatedNormalRequiredPulls
            } = completionCdf;

            // 계산 범위 안에서 미달이면 기존 UI 동작대로 마지막 Pull 지점을 표시한다.
            comparedStrategyRequiredPulls = calculatedComparedRequiredPulls
                ?? cdfLabels[cdfLabels.length - 1];
            normalOnlyRequiredPulls = calculatedNormalRequiredPulls
                ?? cdfLabels[cdfLabels.length - 1];

            // efficiency labels 기준으로 마커 데이터 생성
            const comparedStrategyMarkerData = labels.map(pulls =>
                pulls === comparedStrategyRequiredPulls
                    ? (comparedStrategyValues[labels.indexOf(pulls)] ?? null)
                    : null
            );
            const normalOnlyMarkerData = labels.map(pulls =>
                pulls === normalOnlyRequiredPulls
                    ? (normalOnlyValues[labels.indexOf(pulls)] ?? null)
                    : null
            );

            datasets.push({
                label: `${comparedStrategyLabel} 목표지점 (${targetProbability}%)`,
                data: comparedStrategyMarkerData,
                borderColor: mainColor,
                backgroundColor: mainColor,
                pointRadius: 8,
                pointHoverRadius: 10,
                showLine: false,
                pointStyle: 'circle',
                datalabels: { display: false }
            });

            datasets.push({
                label: `일반 목표지점 (${targetProbability}%)`,
                data: normalOnlyMarkerData,
                borderColor: CHART_COLORS.NORMAL,
                backgroundColor: CHART_COLORS.NORMAL,
                pointRadius: 8,
                pointHoverRadius: 10,
                showLine: false,
                pointStyle: 'circle',
                datalabels: { display: false }
            });
        }

        // 차트 플러그인: 목표 확률 가로선 + 세로 점선
        const cdfLinePlugin = {
            id: 'cdfTargetLine',
            afterDatasetsDraw: (chart) => {
                const state = chart._completionCdfState;
                if (!state || state.targetProbability <= 0 || state.targetProbability > 100) return;
                if (state.comparedStrategyRequiredPulls === null
                    && state.normalOnlyRequiredPulls === null) return;

                const ctx2 = chart.ctx;
                const xAxis = chart.scales.x;
                const yAxis = chart.scales.y;

                ctx2.save();
                ctx2.setLineDash(CHART.LINE_DASH);
                ctx2.lineWidth = 1.5;

                // 가로 점선 (목표 확률 기준선)
                const yPos = yAxis.getPixelForValue(state.targetProbability);
                ctx2.strokeStyle = '#999';
                ctx2.beginPath();
                ctx2.moveTo(xAxis.left, yPos);
                ctx2.lineTo(xAxis.right, yPos);
                ctx2.stroke();

                // 세로 점선 (비교 스탭업 전략)
                if (state.comparedStrategyRequiredPulls !== null) {
                    const xPosS = xAxis.getPixelForValue(state.comparedStrategyRequiredPulls);
                    ctx2.strokeStyle = state.mainColor;
                    ctx2.beginPath();
                    ctx2.moveTo(xPosS, yAxis.top);
                    ctx2.lineTo(xPosS, yAxis.bottom);
                    ctx2.stroke();
                }

                // 세로 점선 (일반)
                if (state.normalOnlyRequiredPulls !== null) {
                    const xPosN = xAxis.getPixelForValue(state.normalOnlyRequiredPulls);
                    ctx2.strokeStyle = CHART_COLORS.NORMAL;
                    ctx2.beginPath();
                    ctx2.moveTo(xPosN, yAxis.top);
                    ctx2.lineTo(xPosN, yAxis.bottom);
                    ctx2.stroke();
                }

                ctx2.restore();
            }
        };

        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // 기존 차트 업데이트 or 신규 생성
        if (chartRef && chartRef.current) {
            const chart = chartRef.current;
            chart.data.labels = labels;
            chart.data.datasets = datasets;
            chart._completionCdfState = {
                targetProbability,
                comparedStrategyRequiredPulls,
                normalOnlyRequiredPulls,
                mainColor
            };
            chart.update('none');
        } else {
            const ctx2 = canvas.getContext('2d');
            chartRef.current = new Chart(ctx2, {
                type: 'line',
                data: { labels, datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false,
                    interaction: { mode: 'index', intersect: true },
                    plugins: {
                        legend: { position: 'top', labels: { boxWidth: 12 } },
                        datalabels: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    if (context.datasetIndex <= 1) {
                                        let label = context.dataset.label.split(' ')[0] || '';
                                        const probText = Formatter.probabilityBounded(context.raw / 100, FORMAT.DECIMAL_PLACES.PROBABILITY);
                                        return ` ${label}: ${probText}`;
                                    }
                                    return null;
                                },
                                footer: (items) => {
                                    const visible = items.filter(i => i.datasetIndex <= 1);
                                    if (visible.length < 2) return '';
                                    const v1 = parseFloat(visible[0].raw);
                                    const v2 = parseFloat(visible[1].raw);
                                    const diff = Math.abs(v1 - v2) / 100;
                                    const diffText = Formatter.probabilityBounded(diff, FORMAT.DECIMAL_PLACES.PROBABILITY).replace('%', '');
                                    return ` 차이: ${diffText}%p`;
                                }
                            },
                            footerFont: { weight: 'bold', size: 12 },
                            footerColor: mainColor,
                            filter: (item) => item.datasetIndex <= 1
                        }
                    },
                    scales: {
                        y: { beginAtZero: true, max: 100, ticks: { callback: (v) => v + '%' } },
                        x: {
                            grid: { display: false },
                            ticks: {
                                maxTicksLimit: CHART.MAX_TICKS.CDF_AXIS,
                                callback: function(val) {
                                    const label = this.getLabelForValue(val);
                                    return Number(label) % 20 === 0 ? label : '';
                                }
                            }
                        }
                    }
                },
                plugins: [cdfLinePlugin]
            });
            chartRef.current._completionCdfState = {
                targetProbability,
                comparedStrategyRequiredPulls,
                normalOnlyRequiredPulls,
                mainColor
            };
        }

        // 요약: CDF 결과 우선, 없으면 효율 비교
        const summaryEl = document.getElementById(summaryId);
        if (summaryEl) {
            if (completionCdf && targetProbability > 0 && targetProbability <= 100
                && comparedStrategyRequiredPulls !== null) {
                const { comparedStrategyCompletionCdf, normalOnlyCompletionCdf } = completionCdf;
                const comparedIndex = completionCdf.labels.indexOf(comparedStrategyRequiredPulls);
                const normalIndex = completionCdf.labels.indexOf(normalOnlyRequiredPulls);
                const comparedProbability = comparedIndex >= 0
                    ? comparedStrategyCompletionCdf[comparedIndex]
                    : 0;
                const normalProbability = normalIndex >= 0
                    ? normalOnlyCompletionCdf[normalIndex]
                    : 0;
                const comparedProbabilityText = Formatter.probabilityBounded(
                    comparedProbability / 100,
                    FORMAT.DECIMAL_PLACES.EFFICIENCY
                );
                const normalProbabilityText = Formatter.probabilityBounded(
                    normalProbability / 100,
                    FORMAT.DECIMAL_PLACES.EFFICIENCY
                );
                summaryEl.innerHTML = `
                    <strong>목표 달성 확률 ${targetProbability}% (목표 ${totalTargetCount}명)</strong><br>
                    <span style="color:${mainColor}; font-weight:bold;">${comparedStrategyLabel}:</span> 약 <strong>${comparedStrategyRequiredPulls}회</strong> 필요 (실제 ${comparedProbabilityText})<br>
                    <span style="color:${CHART_COLORS.NORMAL}; font-weight:bold;">일반:</span> 약 <strong>${normalOnlyRequiredPulls}회</strong> 필요 (실제 ${normalProbabilityText})
                `;
            } else {
                const comparedValue = comparedStrategyValues[limit];
                const normalValue = normalOnlyValues[limit];
                const comparedValueText = Formatter.probabilityBounded(comparedValue / 100, 3);
                const normalValueText = Formatter.probabilityBounded(normalValue / 100, 3);
                const modeText = isWorst ? '실패(폭사) 확률' : '성공(졸업) 확률';
                const compText = isWorst ? '낮아' : '높아';
                summaryEl.innerHTML = `
                    <strong>${groupName ? `${groupName} 그룹 ` : ''}${modeText} 분석 (목표 ${totalTargetCount}명)</strong><br>
                    ${limit}회 기준 ${comparedStrategyLabel}이 일반보다 ${modeText}이
                    <span style="color:${mainColor}; font-weight:bold;">${compText} 유리합니다.</span><br>
                    <span style="font-size:0.85rem; color:#666;">(${comparedStrategyLabel} ${comparedValueText} vs 일반 ${normalValueText})</span>
                `;
            }
        }

        const logicEl = document.getElementById(logicId);
        if (logicEl) { logicEl.style.display = 'none'; logicEl.innerHTML = ''; }
    }
}
