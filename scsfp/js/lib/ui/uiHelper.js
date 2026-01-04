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