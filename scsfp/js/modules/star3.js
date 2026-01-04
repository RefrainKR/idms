import { CONFIG_3STAR, EXCLUDE_SAVE_IDS, KEY_3STAR } from '../config.js';
import { appState, inputInstances, CACHE, VIEW_MODE, CEILING_MODE, RANDOM_MODE, STEP4_MODE } from '../state.js';
import { storageManager } from '../lib/utils/StorageManager.js';
import { InputNumberElement } from '../lib/utils/InputNumberElement.js';
import { runGacha, runSelectTicket, runRandomPickup, transformData, runTotalCountGacha, runGuaranteedTotal } from '../lib/math/core.js';
import { renderResultCommon, renderTotalBarResult, renderSpecificBarResult } from '../lib/ui/uiHelper.js';
import { formatProbability } from '../lib/ui/formatter.js';

const chartRef = { current: null };
const chartRefTotal = { current: null };
const chartRefSpecific = { current: null };

export function init3StarInputs() {
    const savedData = storageManager.load(KEY_3STAR) || {};

    CONFIG_3STAR.forEach(cfg => {
        const el = document.getElementById(cfg.id);
        let initialVal;
        
        if (EXCLUDE_SAVE_IDS.includes(cfg.id)) {
            initialVal = 0;
        } 
        else if (savedData[cfg.id] !== undefined && savedData[cfg.id] !== "" && savedData[cfg.id] !== null) {
            initialVal = savedData[cfg.id];
        } else {
            initialVal = cfg.def;
        }
        
        inputInstances.star3[cfg.id] = new InputNumberElement(
            el, cfg.min, cfg.max, initialVal,
            () => {
                if (cfg.id === 'maxLoops') updateLoopSettings();
                else calculate3Star();
            }
        );
    });

    updateLoopSettings();
    calculate3Star();
}

function updateLoopSettings() {
    const maxLoopsInput = document.getElementById('maxLoops');
    let maxLoops = parseInt(maxLoopsInput.value);
    if (isNaN(maxLoops)) maxLoops = 1; 

    const container = document.getElementById('loopRewardsArea');
    const savedData = storageManager.load(KEY_3STAR) || {};
    const savedRewards = savedData.loopRewards || {};

    container.innerHTML = '';

    for (let i = 1; i <= maxLoops; i++) {
        const wrapper = document.createElement('div');
        wrapper.className = 'loop-reward-item';
        const label = document.createElement('label');
        label.textContent = `${i}주 보상`;
        const select = document.createElement('select');
        select.id = `rewardLoop${i}`;
        select.className = 'loop-reward-select';
        
        select.onchange = () => calculate3Star();
        
        const opts = [
            { val: 'none', text: '없음' },
            { val: 'random', text: '랜덤 교환(픽업 티켓)' },
            { val: 'select', text: '천장 교환(셀렉 티켓)' }
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

    let stepPullsInputInstance = inputInstances.star3['stepPulls'];
    if (stepPullsInputInstance) {
        stepPullsInputInstance.setMax(maxLoops * 40);
    }
    const stepLabel = document.querySelector('label[for="stepPulls"]');
    if (stepLabel) stepLabel.textContent = `스탭업 횟수(${maxLoops * 40})`;
    
    calculate3Star();
}

export function calculate3Star() {
    const N = parseInt(document.getElementById('pickupCount').value) || 0;
    const p_indiv_percent = parseFloat(document.getElementById('pickupRate').value) || 0;
    let p_step4_total_percent = parseFloat(document.getElementById('step4Rate').value) || 0;
    const normalPulls = parseInt(document.getElementById('normalPulls').value) || 0;
    
    const maxLoopsInput = document.getElementById('maxLoops');
    let maxLoops = parseInt(maxLoopsInput.value);
    if (isNaN(maxLoops)) maxLoops = 1;

    let stepPulls = parseInt(document.getElementById('stepPulls').value) || 0;

    if (N <= 0) return;
    const maxStepPulls = maxLoops * 40;
    if (stepPulls > maxStepPulls) stepPulls = maxStepPulls;
    if (p_step4_total_percent > 100) p_step4_total_percent = 100;

    // --- 확률 정의 ---
    const p_normal_one = p_indiv_percent / 100; 
    const p_step4_one = (p_step4_total_percent / 100) / N;

    // [수정] 변수명 통일: _all -> _total
    const p_normal_total = (p_indiv_percent * N) / 100;
    const p_step4_total = p_step4_total_percent / 100;

    const p_specific_normal = p_indiv_percent / 100;
    const p_specific_step4 = (p_step4_total_percent / 100) / N;
    const p_specific_random_ticket = 1.0 / N; 

    let countStep4 = 0; 
    let countNormal = normalPulls;
    let randomRewardCount = 0;
    let selectRewardCount = 0;
    
    let loopRewards = {};
    for (let i = 1; i <= maxLoops; i++) {
        const sel = document.getElementById(`rewardLoop${i}`);
        if (sel) loopRewards[i] = sel.value;
    }

    let dp = new Array(N + 1).fill(0); dp[0] = 1.0; 
    let dpTotal = [1.0]; 
    let dpSpecific = [1.0]; 

    // 1. 일반 가챠
    for (let i = 0; i < normalPulls; i++) {
        dp = runGacha(dp, p_normal_one);
        dpTotal = runTotalCountGacha(dpTotal, p_normal_total);
        dpSpecific = runTotalCountGacha(dpSpecific, p_specific_normal);
    }

    // 2. 스탭업 가챠
    for (let i = 1; i <= stepPulls; i++) {
        let isStep4 = (i % 40 === 0); 
        if (isStep4) countStep4++; else countNormal++;
        
        let currentProbOne = (isStep4 && STEP4_MODE.star3 === 'included') ? p_step4_one : p_normal_one;
        // [수정] 위에서 정의한 p_step4_total 사용
        let currentProbTotal = (isStep4 && STEP4_MODE.star3 === 'included') ? p_step4_total : p_normal_total;
        let currentProbSpecific = (isStep4 && STEP4_MODE.star3 === 'included') ? p_specific_step4 : p_specific_normal;

        dp = runGacha(dp, currentProbOne);
        dpTotal = runTotalCountGacha(dpTotal, currentProbTotal);
        dpSpecific = runTotalCountGacha(dpSpecific, currentProbSpecific);
        
        if (i % 40 === 0) {
            let currentLoop = i / 40;
            let rewardType = loopRewards[currentLoop];
            if (rewardType === 'random') {
                if (RANDOM_MODE.star3 === 'included') {
                    dp = runRandomPickup(dp); 
                    dpTotal = runGuaranteedTotal(dpTotal);
                    dpSpecific = runTotalCountGacha(dpSpecific, p_specific_random_ticket); 
                }
                randomRewardCount++;
            } else if (rewardType === 'select') {
                selectRewardCount++;
            }
        }
    }

    let totalPulls = normalPulls + stepPulls;
    let normalCeiling = Math.floor(totalPulls / 200);
    let totalCeilingCount = selectRewardCount + normalCeiling;

    if (CEILING_MODE.star3 === 'included') {
        for (let i = 0; i < totalCeilingCount; i++) {
            dp = runSelectTicket(dp);
            dpTotal = runGuaranteedTotal(dpTotal);
            dpSpecific = runGuaranteedTotal(dpSpecific);
        }
    }

    CACHE.star3 = {
        N: N,
        dp: dp,
        dpTotal: dpTotal,
        dpSpecific: dpSpecific,
        context: {
            p_indiv_percent, countNormal, p_step4_total_percent, countStep4,
            maxLoops, loopRewards, stepPulls,
            totalPulls, normalPulls, stepPulls,
            randomRewardCount, totalCeilingCount, selectRewardCount, normalCeiling
        }
    };

    render3StarUI();
    save3StarData();
}

export function render3StarUI() {
    if (!CACHE.star3) return;
    const { N, dp, dpTotal, dpSpecific, context } = CACHE.star3;

    const collectionTab = document.getElementById('res-3s-collection');
    const totalTab = document.getElementById('res-3s-total');
    const specificTab = document.getElementById('res-3s-specific');

    if (collectionTab && collectionTab.classList.contains('active')) {
        const mode = VIEW_MODE.star3;
        const chartDP = dp; 
        const listDP = transformData(dp, mode);
        
        let ceilingNote = (CEILING_MODE.star3 === 'excluded' && context.totalCeilingCount > 0) ? ` (미적용: ${context.totalCeilingCount}회)` : "";

        renderResultCommon(
            N, chartDP, listDP, mode,
            { chart: 'resultChart', legend: 'legendList', summary: 'summaryText', logic: 'logicDetailText' },
            {
                summary: () => `
                    <strong>3성 분석 결과</strong><br>
                    가챠 횟수 : ${context.totalPulls}회 (일반 ${context.normalPulls} + 스탭업 ${context.stepPulls})<br>
                    랜덤 교환(픽업 티켓) : ${context.randomRewardCount}회<br>
                    천장 교환(셀렉 티켓) : ${context.totalCeilingCount}회 (통합 ${context.normalCeiling} + 스탭업 ${context.selectRewardCount})${ceilingNote}<br>
                    <strong>올컴플릿 확률 : ${formatProbability(dp[N])}</strong>
                `,
                logic: () => {
                     let rewardHistoryHtml = "";
                     for(let i=1; i<=context.maxLoops; i++) {
                         let rType = context.loopRewards[i];
                         let rText = '없음';
                         if (rType === 'random') rText = '픽업 티켓';
                         else if (rType === 'select') rText = '셀렉 티켓';
                         rewardHistoryHtml += (i * 40 <= context.stepPulls) ? `[${i}주: ${rText}] ` : `<span style="color:#aaa;">[${i}주: ${rText}]</span> `;
                     }
                     
                     let ceilingDesc = (CEILING_MODE.star3 === 'included') 
                        ? `합산된 ${context.totalCeilingCount}개의 천장 교환(셀렉 티켓)은 가장 마지막에 적용되어 없는 픽업을 확정 획득합니다.` 
                        : `<span style="color:red;">사용자 설정에 의해 ${context.totalCeilingCount}개의 천장 교환(셀렉 티켓) 적용이 제외되었습니다.</span>`;
                     
                     let randomDesc = "";
                     if (RANDOM_MODE.star3 === 'included') {
                         randomDesc = `보유 수에 따라 중복 또는 신규획득 확률이 적용됩니다.`;
                     } else {
                         randomDesc = `<span style="color:red;">사용자 설정에 의해 랜덤 교환(픽업 티켓) 적용이 제외되었습니다.</span>`;
                     }

                     const currentEl = document.getElementById('logicDetailText');
                     const content = currentEl ? currentEl.querySelector('.section-content') : null;
                     
                     let isHidden = true;
                     if (content && content.style.display !== 'none') {
                         isHidden = false;
                     }

                     const displayStyle = isHidden ? 'none' : 'block';
                     const btnText = isHidden ? '▲' : '▼';

                     return `
                     <div class="section-header" style="cursor: pointer; margin-bottom: 10px;">
                        <span class="logic-title" style="border-bottom: none; margin-bottom: 0;">상세 계산 근거</span>
                        <button class="toggle-btn">${btnText}</button>
                     </div>
                     <div class="section-content logic-view" style="display: ${displayStyle};">
                        <ul class="logic-list">
                            <li><strong>확률 적용:</strong> 기본 확률(${context.p_indiv_percent}%) ${context.countNormal}회, Step4 개별 확률(${(context.p_step4_total_percent/N).toFixed(3)}%) ${context.countStep4}회 적용되었습니다.</li>
                            <li><strong>주회 보상 설정:</strong> ${rewardHistoryHtml}</li>
                            <li><strong>랜덤 교환(픽업 티켓)(${context.randomRewardCount}회):</strong> ${randomDesc}</li>
                            <li><strong>천장 교환(셀렉 티켓)(${context.totalCeilingCount}회):</strong> ${ceilingDesc}</li>
                            <li><strong>계산 방식:</strong> **동적 계획법(DP)** 알고리즘을 사용하여, **쿠폰 수집가 문제(Coupon Collector's Problem)** 모델을 기반으로 정확한 확률을 계산했습니다.</li>
                        </ul>
                     </div>`;
                }
            },
            chartRef
        );
    }

    // 2. 총 획득 수
    if (totalTab && totalTab.classList.contains('active')) {
        let expectedValue = 0;
        for(let i=0; i<dpTotal.length; i++) expectedValue += i * dpTotal[i];
        
        const summaryHtml = `
            3성 평균 기대 획득 수: 약 <strong>${expectedValue.toFixed(3)}개</strong><br>
            <span style="font-size:0.85rem; color:#888;">(그래프는 평균 기준 유의미한 확률 구간을 표시합니다.)</span>
        `;
        renderTotalBarResult(dpTotal, VIEW_MODE.star3, { chart: 'resultChartTotal3', summary: 'summaryTextTotal3' }, summaryHtml, chartRefTotal);
    }

    // 3. 특정 픽업
    if (specificTab && specificTab.classList.contains('active')) {
        let expectedValue = 0;
        for(let i=0; i<dpSpecific.length; i++) expectedValue += i * dpSpecific[i];
        
        const summaryHtml = `
            특정 픽업(담당) 기대 획득 수: 약 <strong>${expectedValue.toFixed(3)}장</strong><br>
            <span style="font-size:0.85rem; color:#dc3545;">(천장 포함 버튼이 활성화 되어있는지 주의하세요.)</span><br>
            <span style="font-size:0.85rem; color:#888;">(그래프는 평균 기준 유의미한 구간을 표시합니다.)</span>
        `;

        renderSpecificBarResult(dpSpecific, VIEW_MODE.star3, { chart: 'resultChartSpecific3', summary: 'summaryTextSpecific3' }, summaryHtml, chartRefSpecific);
    }
}

export function save3StarData() {
    if (appState.isInitializing) return;
    const data = {};
    CONFIG_3STAR.forEach(cfg => {
        if (EXCLUDE_SAVE_IDS.includes(cfg.id)) return;
        const el = document.getElementById(cfg.id);
        if(el && el.value !== "") data[cfg.id] = el.value;
    });
    
    // [수정] 0 허용
    let maxLoops = parseInt(document.getElementById('maxLoops').value);
    if (isNaN(maxLoops)) maxLoops = 1;

    data.loopRewards = {};
    for (let i = 1; i <= maxLoops; i++) {
        const sel = document.getElementById(`rewardLoop${i}`);
        if (sel) data.loopRewards[i] = sel.value;
    }

    storageManager.save(KEY_3STAR, data);
}

export function reset3Star() {
    if (!confirm("3성 탭의 설정을 초기화하시겠습니까?")) return;
    storageManager.remove(KEY_3STAR);
    
    CONFIG_3STAR.forEach(cfg => {
        const instance = inputInstances.star3[cfg.id];
        if (instance) instance.setValue(cfg.def, false);
    });
    updateLoopSettings(); 
    calculate3Star();
    save3StarData();
}

export function applyGeneralPreset() {
    const settings = {
        pickupCount: 2, pickupRate: 1, maxLoops: 2, step4Rate: 20,
        rewards: { 2: 'random' }
    };
    apply3StarSettings(settings);
}

// [추가] 생일 가챠 프리셋
export function applyBirthdayPreset() {
    const settings = {
        pickupCount: 1, 
        pickupRate: 1.5, 
        maxLoops: 0, 
        step4Rate: 0,
        rewards: {} // 0주회이므로 보상 없음
    };
    apply3StarSettings(settings);
}

export function applyPJPreset() {
    const settings = {
        pickupCount: 4, pickupRate: 1, maxLoops: 3, step4Rate: 40,
        rewards: { 2: 'random', 3: 'select' }
    };
    apply3StarSettings(settings);
}

function apply3StarSettings(settings) {
    if (inputInstances.star3['pickupCount']) inputInstances.star3['pickupCount'].setValue(settings.pickupCount, false);
    if (inputInstances.star3['pickupRate']) inputInstances.star3['pickupRate'].setValue(settings.pickupRate, false);
    if (inputInstances.star3['step4Rate']) inputInstances.star3['step4Rate'].setValue(settings.step4Rate, false);
    if (inputInstances.star3['normalPulls']) inputInstances.star3['normalPulls'].setValue(0, false);
    if (inputInstances.star3['stepPulls']) inputInstances.star3['stepPulls'].setValue(0, false);

    const maxLoopsInstance = inputInstances.star3['maxLoops'];
    if (maxLoopsInstance) maxLoopsInstance.setValue(settings.maxLoops, false);
    
    updateLoopSettings();

    for (const [loop, val] of Object.entries(settings.rewards)) {
        const sel = document.getElementById(`rewardLoop${loop}`);
        if (sel) sel.value = val;
    }

    calculate3Star();
    save3StarData();
}