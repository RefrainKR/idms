import { formatProbability } from './formatter.js';
import { renderChart, renderBarChart } from './chartHandler.js';
import { transformData } from '../math/core.js'; 

const GLOBAL_IDS = {
    summary: 'globalSummary',
    logic: 'globalLogic'
};

// 공통 차트/결과 출력 로직
export function renderResultCommon(N, chartDP, listDP, mode, ids, htmlGenerators, chartInstanceRef) {
    let chartLabels = [], chartData = [], backgroundColors = [], listLabels = [], listData = [];
    let suffix = (mode === 'cumulative_less') ? " 이하" : (mode === 'cumulative_more' ? " 이상" : "");

    for (let k = 0; k <= N; k++) {
        chartLabels.push(`${k}픽업`);
        chartData.push(parseFloat((chartDP[k] * 100).toFixed(3)));
        listLabels.push(`${k}픽업${suffix}`);
        listData.push(formatProbability(listDP[k]));
        backgroundColors.push(k === N ? '#45a247' : `rgba(40, 60, 134, ${0.3 + 0.7 * (k / N)})`);
    }

    const summaryEl = document.getElementById(ids.summary || GLOBAL_IDS.summary);
    if(summaryEl) summaryEl.innerHTML = htmlGenerators.summary();
    
    const logicContainer = document.getElementById(ids.logic || GLOBAL_IDS.logic);
    if(logicContainer) {
        logicContainer.innerHTML = htmlGenerators.logic ? htmlGenerators.logic() : '';
        logicContainer.style.display = htmlGenerators.logic ? 'block' : 'none';
    }

    const chartTooltipValues = chartDP.map(p => formatProbability(p));
    updateLegend(ids.legend, listLabels, listData, backgroundColors);
    renderChart(ids.chart, chartLabels, chartData, backgroundColors, chartTooltipValues, chartInstanceRef);
}

export function renderBarResult(dp, mode, ids, htmlGenerators, chartRef) {
    const transformedDP = transformData(dp, mode);
    
    // 1. 최대 확률 구간 찾기 (그래프 중심 잡기 및 색상 강조용)
    let maxVal = -1, maxIndex = -1;
    for(let i=0; i<transformedDP.length; i++) { 
        if (transformedDP[i] > maxVal) { maxVal = transformedDP[i]; maxIndex = i; } 
    }

    // 2. 유의미한 확률 구간 탐색 (0.01% 미만 제외)
    const THRESHOLD = 0.0001;
    let startK = 0;
    let endK = transformedDP.length - 1;

    for (let i = 0; i < transformedDP.length; i++) {
        if (transformedDP[i] >= THRESHOLD) { startK = i; break; }
    }
    for (let i = transformedDP.length - 1; i >= 0; i--) {
        if (transformedDP[i] >= THRESHOLD) { endK = i; break; }
    }

    // 3. [복구됨] 구간이 15개를 넘어가면, 최대 확률 지점(maxIndex)을 기준으로 자르기
    const MAX_BARS = 15;
    const currentRange = endK - startK + 1;

    if (currentRange > MAX_BARS) {
        // maxIndex를 중심으로 앞뒤로 배분
        let half = Math.floor(MAX_BARS / 2); // 7
        startK = maxIndex - half;
        endK = startK + MAX_BARS - 1;

        // 배열 범위를 벗어나지 않도록 보정
        if (startK < 0) {
            startK = 0;
            endK = Math.min(transformedDP.length - 1, MAX_BARS - 1);
        }
        if (endK >= transformedDP.length) {
            endK = transformedDP.length - 1;
            startK = Math.max(0, endK - MAX_BARS + 1);
        }
    } else {
        // 15개 미만이면 앞뒤로 1칸씩 여유를 둠 (시각적 답답함 해소)
        startK = Math.max(0, startK - 1);
        endK = Math.min(transformedDP.length - 1, endK + 1);
    }

    const labels = [], data = [], colors = [], tooltipValues = [];
    let suffix = (mode === 'cumulative_less') ? " 이하" : (mode === 'cumulative_more' ? " 이상" : "");

    for (let k = startK; k <= endK; k++) {
        const val = transformedDP[k] || 0;
        
        labels.push(`${k}${suffix}`); 
        data.push((val * 100).toFixed(2));
        tooltipValues.push(formatProbability(val));
        
        // 색상: 최대값은 초록색, 나머지는 연한 파랑(#e3f2fd)
        colors.push(k === maxIndex && mode === 'individual' ? '#45a247' : '#e3f2fd');
    }

    const summaryEl = document.getElementById(ids.summary || 'globalSummary');
    if(summaryEl) summaryEl.innerHTML = htmlGenerators.summary();
    
    const logicContainer = document.getElementById(ids.logic || 'globalLogic');
    if(logicContainer) logicContainer.style.display = 'none';

    renderBarChart(ids.chart, labels, data, colors, tooltipValues, chartRef);
}

// 기존 함수들을 renderBarResult로 래핑하여 호환성 유지
export function renderTotalBarResult(dp, mode, ids, summaryHtml, chartRef) {
    renderBarResult(dp, mode, ids, { summary: () => summaryHtml }, chartRef);
}

export function renderSpecificBarResult(dp, mode, ids, summaryHtml, chartRef) {
    renderBarResult(dp, mode, ids, { summary: () => summaryHtml }, chartRef);
}

function updateLegend(elementId, labels, data, colors) {
    const listContainer = document.getElementById(elementId);
    if (!listContainer) return;
    listContainer.innerHTML = '';
    labels.forEach((label, index) => {
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.innerHTML = `<div class="legend-label"><span class="color-dot" style="background-color: ${colors[index]};"></span><span>${label}</span></div><div class="legend-value">${data[index]}</div>`;
        listContainer.appendChild(item);
    });
}