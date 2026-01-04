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
    // 1. 표시 범위와 Peak 위치는 항상 '개별 확률(Individual)'을 기준으로 산출
    const individualDP = transformData(dp, 'individual');
    
    // 개별 확률 기준 Peak(최빈값) 찾기 -> maxIndex가 기준점이 됩니다.
    let maxVal = -1, maxIndex = -1;
    for(let i=0; i<individualDP.length; i++) { 
        if (individualDP[i] > maxVal) { maxVal = individualDP[i]; maxIndex = i; } 
    }

    // 개별 확률 기준 유의미한 구간 탐색
    const THRESHOLD = 0.0001;
    let startK = 0;
    let endK = individualDP.length - 1;

    for (let i = 0; i < individualDP.length; i++) {
        if (individualDP[i] >= THRESHOLD) { startK = i; break; }
    }
    for (let i = individualDP.length - 1; i >= 0; i--) {
        if (individualDP[i] >= THRESHOLD) { endK = i; break; }
    }

    // 15개 제한 적용
    const MAX_BARS = 15;
    const currentRange = endK - startK + 1;

    if (currentRange > MAX_BARS) {
        let half = Math.floor(MAX_BARS / 2);
        startK = maxIndex - half;
        endK = startK + MAX_BARS - 1;

        if (startK < 0) {
            startK = 0;
            endK = Math.min(individualDP.length - 1, MAX_BARS - 1);
        }
        if (endK >= individualDP.length) {
            endK = individualDP.length - 1;
            startK = Math.max(0, endK - MAX_BARS + 1);
        }
    } else {
        startK = Math.max(0, startK - 1);
        endK = Math.min(individualDP.length - 1, endK + 1);
    }

    // 2. 실제 출력 데이터 변환
    const transformedDP = transformData(dp, mode);

    const labels = [], data = [], colors = [], tooltipValues = [];
    let suffix = (mode === 'cumulative_less') ? " 이하" : (mode === 'cumulative_more' ? " 이상" : "");

    for (let k = startK; k <= endK; k++) {
        const val = transformedDP[k] || 0;
        
        labels.push(`${k}${suffix}`); 
        data.push((val * 100).toFixed(2));
        tooltipValues.push(formatProbability(val));
        
        // [수정] 모드와 상관없이, 개별 확률이 가장 높았던 지점(maxIndex)을 항상 초록색으로 강조
        colors.push(k === maxIndex ? '#45a247' : '#e3f2fd');
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