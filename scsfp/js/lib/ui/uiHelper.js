import { formatProbability } from './formatter.js';
import { renderChart } from './chartHandler.js';

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

export function renderResultCommon(
    N, chartDP, listDP, mode,
    ids, // { chart, legend, summary, logic }
    htmlGenerators, // { summary: () => string, logic: () => string }
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
        const chartVal = parseFloat((chartDP[k] * 100).toFixed(3));
        chartData.push(chartVal);
        listLabels.push(`${k}픽업${suffix}`);
        listData.push(formatProbability(listDP[k]));

        if (k === N) backgroundColors.push('#45a247');
        else {
            let opacity = 0.3 + (0.7 * (k / N));
            backgroundColors.push(`rgba(40, 60, 134, ${opacity})`);
        }
    }

    document.getElementById(ids.summary).innerHTML = htmlGenerators.summary();
    
    // 상세 로직 (토글 기능 포함)
    const logicContainer = document.getElementById(ids.logic);
    logicContainer.innerHTML = htmlGenerators.logic();
    logicContainer.style.display = 'block';

    const innerContainer = logicContainer.querySelector('.section-header');
    if (innerContainer) {
        const btn = innerContainer.querySelector('.toggle-btn');
        const content = logicContainer.querySelector('.section-content');
        innerContainer.addEventListener('click', () => {
            if (content.style.display === 'none') {
                content.style.display = 'block';
                btn.textContent = '▲';
            } else {
                content.style.display = 'none';
                btn.textContent = '▼';
            }
        });
    }

    const chartTooltipValues = chartDP.map(p => formatProbability(p));

    updateLegend(ids.legend, listLabels, listData, backgroundColors);
    renderChart(ids.chart, chartLabels, chartData, backgroundColors, chartTooltipValues, chartInstanceRef);
}