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
    // 1. [핵심] 표시 범위(Window)는 항상 '개별 확률(Individual)'을 기준으로 산출합니다.
    //    그래야 누적 모드에서도 "사건이 주로 발생하는 구간"을 볼 수 있습니다.
    const individualDP = transformData(dp, 'individual');
    
    // 개별 확률 기준 Peak(최빈값) 찾기
    let maxVal = -1, maxIndex = -1;
    for(let i=0; i<individualDP.length; i++) { 
        if (individualDP[i] > maxVal) { maxVal = individualDP[i]; maxIndex = i; } 
    }

    // 개별 확률 기준 유의미한 구간 탐색 (0.01% 미만 제외)
    const THRESHOLD = 0.0001;
    let startK = 0;
    let endK = individualDP.length - 1;

    for (let i = 0; i < individualDP.length; i++) {
        if (individualDP[i] >= THRESHOLD) { startK = i; break; }
    }
    for (let i = individualDP.length - 1; i >= 0; i--) {
        if (individualDP[i] >= THRESHOLD) { endK = i; break; }
    }

    // 개별 확률 기준 15개 제한 적용
    const MAX_BARS = 15;
    const currentRange = endK - startK + 1;

    if (currentRange > MAX_BARS) {
        let half = Math.floor(MAX_BARS / 2);
        startK = maxIndex - half;
        endK = startK + MAX_BARS - 1;

        // 범위 보정
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

    // 2. 실제 출력할 데이터는 사용자가 선택한 모드(mode)로 변환
    const transformedDP = transformData(dp, mode);

    const labels = [], data = [], colors = [], tooltipValues = [];
    let suffix = (mode === 'cumulative_less') ? " 이하" : (mode === 'cumulative_more' ? " 이상" : "");

    // 위에서 구한 startK ~ endK 범위를 사용하여 그래프 그리기
    for (let k = startK; k <= endK; k++) {
        const val = transformedDP[k] || 0;
        
        labels.push(`${k}${suffix}`); 
        data.push((val * 100).toFixed(2));
        tooltipValues.push(formatProbability(val));
        
        // 초록색 강조는 오직 '개별 모드'일 때만 Peak 지점에 표시 (누적일 땐 파란색 통일)
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