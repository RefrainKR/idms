import { BaseGachaModule } from './BaseGachaModule.js';
import { CONFIG, TOGGLE_STATES } from '../config.js';
import { VIEW_MODE, CEILING_MODE, RANDOM_MODE, STEP4_MODE } from '../state.js';
import * as MathCore from '../lib/math/core.js';
import { renderResultCommon, renderTotalBarResult, renderSpecificBarResult } from '../lib/ui/uiHelper.js';
import { formatProbability } from '../lib/ui/formatter.js';

export class Star3Module extends BaseGachaModule {
    constructor() {
        super('star3', CONFIG.STAR3);
    }

    init() {
        super.initInputs((savedData) => this.updateLoopSettings(savedData.loopRewards || {}));
    }

    updateLoopSettings(savedRewards = {}) {
        const maxLoops = this.inputs['maxLoops'].getValue();
        const container = document.getElementById('loopRewardsArea');
        if (!container) return;
        container.innerHTML = '';
        for (let i = 1; i <= maxLoops; i++) {
            const wrapper = document.createElement('div');
            wrapper.className = 'loop-reward-item';
            wrapper.innerHTML = `<label>${i}주 보상</label><select id="rewardLoop${i}" class="loop-reward-select"><option value="none">없음</option><option value="random">랜덤(픽업 티켓)</option><option value="select">천장(셀렉 티켓)</option></select>`;
            const select = wrapper.querySelector('select');
            select.value = savedRewards[i] || 'none';
            select.onchange = () => this.calculate();
            container.appendChild(wrapper);
        }
        this.inputs['stepPulls'].setMax(maxLoops * 40);
    }

    onInputChange(id) {
        if (id === 'maxLoops') this.updateLoopSettings();
        this.calculate();
    }

    calculate() {
        if (this.isInitializing || !this.inputs['pickupCount']) return;

        const N = this.inputs['pickupCount'].getValue();
        const p_indiv_percent = this.inputs['pickupRate'].getValue();
        const p_step4_total_percent = this.inputs['step4Rate'].getValue();
        const normalPulls = this.inputs['normalPulls'].getValue();
        const stepPulls = this.inputs['stepPulls'].getValue();
        const maxLoops = this.inputs['maxLoops'].getValue();

        let loopRewards = {};
        for (let i = 1; i <= maxLoops; i++) {
            const el = document.getElementById(`rewardLoop${i}`);
            loopRewards[i] = el ? el.value : 'none';
        }

        const p_normal_one = p_indiv_percent / 100;
        const p_step4_one = (p_step4_total_percent / 100) / N;
        const p_normal_all = p_normal_one * N;
        const p_step4_all = p_step4_total_percent / 100;
        const p_specific_random_ticket = 1.0 / N;

        let dp = new Array(N + 1).fill(0); dp[0] = 1.0;
        let dpTotal = [1.0], dpSpecific = [1.0];
        let countStep4 = 0, countNormal = normalPulls;
        let randomRewardCount = 0, selectRewardCount = 0;

        // 1. 일반 가챠 시행
        for (let i = 0; i < normalPulls; i++) {
            dp = MathCore.runGacha(dp, p_normal_one);
            dpTotal = MathCore.runTotalCountGacha(dpTotal, p_normal_all);
            dpSpecific = MathCore.runTotalCountGacha(dpSpecific, p_normal_one);
        }

        // 2. 스탭업 가챠 시행
        for (let i = 1; i <= stepPulls; i++) {
            const isStep4 = (i % 40 === 0);
            if (isStep4) countStep4++; else countNormal++;
            const useStep4 = (isStep4 && STEP4_MODE.star3 === 'included');
            const curP1 = useStep4 ? p_step4_one : p_normal_one;
            const curPall = useStep4 ? p_step4_all : p_normal_all;

            dp = MathCore.runGacha(dp, curP1);
            dpTotal = MathCore.runTotalCountGacha(dpTotal, curPall);
            dpSpecific = MathCore.runTotalCountGacha(dpSpecific, curP1);

            if (isStep4) {
                const loopIdx = i / 40;
                const reward = document.getElementById(`rewardLoop${loopIdx}`)?.value || 'none';
                loopRewards[loopIdx] = reward;
                if (reward === 'random' && RANDOM_MODE.star3 === 'included') {
                    dp = MathCore.runRandomPickup(dp);
                    dpTotal = MathCore.runGuaranteedTotal(dpTotal);
                    dpSpecific = MathCore.runTotalCountGacha(dpSpecific, p_specific_random_ticket);
                    randomRewardCount++;
                } else if (reward === 'select') {
                    selectRewardCount++;
                }
            }
        }

        // 3. 천장 처리
        const normalCeiling = Math.floor((normalPulls + stepPulls) / 200);
        const totalCeilingCount = selectRewardCount + normalCeiling;
        if (CEILING_MODE.star3 === 'included') {
            for (let i = 0; i < totalCeilingCount; i++) {
                dp = MathCore.runSelectTicket(dp);
                dpTotal = MathCore.runGuaranteedTotal(dpTotal);
                dpSpecific = MathCore.runGuaranteedTotal(dpSpecific);
            }
        }

        // 4. 결과 데이터 셋업
        this.cache = { N, dp, dpTotal, dpSpecific, context: {
            N, p_indiv_percent, p_step4_total_percent, countNormal, countStep4,
            totalPulls: normalPulls + stepPulls, normalPulls, stepPulls,
            randomRewardCount, totalCeilingCount, selectRewardCount, normalCeiling,
            maxLoops, loopRewards
        }};

        this.saveData({ loopRewards });
        this.renderUI();
    }

    renderUI() {
        // 캐시가 없거나, 현재 3성 메인 탭이 active 상태가 아니면 렌더링하지 않음
        const mainTab = document.getElementById('tab-3star');
        if (!this.cache || (mainTab && !mainTab.classList.contains('active'))) return;

        const { N, dp, dpTotal, dpSpecific, context } = this.cache;
        const activeSubTab = document.querySelector('#sub-tab-system-3star .tab-button.active')?.dataset.tab;
        const ids = { chart: 'resultChart', legend: 'legendList', summary: 'globalSummary', logic: 'globalLogic' };

        if (activeSubTab === 'res-3s-collection') {
            renderResultCommon(N, dp, MathCore.transformData(dp, VIEW_MODE.star3), VIEW_MODE.star3, ids, {
                summary: () => `
                    가챠 횟수 : ${context.totalPulls}회 (일반 ${context.normalPulls} + 스탭업 ${context.stepPulls})<br>
                    랜덤 교환(픽업 티켓) : ${context.randomRewardCount}회<br>
                    천장 교환(셀렉 티켓) : ${context.totalCeilingCount}회 (통합 ${context.normalCeiling} + 스탭업 ${context.selectRewardCount})<br>
                    <strong>올컴플릿 확률 : ${formatProbability(dp[N])}</strong>
                `,
                logic: () => this.generateLogicHtml(context)
            }, this.chartRefs.collection);
        } else if (activeSubTab === 'res-3s-total') {
            let expected = dpTotal.reduce((acc, p, i) => acc + i * p, 0);
            renderTotalBarResult(dpTotal, VIEW_MODE.star3, { chart: 'resultChartTotal3' }, `3성 평균 기대 획득 수: 약 <strong>${expected.toFixed(3)}개</strong>`, this.chartRefs.total);
        } else if (activeSubTab === 'res-3s-specific') {
            let expected = dpSpecific.reduce((acc, p, i) => acc + i * p, 0);
            renderSpecificBarResult(dpSpecific, VIEW_MODE.star3, { chart: 'resultChartSpecific3' }, `특정 픽업(담당) 기대 수: 약 <strong>${expected.toFixed(3)}장</strong>`, this.chartRefs.specific);
        }
    }

    generateLogicHtml(ctx) {
        // 취소선 스타일링 헬퍼
        const strike = (text, condition) => condition ? `<span style="text-decoration:line-through; color:#aaa;">${text}</span>` : text;
        const isRandomOff = RANDOM_MODE.star3 === 'excluded';
        const isCeilingOff = CEILING_MODE.star3 === 'excluded';

        // 주회 보상 텍스트 생성
        let rewardHistory = "";
        for (let i = 1; i <= ctx.maxLoops; i++) {
            let rType = ctx.loopRewards[i];
            let rText = rType === 'random' ? '픽업 티켓' : (rType === 'select' ? '셀렉 티켓' : '없음');
            let text = `[${i}주: ${rText}]`;
            // 아직 도달하지 못한 주차는 취소선
            rewardHistory += strike(text, i * 40 > ctx.stepPulls) + " ";
        }

        const step4IndivProb = (ctx.p_step4_total_percent / ctx.N).toFixed(3);
        const randomDesc = strike("Step4 주회 보상 설정 달성시 1개", isRandomOff);
        const ceilingDesc = strike("Step4 주회 보상 설정 달성시 1개 + 통합 200회당 1개", isCeilingOff);

        return `
            <div class="section-header" style="cursor: pointer;">
                <span class="logic-title">상세 계산 근거</span>
                <button class="toggle-btn">▼</button>
            </div>
            <div class="section-content logic-view">
                <ul class="logic-list">
                    <li><strong>확률 적용:</strong> 개별 ${ctx.p_indiv_percent}% (${ctx.countNormal}회), Step4 개별 ${step4IndivProb}% (${ctx.countStep4}회) 적용</li>
                    <li><strong>주회 보상:</strong> ${rewardHistory}</li>
                    <li><strong>랜덤 교환(픽업 티켓)(${ctx.randomRewardCount}회):</strong> ${randomDesc}</li>
                    <li><strong>천장 교환(셀렉 티켓)(${ctx.totalCeilingCount}회):</strong> ${ceilingDesc}</li>
                    <li><strong>알고리즘:</strong> Coupon Collector 모델 기반 Dynamic Programming</li>
                </ul>
            </div>`;
    }

    applyPreset(settings) {
        if (this.isInitializing) return;
        if (this.inputs['pickupCount']) this.inputs['pickupCount'].setValue(settings.pickupCount, false);
        if (this.inputs['pickupRate']) this.inputs['pickupRate'].setValue(settings.pickupRate, false);
        if (this.inputs['maxLoops']) this.inputs['maxLoops'].setValue(settings.maxLoops, false);
        if (this.inputs['step4Rate']) this.inputs['step4Rate'].setValue(settings.step4Rate, false);
        if (this.inputs['normalPulls']) this.inputs['normalPulls'].setValue(0, false);
        if (this.inputs['stepPulls']) this.inputs['stepPulls'].setValue(0, false);
        this.updateLoopSettings(settings.rewards || {});
        this.calculate();
        this.renderUI();
    }
}