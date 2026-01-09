import { BaseGachaModule } from './BaseGachaModule.js';
import { CONFIG } from '../config.js';
import { VIEW_MODE, CEILING_MODE, RANDOM_MODE, STEP4_MODE } from '../state.js';
import * as MathCore from '../lib/math/core.js';
import { renderResultCommon, renderTotalBarResult, renderSpecificBarResult } from '../lib/ui/uiHelper.js';
import { renderLineChart } from '../lib/ui/chartHandler.js';
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

        const N = this.inputs['pickupCount'].getValue(); // 전체 픽업 수
        
        // [수정] 저격 픽업 수 처리 로직 (0 또는 비어있으면 전체 N으로 간주)
        let targetVal = this.inputs['targetCount'].getValue();
        let M = (targetVal === 0 || !targetVal) ? N : targetVal;
        
        // 입력값 유효성 보정 (M은 N보다 클 수 없음)
        if (M > N) {
            M = N;
            this.inputs['targetCount'].setValue(N, false);
        }

        const p_indiv_percent = this.inputs['pickupRate'].getValue();
        const p_step4_total_percent = this.inputs['step4Rate'].getValue();
        const normalPulls = this.inputs['normalPulls'].getValue();
        const stepPulls = this.inputs['stepPulls'].getValue();
        const maxLoops = this.inputs['maxLoops'].getValue();

        // 루프 보상 읽기
        let loopRewards = {};
        for (let i = 1; i <= maxLoops; i++) {
            const el = document.getElementById(`rewardLoop${i}`);
            loopRewards[i] = el ? el.value : 'none';
        }

        const p_normal_one = p_indiv_percent / 100;
        const p_step4_one = (p_step4_total_percent / 100) / N; // 개별 확률은 항상 N 기준
        
        // DP 배열 초기화: 저격 대상 M명 기준
        let dp = new Array(M + 1).fill(0); dp[0] = 1.0; 
        let dpTotal = [1.0]; 
        let dpSpecific = [1.0]; 

        let countStep4 = 0, countNormal = normalPulls;
        let randomRewardCount = 0, selectRewardCount = 0;

        // 1. 일반 가챠
        // 저격 대상 M명 중 하나가 나올 확률 = p_normal_one
        // 총 획득 대상 확률 = p_normal_one * M
        const p_target_any_normal = p_normal_one * M;

        for (let i = 0; i < normalPulls; i++) {
            // 수집: (M-k) * p_one 확률로 새로운 저격 대상 획득
            dp = MathCore.runGacha(dp, p_normal_one);
            dpTotal = MathCore.runTotalCountGacha(dpTotal, p_target_any_normal);
            dpSpecific = MathCore.runTotalCountGacha(dpSpecific, p_normal_one);
        }

        // 2. 스탭업 가챠
        for (let i = 1; i <= stepPulls; i++) {
            const isStep4 = (i % 40 === 0);
            if (isStep4) countStep4++; else countNormal++;
            
            const useStep4 = (isStep4 && STEP4_MODE.star3 === 'included');
            const curP1 = useStep4 ? p_step4_one : p_normal_one;
            const curPAny = curP1 * M;

            dp = MathCore.runGacha(dp, curP1);
            dpTotal = MathCore.runTotalCountGacha(dpTotal, curPAny);
            dpSpecific = MathCore.runTotalCountGacha(dpSpecific, curP1);

            if (isStep4) {
                const loopIdx = i / 40;
                const reward = loopRewards[loopIdx];
                
                if (reward === 'random') {
                    randomRewardCount++;
                    if (RANDOM_MODE.star3 === 'included') {
                        // [핵심] 랜덤권: 전체 N명 중 저격 대상 M명 수집 확률 (runRandomSubset)
                        dp = MathCore.runRandomSubset(dp, N);
                        // 총 획득: M/N 확률로 저격 대상 획득
                        dpTotal = MathCore.runTotalCountGacha(dpTotal, M / N);
                        dpSpecific = MathCore.runTotalCountGacha(dpSpecific, 1.0 / N);
                    }
                } else if (reward === 'select') {
                    selectRewardCount++;
                }
            }
        }

        // 3. 천장 처리
        // [수정] 변수 선언 위치 문제 해결 (미리 계산)
        const normalCeiling = Math.floor((normalPulls + stepPulls) / 200);
        const totalCeilingCount = selectRewardCount + normalCeiling;

        if (CEILING_MODE.star3 === 'included') {
            for (let i = 0; i < totalCeilingCount; i++) {
                dp = MathCore.runSelectTicket(dp); // 없는 저격 대상 확정
                dpTotal = MathCore.runGuaranteedTotal(dpTotal); // 저격 대상 수 +1
                dpSpecific = MathCore.runGuaranteedTotal(dpSpecific); // 특정 1명 +1
            }
        }

        // 캐시 저장 (N, M 모두 저장)
        this.cache = { N, M, dp, dpTotal, dpSpecific, context: {
            N, M, p_indiv_percent, p_step4_total_percent, countNormal, countStep4,
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

        const { N, M, dp, dpTotal, dpSpecific, context } = this.cache;
        const activeSubTab = document.querySelector('#sub-tab-system-3star .tab-button.active')?.dataset.tab;
        const ids = { chart: 'resultChart', legend: 'legendList', summary: 'globalSummary', logic: 'globalLogic' };

        if (activeSubTab === 'res-3s-collection') {
            renderResultCommon(M, dp, MathCore.transformData(dp, VIEW_MODE.star3), VIEW_MODE.star3, ids, {
                summary: () => `
                    저격(${M}개) 올컴플릿 확률 : <strong>${formatProbability(dp[M])}</strong><br>
                    <span style="font-size:0.85rem; color:#666;">* 저격 픽업 ${M}개를 모두 모을 확률입니다.</span>
                `,
                logic: () => this.generateLogicHtml(context)
            }, this.chartRefs.collection);
        } 
        else if (activeSubTab === 'res-3s-total') {
            let expected = dpTotal.reduce((acc, p, i) => acc + i * p, 0);
            renderTotalBarResult(dpTotal, VIEW_MODE.star3, { chart: 'resultChartTotal3' }, 
                `저격(${M}개) 총 획득 기대 수: 약 <strong>${expected.toFixed(3)}개</strong><br>
                 <span style="font-size:0.85rem; color:#666;">* 저격 픽업 ${M}개의 획득 개수 합계입니다.</span>`, 
                this.chartRefs.total);
        } else if (activeSubTab === 'res-3s-specific') {
            let expected = dpSpecific.reduce((acc, p, i) => acc + i * p, 0);
            renderSpecificBarResult(dpSpecific, VIEW_MODE.star3, { chart: 'resultChartSpecific3' }, `특정 픽업 기대 수: 약 <strong>${expected.toFixed(3)}장</strong><br><span style="font-size:0.85rem; color:#dc3545;">(천장 버튼이 활성화 된 경우 천장은 무조건 특정 픽업을 가져오는 것으로 설정되어 있습니다.)</span>`, this.chartRefs.specific);
        } else if (activeSubTab === 'res-3s-efficiency') {
            this.renderEfficiencyComparison();
        }
    }

    renderEfficiencyComparison() {
        const N = this.inputs['pickupCount'].getValue();
        const p_indiv = this.inputs['pickupRate'].getValue() / 100;
        const p_step4_total = this.inputs['step4Rate'].getValue() / 100;
        const maxLoops = this.inputs['maxLoops'].getValue();
        const stepupLimit = maxLoops * 40;

        const loopRewards = {};
        for (let i = 1; i <= maxLoops; i++) {
            loopRewards[i] = document.getElementById(`rewardLoop${i}`)?.value || 'none';
        }

        const labels = [];
        const normalData = [];
        const stepupData = [];
        
        // 0회 ~ 200회 시뮬레이션
        for (let pulls = 0; pulls <= 200; pulls++) {
            labels.push(pulls);

            // 1. 일반 가챠 계산
            let dpN = new Array(N + 1).fill(0); dpN[0] = 1.0;
            for (let i = 0; i < pulls; i++) dpN = MathCore.runGacha(dpN, p_indiv);
            
            // [수정] 천장 모드가 'included'일 때만 일반 천장(200회) 적용
            if (CEILING_MODE.star3 === 'included') {
                const nCeil = Math.floor(pulls / 200);
                for (let i = 0; i < nCeil; i++) dpN = MathCore.runSelectTicket(dpN);
            }
            
            normalData.push((dpN[N] * 100).toFixed(2));

            // 2. 스탭업 가챠 계산
            let dpS = new Array(N + 1).fill(0); dpS[0] = 1.0;
            for (let i = 1; i <= pulls; i++) {
                const isStep4 = (i % 40 === 0);
                const curLoop = Math.ceil(i / 40);
                const isWithinStepup = (i <= stepupLimit);
                const useStep4 = (isStep4 && isWithinStepup && STEP4_MODE.star3 === 'included');
                
                const p = useStep4 ? (p_step4_total / N) : p_indiv;
                dpS = MathCore.runGacha(dpS, p);

                if (isStep4 && isWithinStepup) {
                    const reward = loopRewards[curLoop];
                    if (reward === 'random' && RANDOM_MODE.star3 === 'included') dpS = MathCore.runRandomPickup(dpS);
                    // [수정] 천장 모드가 'included'일 때만 주회 보상(셀렉) 적용
                    else if (reward === 'select' && CEILING_MODE.star3 === 'included') dpS = MathCore.runSelectTicket(dpS);
                }
            }
            
            // [수정] 천장 모드가 'included'일 때만 스탭업 중 일반 천장(200회) 적용
            if (CEILING_MODE.star3 === 'included') {
                const sCeil = Math.floor(pulls / 200);
                for (let i = 0; i < sCeil; i++) dpS = MathCore.runSelectTicket(dpS);
            }
            
            stepupData.push((dpS[N] * 100).toFixed(2));
        }

        this.drawEfficiencyChart(labels, normalData, stepupData, stepupLimit);
    }

    drawEfficiencyChart(labels, normalData, stepupData, limit) {
        // [포인트 크기] 0회(3), 40배수(6), 10배수(3), 나머지(0)
        const getPointRadius = (ctx) => {
            const idx = ctx.dataIndex;
            if (idx === 0) return 3;
            if (idx % 40 === 0) return 6;
            if (idx % 10 === 0) return 3;
            return 0; // 평소에는 점을 숨김
        };

        // [호버 효과] 10배수일 때만 호버 원을 그림 (나머지는 0)
        const getHoverRadius = (ctx) => {
            const idx = ctx.dataIndex;
            return (idx % 10 === 0) ? 6 : 0; 
        };

        const datasets = [
            {
                label: '스탭업 가챠',
                data: stepupData,
                borderColor: '#45a247',
                backgroundColor: 'rgba(69, 162, 71, 0.1)',
                fill: true,
                tension: 0.1, // 계단 현상을 잘 표현하기 위해 텐션을 낮춤
                
                pointRadius: getPointRadius,
                // [핵심] 10단위가 아니면 마우스를 올려도 점이 커지지 않음
                pointHoverRadius: getHoverRadius, 
                
                pointBackgroundColor: (ctx) => (ctx.dataIndex % 40 === 0 ? '#45a247' : '#fff'),
                pointBorderColor: '#45a247',
                borderWidth: 2
            },
            {
                label: '일반 가챠',
                data: normalData,
                borderColor: '#283c86',
                borderDash: [5, 5],
                tension: 0.1,
                
                pointRadius: (ctx) => (ctx.dataIndex % 10 === 0 ? 2 : 0),
                // [핵심] 일반 가챠 라인도 동일하게 적용
                pointHoverRadius: getHoverRadius,
                
                pointBackgroundColor: '#283c86',
                borderWidth: 1.5
            }
        ];

        renderLineChart('efficiencyChart', labels, datasets, this.chartRefs.efficiency);

        // 요약 텍스트 (limit 지점 데이터 찾기)
        const summaryEl = document.getElementById('globalSummary');
        if (summaryEl) {
            // 데이터가 1회 단위이므로 limit(예: 80)을 그대로 인덱스로 사용 가능
            const limitIdx = limit; 
            const gap = (stepupData[limitIdx] - normalData[limitIdx]).toFixed(1);
            
            summaryEl.innerHTML = `
                <strong>효율 분석 결과</strong><br>
                최대 효율 지점(${limit}회)에서 스탭업 가챠의 성공 확률이 일반 가챠보다 
                <span style="color:#45a247; font-weight:bold;">약 ${gap}%p</span> 더 높습니다.<br>
                <span style="font-size:0.85rem; color:#dc3545;">검증이 아직 이루어지지 않은 기능입니다.</span><br>
                <span style="font-size:0.9rem; color:#666;">* 올컴플릿을 기준으로 한 그래프입니다.</span><br>
                <span style="font-size:0.9rem; color:#666;">* ${limit}회 이후부터는 일반 가챠와 동일한 확률 곡선을 그리게 됩니다.</span>
            `;
        }

        // 2. [수정] 상세 계산 근거 영역 숨기기
        const logicEl = document.getElementById('globalLogic');
        if (logicEl) {
            logicEl.style.display = 'none';
            logicEl.innerHTML = ''; // 내용도 비워둠
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