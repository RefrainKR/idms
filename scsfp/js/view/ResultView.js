/**
 * js/view/ResultView.js
 * 가챠 결과 화면 렌더링을 위한 공통 부모 클래스
 */
import { ProbabilityEngine } from '../core/ProbabilityEngine.js';
import { ChartAdapter } from '../utils/ChartAdapter.js';
import { Formatter } from '../utils/Formatter.js';
import { PROBABILITY_MODE } from '../core/GachaConstants.js';

export class ResultView {
    
    /**
     * 요약(Summary) 및 상세 로직(Logic) 텍스트 업데이트
     * @param {Object} elementIds - { summary: 'id', logic: 'id' }
     * @param {Object} generators - { summary: () => html, logic: () => html }
     */
    static _updateText(elementIds, generators) {
        const summaryEl = document.getElementById(elementIds.summary || 'globalSummary');
        if (summaryEl && generators.summary) {
            summaryEl.innerHTML = generators.summary();
        }

        const logicContainer = document.getElementById(elementIds.logic || 'globalLogic');
        if (logicContainer) {
            if (generators.logic) {
                logicContainer.innerHTML = generators.logic();
                logicContainer.style.display = 'block';
            } else {
                logicContainer.style.display = 'none';
                logicContainer.innerHTML = '';
            }
        }
    }

    /**
     * 차트 하단 범례(Legend) 업데이트
     */
    static _updateLegend(elementId, labels, data, colors) {
        const container = document.getElementById(elementId);
        if (!container) return;
        
        container.innerHTML = '';
        labels.forEach((label, i) => {
            const item = document.createElement('div');
            item.className = 'legend-item';
            item.innerHTML = `
                <div class="legend-label">
                    <span class="color-dot" style="background-color: ${colors[i]};"></span>
                    <span>${label}</span>
                </div>
                <div class="legend-value">${data[i]}</div>
            `;
            container.appendChild(item);
        });
    }

    /**
     * 1. 수집 확률 (Pie Chart) 렌더링
     * @param {number} M - 목표 수집 개수
     * @param {Array} dp - 확률 분포 배열
     * @param {string} mode - 뷰 모드 (individual, cumulative...)
     * @param {Object} elementIds - DOM ID 모음
     * @param {Object} htmlGenerator - HTML 생성 함수 모음
     * @param {Object} chartRef - 차트 인스턴스 참조
     * - 그래프는 항상 '개별 확률' 고정
     * - 범례(Legend) 및 툴팁만 '모드'에 따라 수치 변경
     */
    static renderCollection(M, dp, mode, elementIds, htmlGenerator, chartRef) {
        // [핵심 1] 차트 조각(Slices) 데이터는 항상 '개별 확률' (합계 100%)
        const chartDP = dp; 
        
        // [핵심 2] 범례(Legend) 및 툴팁용 데이터만 사용자가 선택한 모드로 변환
        const listDP = ProbabilityEngine.transformData(dp, mode);
        
        let chartLabels = [], chartData = [], colors = [];
        let listLabels = [], listData = [], tooltipVals = [];
        
        let suffix = "";
        if (mode === PROBABILITY_MODE.CUMULATIVE_LESS) suffix = " 이하";
        else if (mode === PROBABILITY_MODE.CUMULATIVE_MORE) suffix = " 이상";

        for (let k = 0; k <= M; k++) {
            // 차트용 레이블과 데이터 (순수 개별 확률)
            chartLabels.push(`${k}픽업`);
            chartData.push(parseFloat((chartDP[k] * 100).toFixed(3)));

            // 범례 및 툴팁용 레이블과 데이터 (모드 적용: 이하/이상)
            listLabels.push(`${k}픽업${suffix}`);
            listData.push(Formatter.formatProbability(listDP[k]));
            tooltipVals.push(Formatter.formatProbability(listDP[k]));
            
            // 색상 강조
            colors.push(k === M ? '#45a247' : `rgba(40, 60, 134, ${0.3 + 0.7 * (k / M)})`);
        }

        this._updateText(elementIds, htmlGenerator);
        this._updateLegend(elementIds.legend, listLabels, listData, colors);
        
        ChartAdapter.renderPieChart(elementIds.chart, chartLabels, chartData, colors, tooltipVals, chartRef);
    }

    /**
     * 2. 총 획득 수 (Bar Chart) 렌더링
     * - 0.01% 미만 절삭 및 최대 15개 구간 표시 로직 포함
     */
    static renderTotalCount(dp, mode, elementIds, htmlGenerator, chartRef) {
        // [중요] 표시 범위 산정은 항상 '개별 확률(Individual)' 기준
        const individualDP = ProbabilityEngine.transformData(dp, PROBABILITY_MODE.INDIVIDUAL);
        
        // Peak(최빈값) 찾기
        let maxVal = -1, maxIndex = -1;
        for(let i=0; i<individualDP.length; i++) { 
            if (individualDP[i] > maxVal) { maxVal = individualDP[i]; maxIndex = i; } 
        }

        // 유의미한 구간 탐색 (0.001% 이상)
        const THRESHOLD = 0.00001;
        let startK = 0;
        let endK = individualDP.length - 1;

        for (let i = 0; i < individualDP.length; i++) {
            if (individualDP[i] >= THRESHOLD) { startK = i; break; }
        }
        for (let i = individualDP.length - 1; i >= 0; i--) {
            if (individualDP[i] >= THRESHOLD) { endK = i; break; }
        }

        // 15개 제한 및 보정
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

        // 실제 출력 데이터 변환 (사용자 선택 모드 적용)
        const transformedDP = ProbabilityEngine.transformData(dp, mode);
        
        const labels = [], data = [], colors = [], tooltipVals = [];
        let suffix = "";
        
        if (mode === PROBABILITY_MODE.CUMULATIVE_LESS) suffix = " 이하";
        else if (mode === PROBABILITY_MODE.CUMULATIVE_MORE) suffix = " 이상";

        for (let k = startK; k <= endK; k++) {
            const val = transformedDP[k] || 0;
            labels.push(`${k}${suffix}`);
            data.push(val * 100);  // Keep as number for chart rendering
            tooltipVals.push(Formatter.formatProbability(val));

            // Peak 지점 강조 (모드 상관없이 항상 표시)
            colors.push(k === maxIndex ? '#45a247' : '#e3f2fd');
        }

        this._updateText(elementIds, htmlGenerator);
        
        // 상세 로직 숨김 처리 (Bar Chart는 보통 Summary만 보여줌)
        const logicContainer = document.getElementById(elementIds.logic || 'globalLogic');
        if (logicContainer) logicContainer.style.display = 'none';

        ChartAdapter.renderBarChart(elementIds.chart, labels, data, colors, tooltipVals, chartRef);
    }
}