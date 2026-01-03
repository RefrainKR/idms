import { CONFIG_2STAR, EXCLUDE_SAVE_IDS, KEY_2STAR } from '../config.js';
import { appState, inputInstances, CACHE, VIEW_MODE, CEILING_MODE } from '../state.js';
import { storageManager } from '../lib/utils/StorageManager.js';
import { InputNumberElement } from '../lib/utils/InputNumberElement.js';
import { runGacha, runSelectTicket, convolveDistributions, transformData } from '../lib/math/core.js';
import { renderResultCommon } from '../lib/ui/uiHelper.js';
import { formatProbability } from '../lib/ui/formatter.js';

const chartRef = { current: null };

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
    let totalStepPulls = 0;
    let totalStepUpNormalPulls = 0;
    let totalStepUpGuaranteedPulls = 0;

    groups.forEach(g => {
        if (g.count > 0) {
            const result = calculateSingleGroupDP(g.count, g.pulls, rateTotal, true);
            dpCombined = convolveDistributions(dpCombined, result.dp);
            totalStepPulls += g.pulls;
            totalStepUpNormalPulls += result.normalPullsCount;
            totalStepUpGuaranteedPulls += result.guaranteedPullsCount;
        }
    });

    let dp = dpCombined;
    if (dp.length <= normalCount) {
        const diff = (normalCount + 1) - dp.length;
        for(let i=0; i<diff; i++) dp.push(0);
    }

    let countNormal = 0;
    let countHigh = 0;

    const p_normal_one = rateTotal / normalCount;
    const p_high_one = 0.95 / normalCount;

    for (let i = 1; i <= normalPulls; i++) {
        if (i % 10 === 0) {
            dp = runGacha(dp, p_high_one);
            countHigh++;
        } else {
            dp = runGacha(dp, p_normal_one);
            countNormal++;
        }
    }

    let normalCeilingCount = Math.floor(normalPulls / 100);
    let stepUpCeilingCount = Math.floor(totalStepPulls / 50);
    let totalCeilingCount = normalCeilingCount + stepUpCeilingCount;

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
            countNormal, countHigh, p_normal_one, p_high_one,
            groups, rateTotal, totalStepUpNormalPulls, totalStepUpGuaranteedPulls
        }
    };

    render2StarUI();
    save2StarData();
}

function calculateSingleGroupDP(N, pulls, rateTotal, isStepUp) {
    let dp = new Array(N + 1).fill(0);
    dp[0] = 1.0;
    if (pulls <= 0) return { dp, normalPullsCount: 0, guaranteedPullsCount: 0 };

    const p_normal = rateTotal / N; 
    const p_guaranteed = 1.0 / N;   

    let normalPullsCount = 0;
    let guaranteedPullsCount = 0;

    for (let i = 1; i <= pulls; i++) {
        let p_current_one = p_normal;
        if (i === 5) {
            p_current_one = p_guaranteed; 
            guaranteedPullsCount++;
        } else if (i > 5 && (i - 5) % 10 === 0) {
            p_current_one = p_guaranteed;
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
    }
    return { dp, normalPullsCount, guaranteedPullsCount };
}

export function render2StarUI() {
    if (!CACHE.star2) return;
    const { N, dp, context } = CACHE.star2;
    const mode = VIEW_MODE.star2;

    const chartDP = dp; 
    const listDP = transformData(dp, mode);

    let ceilingNote = "";
    if (CEILING_MODE.star2 === 'excluded' && context.totalCeilingCount > 0) {
        ceilingNote = ` (미적용: ${context.totalCeilingCount}회)`;
    }

    renderResultCommon(
        N, chartDP, listDP, mode,
        { chart: 'resultChart2', legend: 'legendList2', summary: 'summaryText2', logic: 'logicDetailText2' },
        {
            summary: () => `
                <!-- [수정 4] "2성 분석 결과" 타이틀 제거 -->
                총 가챠 횟수 : ${context.totalPulls}회 (일반 ${context.normalPulls} + 스탭업 ${context.totalStepPulls})<br>
                천장 교환 합계 : ${context.totalCeilingCount}회 (일반 ${context.normalCeilingCount} + 스탭업 ${context.stepUpCeilingCount})${ceilingNote}<br>
                <strong>올컴플릿 확률 : ${formatProbability(dp[N])}</strong>
            `,
            logic: () => {
                // ... (이전 로직 유지)
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

                return `
                <div class="section-header" style="cursor: pointer; margin-bottom: 10px;">
                    <span class="logic-title" style="border-bottom: none; margin-bottom: 0;">상세 계산 근거</span>
                    <button class="toggle-btn">▼</button>
                </div>
                <div class="section-content" style="display: none;">
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