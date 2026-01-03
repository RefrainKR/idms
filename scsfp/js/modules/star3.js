import { CONFIG_3STAR, EXCLUDE_SAVE_IDS, KEY_3STAR } from '../config.js';
import { appState, inputInstances, CACHE, VIEW_MODE, CEILING_MODE } from '../state.js';
import { storageManager } from '../lib/utils/StorageManager.js';
import { InputNumberElement } from '../lib/utils/InputNumberElement.js';
import { runGacha, runSelectTicket, runRandomPickup, transformData } from '../lib/math/core.js';
import { renderResultCommon } from '../lib/ui/uiHelper.js';
import { formatProbability } from '../lib/ui/formatter.js';

const chartRef = { current: null }; // 차트 인스턴스 보관용

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
    const maxLoops = parseInt(document.getElementById('maxLoops').value) || 1;
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
    const maxLoops = parseInt(document.getElementById('maxLoops').value) || 1;
    let stepPulls = parseInt(document.getElementById('stepPulls').value) || 0;

    const maxStepPulls = maxLoops * 40;
    if (stepPulls > maxStepPulls) stepPulls = maxStepPulls;
    if (p_step4_total_percent > 100) p_step4_total_percent = 100;

    if (N <= 0) return;

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

    // 1. 일반 가챠
    for (let i = 0; i < normalPulls; i++) dp = runGacha(dp, p_normal_one);

    // 2. 스탭업 가챠
    for (let i = 1; i <= stepPulls; i++) {
        let isStep4 = (i % 40 === 0); 
        if (isStep4) countStep4++; else countNormal++;
        let currentProb = isStep4 ? p_step4_one : p_normal_one;
        dp = runGacha(dp, currentProb);
        
        if (i % 40 === 0) {
            let currentLoop = i / 40;
            let rewardType = loopRewards[currentLoop];
            if (rewardType === 'random') {
                dp = runRandomPickup(dp); 
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
    save3StarData();
}

export function render3StarUI() {
    if (!CACHE.star3) return;
    const { N, dp, context } = CACHE.star3;
    const mode = VIEW_MODE.star3;
    const chartDP = dp; 
    const listDP = transformData(dp, mode);
    
    let ceilingNote = "";
    if (CEILING_MODE.star3 === 'excluded' && context.totalCeilingCount > 0) {
        ceilingNote = ` (미적용: ${context.totalCeilingCount}회)`;
    }

    renderResultCommon(
        N, chartDP, listDP, mode,
        { chart: 'resultChart', legend: 'legendList', summary: 'summaryText', logic: 'logicDetailText' },
        {
            summary: () => `
                <!-- [수정 4] "3성 분석 결과" 타이틀 제거 -->
                가챠 횟수 : ${context.totalPulls}회 (일반 ${context.normalPulls} + 스탭업 ${context.stepPulls})<br>
                랜덤 교환(픽업 티켓) : ${context.randomRewardCount}회<br>
                천장 교환(셀렉 티켓) : ${context.totalCeilingCount}회 (통합 ${context.normalCeiling} + 스탭업 ${context.selectRewardCount})${ceilingNote}<br>
                <strong>올컴플릿 확률 : ${formatProbability(dp[N])}</strong>
            `,
            logic: () => {
                // ... (이전 로직 유지)
                let rewardHistoryHtml = "";
                for(let i=1; i<=context.maxLoops; i++) {
                    let rType = context.loopRewards[i];
                    let rText = '없음';
                    if (rType === 'random') rText = '픽업 티켓';
                    else if (rType === 'select') rText = '셀렉 티켓';

                    if (i * 40 <= context.stepPulls) rewardHistoryHtml += `[${i}주: ${rText}] `;
                    else rewardHistoryHtml += `<span style="color:#aaa;">[${i}주: ${rText}]</span> `;
                }
                
                let ceilingDesc = "";
                if (CEILING_MODE.star3 === 'included') {
                    ceilingDesc = `합산된 ${context.totalCeilingCount}개의 셀렉 티켓(천장)은 가장 마지막에 적용되어 없는 픽업을 확정 획득합니다.`;
                } else {
                    ceilingDesc = `<span style="color:red;">사용자 설정에 의해 ${context.totalCeilingCount}개의 셀렉 티켓(천장) 적용이 제외되었습니다.</span>`;
                }

                return `
                <div class="section-header" style="cursor: pointer; margin-bottom: 10px;">
                    <span class="logic-title" style="border-bottom: none; margin-bottom: 0;">상세 계산 근거</span>
                    <button class="toggle-btn">▼</button>
                </div>
                <div class="section-content" style="display: none;">
                    <ul class="logic-list">
                        <li><strong>확률 적용:</strong> 기본 확률(${context.p_indiv_percent}%) ${context.countNormal}회, Step4 개별 확률(${(context.p_step4_total_percent/N).toFixed(3)}%) ${context.countStep4}회 적용되었습니다.</li>
                        <li><strong>주회 보상 설정:</strong> ${rewardHistoryHtml}</li>
                        <li><strong>랜덤 교환(픽업 티켓)(${context.randomRewardCount}회):</strong> 보유 수에 따라 중복 또는 신규획득 확률이 적용됩니다. (설정 무관 항상 적용)</li>
                        <li><strong>천장 교환(셀렉 티켓)(${context.totalCeilingCount}회):</strong> ${ceilingDesc}</li>
                        <li><strong>계산 방식:</strong> **동적 계획법(DP)** 알고리즘을 사용하여, **쿠폰 수집가 문제(Coupon Collector's Problem)** 모델을 기반으로 정확한 확률을 계산했습니다.</li>
                    </ul>
                </div>`;
            }
        },
        chartRef
    );
}

export function save3StarData() {
    if (appState.isInitializing) return;
    const data = {};
    CONFIG_3STAR.forEach(cfg => {
        if (EXCLUDE_SAVE_IDS.includes(cfg.id)) return;
        const el = document.getElementById(cfg.id);
        if(el && el.value !== "") data[cfg.id] = el.value;
    });
    
    const maxLoops = parseInt(document.getElementById('maxLoops').value) || 1;
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