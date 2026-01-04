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

// 총 획득 수/특정 픽업 바 차트 출력 통합 함수
export function renderBarResult(dp, mode, ids, htmlGenerators, chartRef) {
    const transformedDP = transformData(dp, mode);
    
    // 최대 확률 구간 찾기 (그래프 색상 강조용)
    let maxVal = -1, maxIndex = -1;
    for(let i=0; i<transformedDP.length; i++) { 
        if (transformedDP[i] > maxVal) { maxVal = transformedDP[i]; maxIndex = i; } 
    }

    // [수정 1] 유의미한 확률 구간 동적 탐색 (0.01% 미만 제외)
    const THRESHOLD = 0.0001; // 0.01%
    let startK = 0;
    let endK = transformedDP.length - 1;

    // 앞에서부터 탐색하여 의미 있는 첫 구간 찾기
    for (let i = 0; i < transformedDP.length; i++) {
        if (transformedDP[i] >= THRESHOLD) {
            startK = i;
            break;
        }
    }
    // 뒤에서부터 탐색하여 의미 있는 마지막 구간 찾기
    for (let i = transformedDP.length - 1; i >= 0; i--) {
        if (transformedDP[i] >= THRESHOLD) {
            endK = i;
            break;
        }
    }

    // 시각적 답답함을 줄이기 위해 앞뒤로 1칸씩만 여유(Padding)를 둠
    startK = Math.max(0, startK - 1);
    endK = Math.min(transformedDP.length - 1, endK + 1);

    const labels = [], data = [], colors = [], tooltipValues = [];
    let suffix = (mode === 'cumulative_less') ? " 이하" : (mode === 'cumulative_more' ? " 이상" : "");

    for (let k = startK; k <= endK; k++) {
        const val = transformedDP[k] || 0;
        
        labels.push(`${k}${suffix}`); 
        
        data.push((val * 100).toFixed(2));
        tooltipValues.push(formatProbability(val));
        colors.push(k === maxIndex && mode === 'individual' ? '#45a247' : '#e3f2fd');
    }

    const summaryEl = document.getElementById(ids.summary || GLOBAL_IDS.summary);
    if(summaryEl) summaryEl.innerHTML = htmlGenerators.summary();
    
    const logicContainer = document.getElementById(ids.logic || GLOBAL_IDS.logic);
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