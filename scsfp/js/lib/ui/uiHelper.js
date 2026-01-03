import { formatProbability } from './formatter.js';
import { renderChart, renderBarChart } from './chartHandler.js';
import { transformData } from '../math/core.js'; 

// 1. 수집 종류 분석 (원 그래프) - 기존 유지
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

    const logicHtml = htmlGenerators.logic().replace('class="section-content"', 'class="section-content logic-content"');
    
    const logicContainer = document.getElementById(ids.logic);
    logicContainer.innerHTML = logicHtml;
    logicContainer.style.display = 'block'; // 컨테이너 자체는 보임 (내부 컨텐츠가 접힘/펼침)

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
    
    // 기댓값 계산 (슬라이딩 윈도우 중앙 정렬용)
    let expectedValue = 0;
    for(let i=0; i<dpTotal.length; i++) expectedValue += i * dpTotal[i];
    const avgIndex = Math.round(expectedValue);

    // [신규] 가장 확률이 높은 인덱스 찾기 (색상 강조용)
    let maxVal = -1;
    let maxIndex = -1;
    // 전체 범위에서 최대 확률 탐색
    for(let i=0; i<transformedDP.length; i++) {
        if (transformedDP[i] > maxVal) {
            maxVal = transformedDP[i];
            maxIndex = i;
        }
    }

    // 슬라이딩 윈도우 범위 설정
    let startK = Math.max(0, avgIndex - 8);
    let endK = startK + 15; 
    if (endK >= transformedDP.length) {
        endK = transformedDP.length - 1;
        startK = Math.max(0, endK - 15);
    }

    // 필터링 및 최소 10개 보장
    let tempResults = [];
    for (let k = startK; k <= endK; k++) {
        const val = transformedDP[k] || 0;
        // 평균 근처면 낮은 확률이라도 표시
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

        // [수정] 색상 로직: 가장 높은 확률(Peak)이면 짙은 녹색, 아니면 밝은 파랑
        if (item.k === maxIndex && mode === 'individual') {
            colors.push('#45a247'); // Peak (짙은 녹색)
        } else {
            colors.push('#283c86');
        }
    });

    document.getElementById(ids.summary).innerHTML = summaryHtml;
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
    
    // 기댓값 계산 (중앙 정렬용)
    let expectedValue = 0;
    for(let i=0; i<dpSpecific.length; i++) expectedValue += i * dpSpecific[i];
    const avgIndex = Math.round(expectedValue);

    // [신규] 가장 확률이 높은 인덱스 찾기 (색상 강조용)
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
        data.push((item.val * 100).toFixed(3));
        tooltipValues.push(item.formatted);

        // [수정] 색상 로직: 가장 높은 확률(Peak)이면 짙은 녹색, 아니면 밝은 파랑
        if (item.k === maxIndex && mode === 'individual') {
            colors.push('#45a247'); // Peak (짙은 녹색)
        } else {
            colors.push('#283c86');
        }
    });

    document.getElementById(ids.summary).innerHTML = summaryHtml;
    renderBarChart(ids.chart, labels, data, colors, tooltipValues, chartRef);
}

// (내부 헬퍼) 범례 업데이트
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