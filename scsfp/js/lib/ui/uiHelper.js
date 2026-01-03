import { formatProbability } from './formatter.js';
import { renderChart, renderBarChart } from './chartHandler.js';
// [수정] transformData는 여기서 필요 없으므로 제거 (호출하는 모듈에서 미리 처리)
// import { transformData } from '../math/core.js'; 

// 1. 수집 종류 분석 (원 그래프)
// [핵심 수정] 인자 목록 변경: chartDP, listDP를 명시적으로 받음
export function renderResultCommon(
    N, chartDP, listDP, mode, // DP 데이터와 모드
    ids, // { chart, legend, summary, logic }
    htmlGenerators, // { summary: () => string, logic: () => string }
    chartInstanceRef // Chart 인스턴스 참조
) {
    // [제거] 여기서는 transformData를 호출하지 않음 (호출하는 모듈에서 이미 처리)
    // const chartDP = dp; 
    // const listDP = transformData(dp, mode);

    let chartLabels = [];
    let chartData = [];
    let backgroundColors = [];
    let listLabels = [];
    let listData = [];

    let suffix = "";
    if (mode === 'cumulative_less') suffix = " 이하";
    else if (mode === 'cumulative_more') suffix = " 이상";

    for (let k = 0; k <= N; k++) {
        chartLabels.push(`${k}픽업`);
        chartData.push(parseFloat((chartDP[k] * 100).toFixed(3)));
        
        listLabels.push(`${k}픽업${suffix}`);
        listData.push(formatProbability(listDP[k]));

        if (k === N) backgroundColors.push('#45a247');
        else {
            let opacity = 0.3 + (0.7 * (k / N));
            backgroundColors.push(`rgba(40, 60, 134, ${opacity})`);
        }
    }

    // 요약 및 상세 로직 HTML 주입
    document.getElementById(ids.summary).innerHTML = htmlGenerators.summary();
    const logicContainer = document.getElementById(ids.logic);
    logicContainer.innerHTML = htmlGenerators.logic();
    logicContainer.style.display = 'block';

    const chartTooltipValues = chartDP.map(p => formatProbability(p));

    updateLegend(ids.legend, listLabels, listData, backgroundColors);
    renderChart(ids.chart, chartLabels, chartData, backgroundColors, chartTooltipValues, chartInstanceRef);
}

// 2. 총 획득 수 분석 (막대 그래프)
// [수정] 인자 목록 변경: dpTotal, mode는 그대로 받고, transformData 호출
export function renderTotalBarResult(
    dpTotal, mode, 
    ids, // { chart, summary }
    summaryHtml,
    chartRef
) {
    const transformedDP = transformData(dpTotal, mode); // [유지] 여기서 transformData 호출
    
    // ... (기존 로직 동일) ...
    let expectedValue = 0;
    for(let i=0; i<dpTotal.length; i++) expectedValue += i * dpTotal[i];
    const avgIndex = Math.round(expectedValue);

    let startK = Math.max(0, avgIndex - 8);
    let endK = startK + 15; 
    if (endK >= transformedDP.length) {
        endK = transformedDP.length - 1;
        startK = Math.max(0, endK - 15);
    }

    let tempResults = [];
    for (let k = startK; k <= endK; k++) {
        const val = transformedDP[k] || 0;
        if (mode === 'individual' && val < 0.0001 && Math.abs(k - avgIndex) > 4) continue;
        tempResults.push({ k, val, formatted: formatProbability(val) });
    }
    
    while (tempResults.length < 10) {
        let added = false;
        if (tempResults[0].k > 0) {
            const nextK = tempResults[0].k - 1;
            const val = transformedDP[nextK] || 0;
            tempResults.unshift({ k: nextK, val, formatted: formatProbability(val) });
            added = true;
        }
        if (tempResults.length >= 10) break;
        if (tempResults[tempResults.length - 1].k < transformedDP.length - 1) {
            const nextK = tempResults[tempResults.length - 1].k + 1;
            const val = transformedDP[nextK] || 0;
            tempResults.push({ k: nextK, val, formatted: formatProbability(val) });
            added = true;
        }
        if (!added) break;
    }

    const labels = [];
    const data = [];
    const colors = [];
    const tooltipValues = [];
    let suffix = (mode === 'cumulative_less') ? " 이하" : (mode === 'cumulative_more' ? " 이상" : "");

    tempResults.forEach(item => {
        labels.push(`${item.k}개${suffix}`);
        data.push((item.val * 100).toFixed(3));
        tooltipValues.push(item.formatted);
        if (item.k === avgIndex && mode === 'individual') colors.push('#45a247');
        else colors.push('#283c86');
    });

    document.getElementById(ids.summary).innerHTML = summaryHtml;
    renderBarChart(ids.chart, labels, data, colors, tooltipValues, chartRef);
}

// 3. 특정 픽업 획득 수 (막대 그래프)
// [수정] 인자 목록 변경: dpSpecific, mode는 그대로 받고, transformData 호출
export function renderSpecificBarResult(
    dpSpecific, mode,
    ids, // { chart, summary }
    summaryHtml,
    chartRef
) {
    const transformedDP = transformData(dpSpecific, mode); // [유지] 여기서 transformData 호출
    
    // ... (기존 로직 동일) ...
    let expectedValue = 0;
    for(let i=0; i<dpSpecific.length; i++) expectedValue += i * dpSpecific[i];
    const avgIndex = Math.round(expectedValue);

    let startK = Math.max(0, avgIndex - 5);
    let endK = startK + 9;
    if (endK >= transformedDP.length) {
        endK = transformedDP.length - 1;
        startK = Math.max(0, endK - 9);
    }
    
    let tempResults = [];
    for (let k = startK; k <= endK; k++) {
        const val = transformedDP[k] || 0;
        if (mode === 'individual' && val < 0.0001 && Math.abs(k - avgIndex) > 3) continue;
        tempResults.push({ k, val, formatted: formatProbability(val) });
    }
    while (tempResults.length < 5 && tempResults.length < transformedDP.length) {
        let added = false;
        if (tempResults[0].k > 0) {
            const nextK = tempResults[0].k - 1;
            const val = transformedDP[nextK] || 0;
            tempResults.unshift({ k: nextK, val, formatted: formatProbability(val) });
            added = true;
        }
        if (tempResults.length >= 5) break;
        if (tempResults[tempResults.length - 1].k < transformedDP.length - 1) {
            const nextK = tempResults[tempResults.length - 1].k + 1;
            const val = transformedDP[nextK] || 0;
            tempResults.push({ k: nextK, val, formatted: formatProbability(val) });
            added = true;
        }
        if (!added) break;
    }

    const labels = [];
    const data = [];
    const colors = [];
    const tooltipValues = [];
    let suffix = (mode === 'cumulative_less') ? " 이하" : (mode === 'cumulative_more' ? " 이상" : "");

    tempResults.forEach(item => {
        labels.push(`${item.k}개${suffix}`);
        data.push((item.val * 100).toFixed(3));
        tooltipValues.push(item.formatted);

        if (item.k === 0) colors.push('#e0e0e0');
        else if (item.k === 1) colors.push('#ffcd56'); 
        else if (item.k === avgIndex && mode === 'individual') colors.push('#45a247');
        else colors.push('#36a2eb'); 
    });

    document.getElementById(ids.summary).innerHTML = summaryHtml;
    renderBarChart(ids.chart, labels, data, colors, tooltipValues, chartRef);
}

// (내부 헬퍼) 범례 업데이트 (기존 유지)
export function updateLegend(elementId, labels, data, colors) {
    const listContainer = document.getElementById(elementId);
    listContainer.innerHTML = '';
    labels.forEach((label, index) => {
        const percent = data[index];
        const color = colors[index];
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.innerHTML = `
            <div class="legend-label">
                <span class="color-dot" style="background-color: ${color};"></span>
                <span>${label}</span>
            </div>
            <div class="legend-value">${percent}</div>
        `;
        listContainer.appendChild(item);
    });
}