import { InputNumberElement } from './lib/utils/InputNumberElement.js';
import { TabManager } from './lib/utils/TabManager.js';
import { ToggleButtonElement } from './lib/utils/ToggleButtonElement.js';
import { CollapsibleSection } from './lib/utils/CollapsibleSection.js';

Chart.register(ChartDataLabels);

let myChart3Star = null;
let myChart2Star = null;
let stepPullsInputInstance = null; 

const CACHE = { star3: null, star2: null };

// 뷰 모드 관리
const VIEW_MODE = { star3: 'individual', star2: 'individual' };
// 천장 포함 여부 관리 (기본값: 포함)
const CEILING_MODE = { star3: 'included', star2: 'included' };

// 3. 토글 버튼 텍스트에서 "모드: " 제거
const TOGGLE_STATES_VIEW = [
    { name: 'individual', text: '개별 확률' },
    { name: 'cumulative_less', text: '누적(이하)' },
    { name: 'cumulative_more', text: '누적(이상)' }
];

// 4. 천장 토글 상태 정의
const TOGGLE_STATES_CEILING = [
    { name: 'included', text: '천장 포함' },
    { name: 'excluded', text: '천장 미포함' }
];

function formatProbability(probability) {
    if (probability === 0) return "0.000%";
    const percent = probability * 100;
    const text = percent.toFixed(3); 
    if (text === "0.000") {
        const denom = Math.round(1 / probability);
        return `1/${denom.toLocaleString()}`; 
    }
    return `${text}%`;
}

window.onload = function() {
    const tabContainer = document.getElementById('main-tab-system');
    new TabManager(tabContainer);
    new CollapsibleSection();

    // --- 3성 버튼 설정 ---
    // 뷰 모드
    new ToggleButtonElement('toggleViewBtn3', TOGGLE_STATES_VIEW, (name) => {
        VIEW_MODE.star3 = name;
        render3StarUI();
    });
    // 천장 토글
    new ToggleButtonElement('toggleCeilingBtn3', TOGGLE_STATES_CEILING, (name) => {
        CEILING_MODE.star3 = name;
        calculate3Star(); // 계산 로직이 바뀌므로 재계산 필요
    });

    // --- 2성 버튼 설정 ---
    // 뷰 모드
    new ToggleButtonElement('toggleViewBtn2', TOGGLE_STATES_VIEW, (name) => {
        VIEW_MODE.star2 = name;
        render2StarUI();
    });
    // 천장 토글
    new ToggleButtonElement('toggleCeilingBtn2', TOGGLE_STATES_CEILING, (name) => {
        CEILING_MODE.star2 = name;
        calculate2Star(); // 계산 로직이 바뀌므로 재계산 필요
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
    new InputNumberElement(document.getElementById('maxLoops'), 1, 10, 2, () => updateLoopSettings());
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
        select.value = savedRewards[i] || 'none';
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

    for (let i = 0; i < normalPulls; i++) dp = runGacha(dp, p_normal_one);
    for (let i = 1; i <= stepPulls; i++) {
        let isStep4 = (i % 40 === 0); 
        if (isStep4) countStep4++; else countNormal++;
        let currentProb = isStep4 ? p_step4_one : p_normal_one;
        dp = runGacha(dp, currentProb);
        
        if (i % 40 === 0) {
            let currentLoop = i / 40;
            let rewardType = loopRewards[currentLoop];
            if (rewardType === 'random') {
                dp = runRandomPickup(dp); // 랜덤 교환은 토글과 상관없이 항상 적용
                randomRewardCount++;
            } else if (rewardType === 'select') {
                // 선택 교환(천장) 카운트는 하지만, 실제 DP 적용은 아래에서 토글 확인 후 수행
                selectRewardCount++;
            }
        }
    }

    let totalPulls = normalPulls + stepPulls;
    let normalCeiling = Math.floor(totalPulls / 200);
    let totalCeilingCount = selectRewardCount + normalCeiling;

    // [수정 4] 천장 포함 여부 확인
    if (CEILING_MODE.star3 === 'included') {
        for (let i = 0; i < totalCeilingCount; i++) {
            dp = runSelectTicket(dp);
        }
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
    
    // 천장 미포함 시 메시지 추가
    let ceilingNote = "";
    if (CEILING_MODE.star3 === 'excluded' && context.totalCeilingCount > 0) {
        ceilingNote = ` (미적용: ${context.totalCeilingCount}회)`;
    }

    renderResult(
        N, chartDP, listDP, mode,
        'resultChart', 'legendList', 'summaryText', 'logicDetailText',
        () => `
            <strong>3성 분석 결과</strong><br>
            가챠 횟수 : ${context.totalPulls}회 (일반 ${context.normalPulls} + 스탭업 ${context.stepPulls})<br>
            랜덤 교환 : ${context.randomRewardCount}회<br>
            천장 교환 : ${context.totalCeilingCount}회 (보상 ${context.selectRewardCount} + 통합 ${context.normalCeiling})${ceilingNote}<br>
            <strong>올컴플릿 확률 : ${formatProbability(dp[N])}</strong>
        `,
        () => {
             let rewardHistoryHtml = "";
             for(let i=1; i<=context.maxLoops; i++) {
                 let rType = context.loopRewards[i];
                 let rText = rType === 'none' ? '없음' : (rType === 'random' ? '랜덤' : '천장(선택)');
                 if (i * 40 <= context.stepPulls) rewardHistoryHtml += `[${i}주: ${rText}] `;
                 else rewardHistoryHtml += `<span style="color:#aaa;">[${i}주: ${rText}]</span> `;
             }
             
             let ceilingDesc = "";
             if (CEILING_MODE.star3 === 'included') {
                 ceilingDesc = `합산된 ${context.totalCeilingCount}개의 천장 교환권은 가장 마지막에 적용되어 없는 픽업을 확정 획득합니다.`;
             } else {
                 ceilingDesc = `<span style="color:red;">사용자 설정에 의해 ${context.totalCeilingCount}개의 천장 교환권 적용이 제외되었습니다.</span>`;
             }

             return `
                <span class="logic-title">상세 계산 근거</span>
                <ul class="logic-list">
                    <li><strong>확률 적용:</strong> 기본 확률(${context.p_indiv_percent}%) ${context.countNormal}회, Step4 개별 확률(${(context.p_step4_total_percent/N).toFixed(3)}%) ${context.countStep4}회 적용되었습니다.</li>
                    <li><strong>주회 보상 설정:</strong> ${rewardHistoryHtml}</li>
                    <li><strong>랜덤 교환(${context.randomRewardCount}회):</strong> 보유 수에 따라 중복 또는 신규획득 확률이 적용됩니다. (설정 무관 항상 적용)</li>
                    <li><strong>천장 교환(${context.totalCeilingCount}회):</strong> ${ceilingDesc}</li>
                    <li><strong>계산 방식:</strong> **동적 계획법(DP)** 알고리즘을 사용하여, **쿠폰 수집가 문제(Coupon Collector's Problem)** 모델을 기반으로 정확한 확률을 계산했습니다.</li>
                </ul>
            `;
        }
    );
}


// ==========================================
//  2성 로직
// ==========================================
function init2StarInputs() {
    new InputNumberElement(document.getElementById('rate2Star'), 0, 100, 28, calculate2Star);
    new InputNumberElement(document.getElementById('countNormal2'), 1, 100, 28, calculate2Star);
    new InputNumberElement(document.getElementById('pullsNormal2'), 0, 9999, 0, calculate2Star);
    
    const defaultCounts = [8, 7, 7, 6];
    ['A', 'B', 'C', 'D'].forEach((grp, idx) => {
        new InputNumberElement(document.getElementById(`countStep${grp}`), 1, 100, defaultCounts[idx], calculate2Star);
        new InputNumberElement(document.getElementById(`pullsStep${grp}`), 0, 9999, 0, calculate2Star);
    });
}

function calculate2Star() {
    const rateTotal = parseFloat(document.getElementById('rate2Star').value) / 100 || 0;
    const normalCount = parseInt(document.getElementById('countNormal2').value) || 0;
    const normalPulls = parseInt(document.getElementById('pullsNormal2').value) || 0;
    
    const groups = ['A', 'B', 'C', 'D'].map(g => ({
        id: g,
        count: parseInt(document.getElementById(`countStep${g}`).value) || 0,
        pulls: parseInt(document.getElementById(`pullsStep${g}`).value) || 0
    }));

    const sumGroupCounts = groups.reduce((sum, g) => sum + g.count, 0);
    const summaryEl = document.getElementById('summaryText2');
    const logicEl = document.getElementById('logicDetailText2');
    const legendEl = document.getElementById('legendList2');

    if (normalCount !== sumGroupCounts) {
        if (myChart2Star) myChart2Star.destroy();
        myChart2Star = null;
        legendEl.innerHTML = '';
        logicEl.style.display = 'none';
        
        summaryEl.innerHTML = `
            <div style="color: red; font-weight: bold;">
                [오류] 픽업 개수 불일치<br>
                일반 가챠 픽업 개수(${normalCount})는<br>
                각 그룹 픽업 개수의 합(${sumGroupCounts})과 같아야 합니다.
            </div>
        `;
        CACHE.star2 = null;
        return;
    }

    // 1. 스탭업 가챠 계산 (그룹별 DP -> 합성)
    let dpCombined = [1.0]; 
    let totalStepPulls = 0;

    groups.forEach(g => {
        if (g.count > 0) {
            // [참고] Step1/2 확정은 '랜덤 획득' 개념이므로 천장 토글과 무관하게 항상 적용
            const dpGroup = calculateSingleGroupDP(g.count, g.pulls, rateTotal, true);
            dpCombined = convolveDistributions(dpCombined, dpGroup);
            totalStepPulls += g.pulls;
        }
    });

    // 2. 일반 가챠 계산
    let dp = dpCombined;
    if (dp.length <= normalCount) {
        const diff = (normalCount + 1) - dp.length;
        for(let i=0; i<diff; i++) dp.push(0);
    }

    let countNormal = 0;
    let countHigh = 0;

    const p_normal_one = rateTotal / normalCount;
    const p_high_one = 0.95 / normalCount;

    function runGacha(currentDP, probPerCard) {
        let nextDP = new Array(normalCount + 1).fill(0);
        for (let k = 0; k <= normalCount; k++) {
            if (!currentDP[k]) continue; 
            if (k === normalCount) {
                nextDP[k] += currentDP[k]; 
            } else {
                let p_new = (normalCount - k) * probPerCard;
                if (p_new > 1) p_new = 1;
                let p_stay = 1.0 - p_new;
                nextDP[k] += currentDP[k] * p_stay;
                nextDP[k+1] += currentDP[k] * p_new;
            }
        }
        return nextDP;
    }

    for (let i = 1; i <= normalPulls; i++) {
        if (i % 10 === 0) {
            dp = runGacha(dp, p_high_one);
            countHigh++;
        } else {
            dp = runGacha(dp, p_normal_one);
            countNormal++;
        }
    }

    // 3. 천장 적용
    function runSelectTicket(currentDP) {
        let nextDP = new Array(normalCount + 1).fill(0);
        for (let k = 0; k <= normalCount; k++) {
            if (!currentDP[k]) continue;
            if (k < normalCount) nextDP[k+1] += currentDP[k];
            else nextDP[normalCount] += currentDP[k];
        }
        return nextDP;
    }

    let normalCeilingCount = Math.floor(normalPulls / 100);
    let stepUpCeilingCount = Math.floor(totalStepPulls / 50);
    let totalCeilingCount = normalCeilingCount + stepUpCeilingCount;

    // [수정 4] 천장 포함 여부 확인
    if (CEILING_MODE.star2 === 'included') {
        for (let i = 0; i < totalCeilingCount; i++) {
            dp = runSelectTicket(dp);
        }
    }

    let totalPulls = normalPulls + totalStepPulls;
    
    CACHE.star2 = {
        N: normalCount,
        dp: dp,
        context: {
            totalPulls, normalPulls, totalStepPulls, 
            normalCeilingCount, stepUpCeilingCount, totalCeilingCount,
            countNormal, countHigh, p_normal_one, p_high_one
        }
    };

    render2StarUI();
}

// ... (calculateSingleGroupDP, convolveDistributions 동일) ...
function calculateSingleGroupDP(N, pulls, rateTotal, isStepUp) {
    let dp = new Array(N + 1).fill(0);
    dp[0] = 1.0;
    if (pulls <= 0) return dp;

    const p_normal = rateTotal / N;
    const p_guaranteed = 1.0 / N; 

    for (let i = 1; i <= pulls; i++) {
        let p_current_one = p_normal;
        if (i === 5) {
            p_current_one = p_guaranteed;
        } else if (i > 5 && (i - 5) % 10 === 0) {
            p_current_one = p_guaranteed;
        }

        let nextDP = new Array(N + 1).fill(0);
        for (let k = 0; k <= N; k++) {
            if (dp[k] === 0) continue;
            if (k === N) {
                nextDP[k] += dp[k];
            } else {
                let p_new = (N - k) * p_current_one;
                if (p_new > 1) p_new = 1;
                let p_stay = 1.0 - p_new;
                nextDP[k] += dp[k] * p_stay;
                nextDP[k+1] += dp[k] * p_new;
            }
        }
        dp = nextDP;
    }
    return dp;
}

function convolveDistributions(dpA, dpB) {
    const sizeA = dpA.length;
    const sizeB = dpB.length;
    const newSize = sizeA + sizeB - 1;
    let result = new Array(newSize).fill(0);

    for (let i = 0; i < sizeA; i++) {
        if (dpA[i] === 0) continue;
        for (let j = 0; j < sizeB; j++) {
            if (dpB[j] === 0) continue;
            result[i + j] += dpA[i] * dpB[j];
        }
    }
    return result;
}

function render2StarUI() {
    if (!CACHE.star2) return;
    const { N, dp, context } = CACHE.star2;
    const mode = VIEW_MODE.star2;

    const chartDP = dp; 
    const listDP = transformData(dp, mode);

    let ceilingNote = "";
    if (CEILING_MODE.star2 === 'excluded' && context.totalCeilingCount > 0) {
        ceilingNote = ` (미적용: ${context.totalCeilingCount}회)`;
    }

    renderResult(
        N, chartDP, listDP, mode,
        'resultChart2', 'legendList2', 'summaryText2', 'logicDetailText2',
        () => `
            <strong>2성 분석 결과</strong><br>
            총 가챠 횟수 : ${context.totalPulls}회 (일반 ${context.normalPulls} + 스탭업 ${context.totalStepPulls})<br>
            천장 교환 합계 : ${context.totalCeilingCount}회 (일반 ${context.normalCeilingCount} + 스탭업 ${context.stepUpCeilingCount})${ceilingNote}<br>
            <strong>올컴플릿 확률 : ${formatProbability(dp[N])}</strong>
        `,
        () => {
            let ceilingDesc = "";
            if (CEILING_MODE.star2 === 'included') {
                ceilingDesc = `합산된 ${context.totalCeilingCount}개의 천장 교환권은 가장 마지막에 적용되어 없는 픽업을 확정 획득합니다.`;
            } else {
                ceilingDesc = `<span style="color:red;">사용자 설정에 의해 ${context.totalCeilingCount}개의 천장 교환권 적용이 제외되었습니다.</span>`;
            }

            return `
            <span class="logic-title">상세 계산 근거</span>
            <ul class="logic-list">
                <li><strong>확률 적용:</strong> 총 ${context.normalPulls}회 중 ${context.countNormal}회는 기본 개별 확률(${(context.p_normal_one*100).toFixed(3)}%)이, ${context.countHigh}회는 10회차 보정 개별 확률(${(context.p_high_one*100).toFixed(3)}%)이 적용되었습니다.</li>
                <li><strong>계산 원리:</strong> 각 스탭업 그룹은 독립적인 캐릭터 풀을 가지므로 별도로 계산 후 합성(Convolution)하였고, 이후 일반 가챠는 전체 풀을 공유하므로 합성된 결과를 초기 상태로 하여 DP를 수행했습니다.</li>
                <li><strong>일반 천장(${context.normalCeilingCount}회):</strong> 일반 가챠 100회당 1개 지급.</li>
                <li><strong>스탭업 천장(${context.stepUpCeilingCount}회):</strong> 4개 그룹 스탭업 합산 50회당 1개 지급.</li>
                <li><strong>천장 최종 처리:</strong> ${ceilingDesc}</li>
                <li><strong>계산 방식:</strong> **동적 계획법(DP)** 알고리즘을 사용하여, **쿠폰 수집가 문제(Coupon Collector's Problem)** 모델을 기반으로 정확한 확률을 계산했습니다.</li>
            </ul>
            `;
        }
    );
}

// ... (transformData, renderResult, updateLegend, renderChart, createChart 동일) ...
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

    document.getElementById(summaryId).innerHTML = summaryCallback();
    document.getElementById(logicId).innerHTML = logicCallback();
    document.getElementById(logicId).style.display = 'block';

    const chartTooltipValues = chartDP.map(p => formatProbability(p));

    updateLegend(legendId, listLabels, listData, backgroundColors);
    renderChart(chartId, chartLabels, chartData, backgroundColors, chartTooltipValues);
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
            <div class="legend-value">${percent}</div>
        `;
        listContainer.appendChild(item);
    });
}

function renderChart(canvasId, labels, data, colors, tooltipValues) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    if (canvasId === 'resultChart') {
        if (myChart3Star) myChart3Star.destroy();
        myChart3Star = createChart(ctx, labels, data, colors, tooltipValues);
    } else {
        if (myChart2Star) myChart2Star.destroy();
        myChart2Star = createChart(ctx, labels, data, colors, tooltipValues);
    }
}

function createChart(ctx, labels, data, colors, tooltipValues) {
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
                            const index = context.dataIndex;
                            const label = context.label;
                            const formattedVal = tooltipValues[index];
                            return ` ${label}: ${formattedVal}`;
                        }
                    }
                }
            }
        }
    });
}