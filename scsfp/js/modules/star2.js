import { CONFIG_2STAR, EXCLUDE_SAVE_IDS, KEY_2STAR } from '../config.js';
import { appState, inputInstances, CACHE, VIEW_MODE, CEILING_MODE, RANDOM_MODE, STEP4_MODE } from '../state.js';
import { storageManager } from '../lib/utils/StorageManager.js';
import { InputNumberElement } from '../lib/utils/InputNumberElement.js';
import { runGacha, runSelectTicket, convolveDistributions, transformData, runTotalCountGacha, runGuaranteedTotal } from '../lib/math/core.js';
import { renderResultCommon, renderTotalBarResult, renderSpecificBarResult } from '../lib/ui/uiHelper.js';
import { formatProbability } from '../lib/ui/formatter.js';

const chartRef = { current: null };
const chartRefTotal = { current: null };
const chartRefSpecific = { current: null };

export function init2StarInputs() {
    const savedData = storageManager.load(KEY_2STAR) || {};

    CONFIG_2STAR.forEach(cfg => {
        const el = document.getElementById(cfg.id);
        if (!el) return;

        let initialVal;
        if (EXCLUDE_SAVE_IDS.includes(cfg.id)) {
            initialVal = 0;
        } else {
            const saved = savedData[cfg.id];
            if (saved !== undefined && saved !== "" && saved !== null) {
                initialVal = saved;
            } else {
                initialVal = cfg.def;
            }
        }
        
        inputInstances.star2[cfg.id] = new InputNumberElement(
            el, cfg.min, cfg.max, initialVal,
            calculate2Star
        );
    });
    
    calculate2Star();
}

export function calculate2Star() {
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
        if (chartRef.current) {
            chartRef.current.destroy();
            chartRef.current = null;
        }
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
        save2StarData(); 
        return;
    }

    let dpCombined = [1.0]; 
    let dpTotal = [1.0]; 
    let dpSpecific = [1.0];

    // 타겟 그룹 (가장 많이 돌린 그룹)
    let targetGroup = groups.reduce((prev, current) => (prev.pulls > current.pulls) ? prev : current);
    
    let totalStepPulls = 0;
    let totalStepUpNormalPulls = 0;
    let totalStepUpGuaranteedPulls = 0;

    groups.forEach(g => {
        if (g.count > 0) {
            // 2성은 버튼 설정(RANDOM, STEP4)에 영향받지 않고 고정 규칙 적용
            const result = calculateSingleGroupDP(g.count, g.pulls, rateTotal);
            dpCombined = convolveDistributions(dpCombined, result.dp);
            dpTotal = convolveDistributions(dpTotal, result.dpTotal); 

            totalStepPulls += g.pulls;
            totalStepUpNormalPulls += result.normalPullsCount;
            totalStepUpGuaranteedPulls += result.guaranteedPullsCount;
        }
    });

    if (targetGroup && targetGroup.count > 0 && targetGroup.pulls > 0) {
        const p_target_normal = rateTotal / targetGroup.count;
        const p_target_guar = 1.0 / targetGroup.count;
        
        for (let i = 1; i <= targetGroup.pulls; i++) {
            let p = p_target_normal;
            if (i === 5 || (i > 5 && (i - 5) % 10 === 0)) {
                p = p_target_guar; 
            }
            dpSpecific = runTotalCountGacha(dpSpecific, p);
        }
    }

    let dp = dpCombined;
    if (dp.length <= normalCount) {
        const diff = (normalCount + 1) - dp.length;
        for(let i=0; i<diff; i++) dp.push(0);
    }

    let countNormal = 0;
    let countHigh = 0;

    const p_normal_total = rateTotal; 
    const p_normal_one = rateTotal / normalCount; 
    const p_high_total = 0.95; 
    const p_high_one = 0.95 / normalCount; 

    for (let i = 1; i <= normalPulls; i++) {
        let p_col_curr, p_tot_curr, p_spec_curr;

        if (i % 10 === 0) {
             p_col_curr = p_high_one;
             p_tot_curr = p_high_total;
             p_spec_curr = p_high_one;
             countHigh++;
        } else {
             p_col_curr = p_normal_one;
             p_tot_curr = p_normal_total;
             p_spec_curr = p_normal_one;
             countNormal++;
        }

        dp = runGacha(dp, p_col_curr);
        dpTotal = runTotalCountGacha(dpTotal, p_tot_curr);
        dpSpecific = runTotalCountGacha(dpSpecific, p_spec_curr);
    }

    let normalCeilingCount = Math.floor(normalPulls / 100);
    let stepUpCeilingCount = Math.floor(totalStepPulls / 50);
    let totalCeilingCount = normalCeilingCount + stepUpCeilingCount;

    if (CEILING_MODE.star2 === 'included') {
        for (let i = 0; i < totalCeilingCount; i++) {
            dp = runSelectTicket(dp);
            dpTotal = runGuaranteedTotal(dpTotal); 
            dpSpecific = runGuaranteedTotal(dpSpecific); 
        }
    }

    let totalPulls = normalPulls + totalStepPulls;
    
    CACHE.star2 = {
        N: normalCount,
        dp: dp,
        dpTotal: dpTotal,
        dpSpecific: dpSpecific,
        context: {
            totalPulls, normalPulls, totalStepPulls, 
            normalCeilingCount, stepUpCeilingCount, totalCeilingCount,
            countNormal, countHigh, p_normal_one, p_high_one,
            groups, rateTotal, totalStepUpNormalPulls, totalStepUpGuaranteedPulls
        }
    };

    render2StarUI();
    save2StarData();
}

function calculateSingleGroupDP(N, pulls, rateTotal) {
    let dp = new Array(N + 1).fill(0);
    dp[0] = 1.0;
    let dpTotal = [1.0];

    if (pulls <= 0) return { dp, dpTotal, normalPullsCount: 0, guaranteedPullsCount: 0 };

    const p_normal = rateTotal / N; 
    const p_guaranteed = 1.0 / N;
    
    const p_total_normal = rateTotal;
    const p_total_guaranteed = 1.0;   

    let normalPullsCount = 0;
    let guaranteedPullsCount = 0;

    for (let i = 1; i <= pulls; i++) {
        let p_current_one = p_normal;
        let p_current_total = p_total_normal;

        if (i === 5 || (i > 5 && (i - 5) % 10 === 0)) {
            p_current_one = p_guaranteed;
            p_current_total = p_total_guaranteed;
            guaranteedPullsCount++;
        } else {
            normalPullsCount++;
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
        
        if (p_current_total >= 1.0) {
            dpTotal = runGuaranteedTotal(dpTotal);
        } else {
            dpTotal = runTotalCountGacha(dpTotal, p_current_total);
        }
    }
    return { dp, dpTotal, normalPullsCount, guaranteedPullsCount };
}

export function render2StarUI() {
    if (!CACHE.star2) return;
    const { N, dp, dpTotal, dpSpecific, context } = CACHE.star2;

    const collectionTab = document.getElementById('res-2s-collection');
    const totalTab = document.getElementById('res-2s-total');
    const specificTab = document.getElementById('res-2s-specific');

    if (collectionTab && collectionTab.classList.contains('active')) {
        const mode = VIEW_MODE.star2;
        
        // [수정 핵심] chartDP와 listDP를 분리하여 인자 개수를 맞춤
        const chartDP = dp; 
        const listDP = transformData(dp, mode);

        let ceilingNote = (CEILING_MODE.star2 === 'excluded' && context.totalCeilingCount > 0) ? ` (미적용: ${context.totalCeilingCount}회)` : "";

        renderResultCommon(
            N, chartDP, listDP, mode, // 4개 인자 전달
            { chart: 'resultChart2', legend: 'legendList2', summary: 'summaryText2', logic: 'logicDetailText2' },
            {
                summary: () => `
                    <strong>2성 분석 결과</strong><br>
                    총 가챠 횟수 : ${context.totalPulls}회 (일반 ${context.normalPulls} + 스탭업 ${context.totalStepPulls})<br>
                    천장 교환 합계 : ${context.totalCeilingCount}회 (일반 ${context.normalCeilingCount} + 스탭업 ${context.stepUpCeilingCount})${ceilingNote}<br>
                    <strong>올컴플릿 확률 : ${formatProbability(dp[N])}</strong>
                `,
                logic: () => {
                    let ceilingDesc = "";
                    if (CEILING_MODE.star2 === 'included') {
                        ceilingDesc = `합산된 ${context.totalCeilingCount}개의 천장 교환권은 가장 마지막에 적용되어 없는 픽업을 확정 획득합니다.`;
                    } else {
                        ceilingDesc = `<span style="color:red;">사용자 설정에 의해 ${context.totalCeilingCount}개의 천장 교환권 적용이 제외되었습니다.</span>`;
                    }

                    let groupDetailHtml = "";
                    context.groups.forEach(g => {
                        if (g.count > 0) {
                            const indivRate = ((context.rateTotal * 100) / g.count).toFixed(3);
                            const guarRate = (100 / g.count).toFixed(3);
                            groupDetailHtml += `<li><strong>그룹 ${g.id} (${g.count}종):</strong> 기본 개별 ${indivRate}%, Step1(5회)/Step2(10주기-5회) 확정 시 개별 ${guarRate}%</li>`;
                        }
                    });
    
                    const currentEl = document.getElementById('logicDetailText2');
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
                    <div class="section-content" style="display: ${displayStyle};">
                        <ul class="logic-list">
                            <li><strong>확률 적용 (일반):</strong> 총 ${context.normalPulls}회 중 ${context.countNormal}회는 기본 개별 확률(${(context.p_normal_one*100).toFixed(3)}%)이, ${context.countHigh}회는 10회차 보정(전체 95%) 개별 확률(${(context.p_high_one*100).toFixed(3)}%)이 적용되었습니다.</li>
                            <li><strong>확률 적용 (스탭업):</strong> 총 ${context.totalStepPulls}회 중 ${context.totalStepUpNormalPulls}회는 그룹별 개별 확률이, ${context.totalStepUpGuaranteedPulls}회는 그룹별 확정 개별 확률이 적용되었습니다.</li>
                            <ul style="margin-top:0; padding-left:20px; list-style-type:circle;">
                                ${groupDetailHtml}
                            </ul>
                            <li><strong>계산 원리:</strong> 각 스탭업 그룹은 독립적인 캐릭터 풀을 가지므로 별도로 계산 후 합성(Convolution)하였고, 이후 일반 가챠는 전체 풀을 공유하므로 합성된 결과를 초기 상태로 하여 DP를 수행했습니다.</li>
                            <li><strong>일반 천장(${context.normalCeilingCount}회):</strong> 일반 가챠 100회당 1개 지급.</li>
                            <li><strong>스탭업 천장(${context.stepUpCeilingCount}회):</strong> 4개 그룹 스탭업 합산 50회당 1개 지급.</li>
                            <li><strong>천장 최종 처리:</strong> ${ceilingDesc}</li>
                            <li><strong>계산 방식:</strong> **동적 계획법(DP)** 알고리즘을 사용하여, **쿠폰 수집가 문제(Coupon Collector's Problem)** 모델을 기반으로 정확한 확률을 계산했습니다.</li>
                        </ul>
                    </div>
                    `;
                }
            },
            chartRef
        );
    }

    if (totalTab && totalTab.classList.contains('active')) {
        let expectedValue = 0;
        for(let i=0; i<dpTotal.length; i++) expectedValue += i * dpTotal[i];
        
        const summaryHtml = `
            평균 기대 획득 수: 약 <strong>${expectedValue.toFixed(3)}개</strong><br>
            <span style="font-size:0.85rem; color:#888;">(그래프는 평균 기준 유의미한 확률 구간을 표시합니다.)</span>
        `;
        renderTotalBarResult(dpTotal, VIEW_MODE.star2, { chart: 'resultChartTotal2', summary: 'summaryTextTotal2' }, summaryHtml, chartRefTotal);
    }

    if (specificTab && specificTab.classList.contains('active')) {
        let expectedValue = 0;
        for(let i=0; i<dpSpecific.length; i++) expectedValue += i * dpSpecific[i];
        
        const summaryHtml = `
            특정 픽업 기대 획득 수: 약 <strong>${expectedValue.toFixed(3)}개</strong><br>
            <span style="font-size:0.85rem; color:#dc3545;">(천장 포함 버튼이 활성화 되어있는지 주의하세요.)</span>
            <span style="font-size:0.85rem; color:#666;">(가장 많이 돌린 그룹에 속해있다는 가정)</span>
            <span style="font-size:0.85rem; color:#888;">(그래프는 평균 기준 유의미한 확률 구간을 표시합니다.)</span>
        `;
        renderSpecificBarResult(dpSpecific, VIEW_MODE.star2, { chart: 'resultChartSpecific2', summary: 'summaryTextSpecific2' }, summaryHtml, chartRefSpecific);
    }
}

export function save2StarData() {
    if (appState.isInitializing) return;
    const data = {};
    CONFIG_2STAR.forEach(cfg => {
        if (EXCLUDE_SAVE_IDS.includes(cfg.id)) return;
        const el = document.getElementById(cfg.id);
        if(el && el.value !== "") {
            data[cfg.id] = el.value;
        } else {
            data[cfg.id] = cfg.def;
        }
    });
    storageManager.save(KEY_2STAR, data);
}

export function reset2Star() {
    if (!confirm("2성 탭의 설정을 초기화하시겠습니까?")) return;
    storageManager.remove(KEY_2STAR);

    CONFIG_2STAR.forEach(cfg => {
        const instance = inputInstances.star2[cfg.id];
        if (instance) instance.setValue(cfg.def, false);
    });
    calculate2Star();
    save2StarData();
}