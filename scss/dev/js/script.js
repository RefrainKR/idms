import { InputNumberElement } from './lib/utils/InputNumberElement.js';
import { TabManager } from './lib/utils/TabManager.js';
import { ToggleButtonElement } from './lib/utils/ToggleButtonElement.js';

Chart.register(ChartDataLabels);

let myChart3Star = null;
let myChart2Star = null;
let stepPullsInputInstance = null; 

// 데이터 캐싱
const CACHE = {
    star3: null,
    star2: null
};

// 뷰 모드
const VIEW_MODE = {
    star3: 'individual',
    star2: 'individual'
};

const TOGGLE_STATES = [
    { name: 'individual', text: '모드: 개별 확률' },
    { name: 'cumulative_less', text: '모드: 누적(이하)' },
    { name: 'cumulative_more', text: '모드: 누적(이상)' }
];

window.onload = function() {
    const tabContainer = document.getElementById('main-tab-system');
    new TabManager(tabContainer);

    // 버튼 이벤트
    new ToggleButtonElement('toggleViewBtn3', TOGGLE_STATES, (name) => {
        VIEW_MODE.star3 = name;
        render3StarUI();
    });

    new ToggleButtonElement('toggleViewBtn2', TOGGLE_STATES, (name) => {
        VIEW_MODE.star2 = name;
        render2StarUI();
    });

    init3StarInputs();
    updateLoopSettings(); 

    init2StarInputs();
    calculate2Star();
};

// ==========================================
//  3성 로직
// ==========================================
function init3StarInputs() {
    new InputNumberElement(document.getElementById('pickupCount'), 1, 100, 2, calculate3Star);
    new InputNumberElement(document.getElementById('pickupRate'), 0, 100, 1, calculate3Star);
    new InputNumberElement(document.getElementById('maxLoops'), 1, 10, 3, () => updateLoopSettings());
    new InputNumberElement(document.getElementById('step4Rate'), 0, 100, 20, calculate3Star);
    new InputNumberElement(document.getElementById('normalPulls'), 0, 9999, 0, calculate3Star);
    stepPullsInputInstance = new InputNumberElement(document.getElementById('stepPulls'), 0, 120, 0, calculate3Star);
}

function updateLoopSettings() {
    const maxLoopsInput = document.getElementById('maxLoops');
    const maxLoops = parseInt(maxLoopsInput.value) || 1;
    const container = document.getElementById('loopRewardsArea');
    
    let savedRewards = {};
    for (let i = 1; i <= 20; i++) { 
        const el = document.getElementById(`rewardLoop${i}`);
        if (el) savedRewards[i] = el.value;
    }

    container.innerHTML = '';

    for (let i = 1; i <= maxLoops; i++) {
        const wrapper = document.createElement('div');
        wrapper.className = 'loop-reward-item';
        
        const label = document.createElement('label');
        label.textContent = `${i}주 보상`;
        
        const select = document.createElement('select');
        select.id = `rewardLoop${i}`;
        select.className = 'loop-reward-select';
        select.onchange = calculate3Star; 

        const opts = [
            { val: 'none', text: '없음' },
            { val: 'random', text: '랜덤 교환(1회)' },
            { val: 'select', text: '천장 교환(선택 1회)' }
        ];

        opts.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.val;
            option.textContent = opt.text;
            select.appendChild(option);
        });

        if (savedRewards[i]) select.value = savedRewards[i];
        else select.value = 'none';
        
        wrapper.appendChild(label);
        wrapper.appendChild(select);
        container.appendChild(wrapper);
    }

    const maxPulls = maxLoops * 40;
    if (stepPullsInputInstance) stepPullsInputInstance.setMax(maxPulls);
    document.querySelector('label[for="stepPulls"]').textContent = `스탭업 가챠 횟수 (Max ${maxPulls})`;
    calculate3Star();
}

function calculate3Star() {
    const N = parseInt(document.getElementById('pickupCount').value) || 0;
    const p_indiv_percent = parseFloat(document.getElementById('pickupRate').value) || 0;
    let p_step4_total_percent = parseFloat(document.getElementById('step4Rate').value) || 0;
    const normalPulls = parseInt(document.getElementById('normalPulls').value) || 0;
    const maxLoops = parseInt(document.getElementById('maxLoops').value) || 1;
    const maxStepPulls = maxLoops * 40;
    let stepPulls = parseInt(document.getElementById('stepPulls').value) || 0;

    if (N <= 0) return;
    if (stepPulls > maxStepPulls) stepPulls = maxStepPulls;
    if (p_step4_total_percent > 100) p_step4_total_percent = 100;

    const p_normal_one = p_indiv_percent / 100;
    const p_step4_one = (p_step4_total_percent / 100) / N;

    let countStep4 = 0; 
    let countNormal = normalPulls;
    let randomRewardCount = 0;
    let selectRewardCount = 0;
    
    let loopRewards = {};
    for (let i = 1; i <= maxLoops; i++) {
        const sel = document.getElementById(`rewardLoop${i}`);
        if (sel) loopRewards[i] = sel.value;
    }

    let dp = new Array(N + 1).fill(0);
    dp[0] = 1.0;

    // DP 계산 함수들
    function runGacha(currentDP, probPerCard) {
        let nextDP = new Array(N + 1).fill(0);
        for (let k = 0; k <= N; k++) {
            if (currentDP[k] === 0) continue;
            if (k === N) nextDP[k] += currentDP[k];
            else {
                let p_new = (N - k) * probPerCard;
                let p_stay = 1.0 - p_new;
                nextDP[k] += currentDP[k] * p_stay;
                nextDP[k+1] += currentDP[k] * p_new;
            }
        }
        return nextDP;
    }
    function runSelectTicket(currentDP) {
        let nextDP = new Array(N + 1).fill(0);
        for (let k = 0; k <= N; k++) {
            if (currentDP[k] === 0) continue;
            if (k < N) nextDP[k+1] += currentDP[k];
            else nextDP[N] += currentDP[k];
        }
        return nextDP;
    }
    function runRandomPickup(currentDP) {
        let nextDP = new Array(N + 1).fill(0);
        for (let k = 0; k <= N; k++) {
            if (currentDP[k] === 0) continue;
            if (k === N) nextDP[N] += currentDP[k];
            else {
                let p_new = (N - k) / N;
                let p_dupe = k / N;
                nextDP[k] += currentDP[k] * p_dupe;
                nextDP[k+1] += currentDP[k] * p_new;
            }
        }
        return nextDP;
    }

    // 1. 일반 가챠 시행
    for (let i = 0; i < normalPulls; i++) dp = runGacha(dp, p_normal_one);

    // 2. 스탭업 가챠 시행
    for (let i = 1; i <= stepPulls; i++) {
        let isStep4 = (i % 40 === 0); 
        if (isStep4) countStep4++; else countNormal++;
        let currentProb = isStep4 ? p_step4_one : p_normal_one;
        dp = runGacha(dp, currentProb);
        
        // 주회 보상 체크
        if (i % 40 === 0) {
            let currentLoop = i / 40;
            let rewardType = loopRewards[currentLoop];
            
            if (rewardType === 'random') {
                // 랜덤 보상은 획득 즉시 적용 (중복 가능성 등 고려)
                dp = runRandomPickup(dp);
                randomRewardCount++;
            } else if (rewardType === 'select') {
                // 2. 수정: 선택권(천장)은 루프 내에서 적용하지 않고 카운트만 증가
                // dp = runSelectTicket(dp); <-- 삭제됨
                selectRewardCount++;
            }
        }
    }

    // 3. 천장 적용 (가장 마지막에 일괄 적용)
    let totalPulls = normalPulls + stepPulls;
    let normalCeiling = Math.floor(totalPulls / 200);
    let totalCeilingCount = selectRewardCount + normalCeiling; // 스탭업 보상 + 일반 천장

    for (let i = 0; i < totalCeilingCount; i++) {
        dp = runSelectTicket(dp);
    }

    CACHE.star3 = {
        N: N,
        dp: dp,
        context: {
            p_indiv_percent, countNormal, p_step4_total_percent, countStep4,
            maxLoops, loopRewards, stepPulls,
            totalPulls, normalPulls, stepPulls,
            randomRewardCount, totalCeilingCount, selectRewardCount, normalCeiling
        }
    };

    render3StarUI();
}

function render3StarUI() {
    if (!CACHE.star3) return;
    const { N, dp, context } = CACHE.star3;
    const mode = VIEW_MODE.star3;

    const chartDP = dp; 
    const listDP = transformData(dp, mode);
    
    renderResult(
        N, chartDP, listDP, mode,
        'resultChart', 'legendList', 'summaryText', 'logicDetailText',
        (allProb) => `
            <strong>3성 분석 결과</strong><br>
            가챠 횟수 : ${context.totalPulls}회 (일반 ${context.normalPulls} + 스탭업 ${context.stepPulls})<br>
            랜덤 교환 : ${context.randomRewardCount}회<br>
            천장 교환 : ${context.totalCeilingCount}회 (보상 ${context.selectRewardCount} + 통합 ${context.normalCeiling})<br>
            <strong>올컴플릿 확률 : ${(dp[N] * 100).toFixed(2)}%</strong>
        `,
        (allProb) => {
             let rewardHistoryHtml = "";
             for(let i=1; i<=context.maxLoops; i++) {
                 let rType = context.loopRewards[i];
                 let rText = rType === 'none' ? '없음' : (rType === 'random' ? '랜덤' : '천장(선택)');
                 if (i * 40 <= context.stepPulls) rewardHistoryHtml += `[${i}주: ${rText}] `;
                 else rewardHistoryHtml += `<span style="color:#aaa;">[${i}주: ${rText}]</span> `;
             }
             let zeroPickupDesc = (context.randomRewardCount > 0 || context.totalCeilingCount > 0) 
                 ? "주회 보상 또는 천장으로 인해 0픽업은 불가능(0%)합니다." 
                 : `총 ${context.totalPulls}회의 가챠가 모두 픽업을 빗나갈 확률입니다.`;

             return `
                <span class="logic-title">상세 계산 근거</span>
                <ul class="logic-list">
                    <li><strong>확률 적용:</strong> 기본 확률(${context.p_indiv_percent}%) ${context.countNormal}회, Step4 개별 확률(${(context.p_step4_total_percent/N).toFixed(2)}%) ${context.countStep4}회 적용되었습니다.</li>
                    <li><strong>주회 보상 설정:</strong> ${rewardHistoryHtml}</li>
                    <li><strong>랜덤 교환(${context.randomRewardCount}회):</strong> 보유 수에 따라 중복 또는 신규획득 확률이 적용됩니다.</li>
                    <li><strong>천장 교환(${context.totalCeilingCount}회):</strong> 스탭업 보상(${context.selectRewardCount}회)과 일반 천장(${context.normalCeiling}회)이 합산되어 <strong>가장 마지막에</strong> 적용됩니다.</li>
                    <li><strong>계산 방식:</strong> **동적 계획법(DP)** 알고리즘을 사용하여, **쿠폰 수집가 문제(Coupon Collector's Problem)** 모델을 기반으로 정확한 확률을 계산했습니다.</li>
                </ul>
            `;
        }
    );
}


// ==========================================
//  2성 로직 (기존과 동일, 천장 위치 확인)
// ==========================================
function init2StarInputs() {
    new InputNumberElement(document.getElementById('countNormal2'), 1, 100, 28, calculate2Star);
    new InputNumberElement(document.getElementById('rate2Star'), 0, 100, 28, calculate2Star);
    new InputNumberElement(document.getElementById('pullsNormal2'), 0, 9999, 0, calculate2Star);
}

function calculate2Star() {
    const N = parseInt(document.getElementById('countNormal2').value) || 0;
    const rateTotal = parseFloat(document.getElementById('rate2Star').value) || 0;
    const pulls = parseInt(document.getElementById('pullsNormal2').value) || 0;

    if (N <= 0) return;

    const p_normal_total = rateTotal / 100;
    const p_normal_one = p_normal_total / N;
    const p_high_total = 0.95;
    const p_high_one = p_high_total / N;

    let dp = new Array(N + 1).fill(0);
    dp[0] = 1.0;

    function runGacha(currentDP, probPerCard) {
        let nextDP = new Array(N + 1).fill(0);
        for (let k = 0; k <= N; k++) {
            if (currentDP[k] === 0) continue;
            if (k === N) nextDP[k] += currentDP[k];
            else {
                let p_new = (N - k) * probPerCard;
                let p_stay = 1.0 - p_new;
                nextDP[k] += currentDP[k] * p_stay;
                nextDP[k+1] += currentDP[k] * p_new;
            }
        }
        return nextDP;
    }
    function runSelectTicket(currentDP) {
        let nextDP = new Array(N + 1).fill(0);
        for (let k = 0; k <= N; k++) {
            if (currentDP[k] === 0) continue;
            if (k < N) nextDP[k+1] += currentDP[k];
            else nextDP[N] += currentDP[k];
        }
        return nextDP;
    }

    let countNormal = 0;
    let countHigh = 0;

    // 가챠 루프
    for (let i = 1; i <= pulls; i++) {
        if (i % 10 === 0) {
            dp = runGacha(dp, p_high_one);
            countHigh++;
        } else {
            dp = runGacha(dp, p_normal_one);
            countNormal++;
        }
    }

    // 천장 루프 (가장 마지막에 적용됨 - 확인됨)
    let ceilingCount = Math.floor(pulls / 100);
    for (let i = 0; i < ceilingCount; i++) {
        dp = runSelectTicket(dp);
    }

    CACHE.star2 = {
        N: N,
        dp: dp,
        context: {
            pulls, ceilingCount, countNormal, countHigh,
            p_normal_one, p_high_one
        }
    };

    render2StarUI();
}

function render2StarUI() {
    if (!CACHE.star2) return;
    const { N, dp, context } = CACHE.star2;
    const mode = VIEW_MODE.star2;

    const chartDP = dp; 
    const listDP = transformData(dp, mode);

    renderResult(
        N, chartDP, listDP, mode,
        'resultChart2', 'legendList2', 'summaryText2', 'logicDetailText2',
        (allProb) => `
            <strong>2성 분석 결과</strong><br>
            총 가챠 횟수 : ${context.pulls}회<br>
            일반 천장 교환 : ${context.ceilingCount}회 (100연당 1회)<br>
            <strong>올컴플릿 확률 : ${(dp[N] * 100).toFixed(2)}%</strong>
        `,
        (allProb) => `
            <span class="logic-title">상세 계산 근거</span>
            <ul class="logic-list">
                <li><strong>확률 적용:</strong> 총 ${context.pulls}회 중 ${context.countNormal}회는 기본 개별 확률(${(context.p_normal_one*100).toFixed(2)}%)이, ${context.countHigh}회는 10회차 보정 개별 확률(${(context.p_high_one*100).toFixed(2)}%)이 적용되었습니다.</li>
                <li><strong>10회차 보정:</strong> 10회, 20회... 째에는 2성이 95% 확률로 등장합니다. (전체 95% / 픽업 ${N}개)</li>
                <li><strong>천장 교환(${context.ceilingCount}회):</strong> 100회마다 없는 픽업을 확정 획득합니다. (가장 마지막에 적용)</li>
                <li><strong>계산 방식:</strong> **동적 계획법(DP)** 알고리즘을 사용하여, **쿠폰 수집가 문제(Coupon Collector's Problem)** 모델을 기반으로 정확한 확률을 계산했습니다.</li>
            </ul>
        `
    );
}

// ==========================================
//  데이터 변환 및 공통 렌더링
// ==========================================

function transformData(dp, mode) {
    let newDP = new Array(dp.length).fill(0);
    const N = dp.length - 1;

    if (mode === 'individual') { 
        return [...dp];
    } 
    else if (mode === 'cumulative_less') { 
        let sum = 0;
        for (let i = 0; i <= N; i++) {
            sum += dp[i];
            newDP[i] = sum;
        }
        newDP = newDP.map(v => Math.min(v, 1.0));
    } 
    else if (mode === 'cumulative_more') { 
        let sum = 0;
        for (let i = N; i >= 0; i--) {
            sum += dp[i];
            newDP[i] = sum;
        }
        newDP = newDP.map(v => Math.min(v, 1.0));
    }

    return newDP;
}

function renderResult(
    N, chartDP, listDP, mode,
    chartId, legendId, summaryId, logicId,
    summaryCallback, logicCallback
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
        chartData.push((chartDP[k] * 100).toFixed(2));
        
        listLabels.push(`${k}픽업${suffix}`);
        listData.push((listDP[k] * 100).toFixed(2));

        if (k === N) backgroundColors.push('#45a247');
        else {
            let opacity = 0.3 + (0.7 * (k / N));
            backgroundColors.push(`rgba(40, 60, 134, ${opacity})`);
        }
    }

    document.getElementById(summaryId).innerHTML = summaryCallback();
    document.getElementById(logicId).innerHTML = logicCallback();
    document.getElementById(logicId).style.display = 'block';

    updateLegend(legendId, listLabels, listData, backgroundColors);
    renderChart(chartId, chartLabels, chartData, backgroundColors);
}

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
            <div class="legend-value">${percent}%</div>
        `;
        listContainer.appendChild(item);
    });
}

function renderChart(canvasId, labels, data, colors) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    if (canvasId === 'resultChart') {
        if (myChart3Star) myChart3Star.destroy();
        myChart3Star = createChart(ctx, labels, data, colors);
    } else {
        if (myChart2Star) myChart2Star.destroy();
        myChart2Star = createChart(ctx, labels, data, colors);
    }
}

function createChart(ctx, labels, data, colors) {
    return new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: 10 },
            plugins: {
                title: { display: false },
                legend: { display: false },
                datalabels: {
                    color: '#fff',
                    font: { weight: 'bold', size: 14 },
                    formatter: (value, context) => {
                        if (value < 3) return null;
                        const label = context.chart.data.labels[context.dataIndex];
                        return `${label}\n${value}%`;
                    },
                    textAlign: 'center',
                    textShadowBlur: 4,
                    textShadowColor: 'rgba(0,0,0,0.5)'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` ${context.label}: ${context.raw}%`;
                        }
                    }
                }
            }
        }
    });
}