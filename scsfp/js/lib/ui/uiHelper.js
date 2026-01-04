import { formatProbability } from './formatter.js';
import { renderChart, renderBarChart } from './chartHandler.js';
import { transformData } from '../math/core.js'; 

const GLOBAL_IDS = {
    summary: 'globalSummary',
    logic: 'globalLogic'
};

// 1. 수집 종류 분석 (원 그래프) - 이미 정상 작동 중
export function renderResultCommon(
    N, chartDP, listDP, mode, 
    ids, 
    htmlGenerators, 
    chartInstanceRef
) {
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

    // [정상] 공통 ID 사용 중
    const summaryEl = document.getElementById(GLOBAL_IDS.summary);
    if(summaryEl) summaryEl.innerHTML = htmlGenerators.summary();
    
    const logicContainer = document.getElementById(GLOBAL_IDS.logic);
    if(logicContainer) {
        logicContainer.innerHTML = htmlGenerators.logic();
        logicContainer.style.display = 'block';
    }

    const chartTooltipValues = chartDP.map(p => formatProbability(p));
    updateLegend(ids.legend, listLabels, listData, backgroundColors);
    renderChart(ids.chart, chartLabels, chartData, backgroundColors, chartTooltipValues, chartInstanceRef);
}

// 2. 총 획득 수 분석 (막대 그래프)
export function renderTotalBarResult(
    dpTotal, mode, 
    ids, 
    summaryHtml,
    chartRef
) {
    const transformedDP = transformData(dpTotal, mode);
    
    let expectedValue = 0;
    for(let i=0; i<dpTotal.length; i++) expectedValue += i * dpTotal[i];
    const avgIndex = Math.round(expectedValue);

    let maxVal = -1;
    let maxIndex = -1;
    for(let i=0; i<transformedDP.length; i++) {
        if (transformedDP[i] > maxVal) {
            maxVal = transformedDP[i];
            maxIndex = i;
        }
    }

    let startK = Math.max(0, avgIndex - 7);
    let endK = startK + 14; 
    
    if (endK >= transformedDP.length) {
        endK = transformedDP.length - 1;
        startK = Math.max(0, endK - 14);
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
        data.push((item.val * 100).toFixed(2));
        tooltipValues.push(item.formatted);

        if (item.k === maxIndex && mode === 'individual') {
            colors.push('#45a247');
        } else {
            colors.push('#bbdefb');
        }
    });

    // [수정] ids.summary 대신 공통 ID 사용
    const summaryEl = document.getElementById(GLOBAL_IDS.summary);
    if (summaryEl) summaryEl.innerHTML = summaryHtml;

    // [수정] 막대 그래프 탭에서는 상세 계산 근거를 숨김
    const logicContainer = document.getElementById(GLOBAL_IDS.logic);
    if(logicContainer) logicContainer.style.display = 'none';

    renderBarChart(ids.chart, labels, data, colors, tooltipValues, chartRef);
}

// 3. 특정 픽업 획득 수 (막대 그래프)
export function renderSpecificBarResult(
    dpSpecific, mode,
    ids, 
    summaryHtml,
    chartRef
) {
    const transformedDP = transformData(dpSpecific, mode);
    
    let expectedValue = 0;
    for(let i=0; i<dpSpecific.length; i++) expectedValue += i * dpSpecific[i];
    const avgIndex = Math.round(expectedValue);

    let maxVal = -1;
    let maxIndex = -1;
    for(let i=0; i<transformedDP.length; i++) {
        if (transformedDP[i] > maxVal) {
            maxVal = transformedDP[i];
            maxIndex = i;
        }
    }

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
        data.push((item.val * 100).toFixed(2));
        tooltipValues.push(item.formatted);

        if (item.k === maxIndex && mode === 'individual') {
            colors.push('#45a247');
        } else {
            colors.push('#bbdefb');
        }
    });

    // [수정] ids.summary 대신 공통 ID 사용
    const summaryEl = document.getElementById(GLOBAL_IDS.summary);
    if (summaryEl) summaryEl.innerHTML = summaryHtml;

    // [수정] 상세 계산 근거 숨김
    const logicContainer = document.getElementById(GLOBAL_IDS.logic);
    if(logicContainer) logicContainer.style.display = 'none';

    renderBarChart(ids.chart, labels, data, colors, tooltipValues, chartRef);
}

// ... updateLegend ...
function updateLegend(elementId, labels, data, colors) {
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