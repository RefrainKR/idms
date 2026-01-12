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

        this.isWorstMode = false;
    }

    init() {
        super.initInputs((savedData) => {
            this.updateLoopSettings(savedData.loopRewards || {});
            
            // 프리셋 버튼 동적 생성
            this.renderPresetButtons();
            
            // 타겟 수 입력 이벤트 바인딩 (기존 코드)
            const targetInput = document.getElementById('targetCount'); // ID 변경 반영
            if (targetInput) {
                targetInput.addEventListener('change', () => {
                    const N = this.inputs['pickupCount'].getValue();
                    let val = parseInt(targetInput.value) || 0;
                    if (val > N) { val = N; targetInput.value = N; }
                    this.renderUI();
                });
            }

            // [신규] 효율 모드 토글 버튼 이벤트
            const toggleBtn = document.getElementById('btnToggleEfficiencyMode');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => {
                    this.isWorstMode = !this.isWorstMode;
                    this.updateEfficiencyToggleBtn(toggleBtn);
                    this.renderEfficiencyComparison(); // 차트 재렌더링
                });
            }
        });
    }

    // 버튼 UI 업데이트 헬퍼
    updateEfficiencyToggleBtn(btn) {
        if (this.isWorstMode) {
            btn.textContent = "실패(%)";
            btn.classList.remove('btn-active');
            btn.style.borderColor = '#dc3545';
            btn.style.color = '#dc3545';
            btn.style.backgroundColor = '#fff';
        } else {
            btn.textContent = "성공(%)";
            btn.classList.add('btn-active');
            btn.style.borderColor = '';
            btn.style.color = '';
            btn.style.backgroundColor = '';
        }
    }


    renderPresetButtons() {
        const container = document.getElementById('star3PresetContainer');
        if (!container || !this.config.PRESETS) return;

        container.innerHTML = ''; // 기존 내용 초기화

        this.config.PRESETS.forEach(preset => {
            const btn = document.createElement('button');
            btn.className = 'preset-btn';
            btn.textContent = preset.label;
            btn.title = preset.title || `${preset.label} 설정 적용`;
            
            // 클릭 이벤트 연결
            btn.addEventListener('click', () => {
                this.applyPreset(preset.settings);
            });

            container.appendChild(btn);
        });
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
            }
        }

        // 캐시 저장 (N, M 모두 저장)
        this.cache = { N, M, dp, dpTotal, context: {
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

        const { N, M, dp, dpTotal, context } = this.cache;
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
                 <span style="font-size:0.85rem; color:#666;">* 저격 픽업 ${M}개의 획득 개수 합계입니다.</span><br>
                 <span style="font-size:0.85rem; color:#dc3545;">(천장 버튼이 활성화 된 경우 천장은 무조건 저격 픽업을 가져오는 것으로 설정되어 있습니다.)</span>`,
                this.chartRefs.total);
        } else if (activeSubTab === 'res-3s-efficiency') {
            this.renderEfficiencyComparison();
        }
    }

    renderEfficiencyComparison() {
        const N = this.inputs['pickupCount'].getValue();
        // [수정] 저격 픽업 수 M 가져오기
        let targetVal = this.inputs['targetCount'].getValue();
        let M = (targetVal === 0 || !targetVal) ? N : targetVal;
        if (M > N) M = N;

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
        
        // [수정] 타겟 확률 정의
        const p_target_one = p_indiv; // 일반 개별 확률
        const p_step4_target_one = (p_step4_total / N); // Step4 개별 확률

        for (let pulls = 0; pulls <= 200; pulls++) {
            labels.push(pulls);

            // 1. 일반 가챠 시뮬레이션
            // 배열 크기를 M+1로 설정 (저격 대상 수집 상태)
            let dpN = new Array(M + 1).fill(0); dpN[0] = 1.0;
            
            // 일반 가챠에서는 (M-k) * p_target_one 확률로 수집
            for (let i = 0; i < pulls; i++) dpN = MathCore.runGacha(dpN, p_target_one);
            
            // 일반 천장 (200회당 1개)
            if (CEILING_MODE.star3 === 'included') {
                const nCeil = Math.floor(pulls / 200);
                for (let i = 0; i < nCeil; i++) dpN = MathCore.runSelectTicket(dpN);
            }
            // [결과] M명 수집 완료 확률
            normalData.push((dpN[M] * 100).toFixed(2));

            // 2. 스탭업 가챠 시뮬레이션
            let dpS = new Array(M + 1).fill(0); dpS[0] = 1.0;
            
            for (let i = 1; i <= pulls; i++) {
                const isStep4 = (i % 40 === 0);
                const curLoop = Math.ceil(i / 40);
                const isWithinStepup = (i <= stepupLimit);
                const useStep4 = (isStep4 && isWithinStepup && STEP4_MODE.star3 === 'included');
                
                const p = useStep4 ? p_step4_target_one : p_target_one;
                dpS = MathCore.runGacha(dpS, p);

                if (isStep4 && isWithinStepup) {
                    const reward = loopRewards[curLoop];
                    if (reward === 'random' && RANDOM_MODE.star3 === 'included') {
                        // [핵심] 전체 N명 중 저격 대상 M명 수집 (runRandomSubset)
                        dpS = MathCore.runRandomSubset(dpS, N);
                    }
                    else if (reward === 'select' && CEILING_MODE.star3 === 'included') {
                        dpS = MathCore.runSelectTicket(dpS);
                    }
                }
            }
            
            if (CEILING_MODE.star3 === 'included') {
                const sCeil = Math.floor(pulls / 200);
                for (let i = 0; i < sCeil; i++) dpS = MathCore.runSelectTicket(dpS);
            }
            // [결과] M명 수집 완료 확률
            stepupData.push((dpS[M] * 100).toFixed(2));
        }

        this.drawEfficiencyChart(labels, normalData, stepupData, stepupLimit);
    }

    drawEfficiencyChart(labels, normalData, stepupData, limit) {
        // [핵심] 모드에 따라 데이터 변환
        let finalStepupData = stepupData;
        let finalNormalData = normalData;
        
        if (this.isWorstMode) {
            // 실패 확률 = 100 - 성공 확률
            finalStepupData = stepupData.map(v => (100 - parseFloat(v)).toFixed(2));
            finalNormalData = normalData.map(v => (100 - parseFloat(v)).toFixed(2));
        }

        // 색상 설정 (성공: 초록, 실패: 빨강)
        const mainColor = this.isWorstMode ? '#dc3545' : '#45a247'; // 빨강 / 초록
        const subColor = this.isWorstMode ? 'rgba(220, 53, 69, 0.1)' : 'rgba(69, 162, 71, 0.1)';
        const normalColor = '#283c86'; // 일반 가챠는 파란색 유지

        // 포인트 스타일 함수들 (색상 변수 적용)
        const getPointRadius = (ctx) => {
            const idx = ctx.dataIndex;
            if (idx === 0) return 4;
            if (idx % 40 === 0) return 7;
            if (idx % 10 === 0) return 5;
            return 0;
        };
        const getHitRadius = (ctx) => {
            const idx = ctx.dataIndex;
            // 10단위일 때만 터치 영역을 아주 넓게(30px) 잡음 -> 손가락으로 대충 눌러도 인식됨
            // 1단위일 때는 0 -> 절대 인식 안 됨
            return (idx % 10 === 0) ? 30 : 0; 
        };

        const datasets = [
            {
                label: '스탭업 가챠',
                data: finalStepupData,
                borderColor: mainColor,
                backgroundColor: subColor,
                fill: true,
                tension: 0.1,
                pointRadius: getPointRadius,
                pointHoverRadius: (ctx) => (ctx.dataIndex % 10 === 0 ? 8 : 0), 
                pointHitRadius: getHitRadius, 
                pointBackgroundColor: (ctx) => (ctx.dataIndex % 40 === 0 ? mainColor : '#fff'),
                pointBorderColor: mainColor,
                borderWidth: 2,
            },
            {
                label: '일반 가챠',
                data: finalNormalData,
                borderColor: normalColor,
                borderDash: [5, 5],
                tension: 0.1,
                pointRadius: (ctx) => (ctx.dataIndex % 10 === 0 ? 3.5 : 0),
                pointHoverRadius: (ctx) => (ctx.dataIndex % 10 === 0 ? 5.5 : 0),
                pointHitRadius: getHitRadius,
                pointBackgroundColor: normalColor,
                borderWidth: 1.5
            }
        ];

        renderLineChart('efficiencyChart', labels, datasets, this.chartRefs.efficiency);

        // 요약 텍스트 업데이트 (Worst 모드 메시지 추가)
        const summaryEl = document.getElementById('globalSummary');
        if (summaryEl) {
            const limitIdx = limit; 
            const gap = Math.abs(finalStepupData[limitIdx] - finalNormalData[limitIdx]).toFixed(1);
            
            // 모드에 따른 메시지 분기
            if (this.isWorstMode) {
                 summaryEl.innerHTML = `
                    <strong>리스크(실패) 분석 결과</strong><br>
                    최대 효율 지점(${limit}회)에서 스탭업 가챠를 돌릴 경우, 일반 가챠보다 실패 확률이 
                    <span style="color:#dc3545; font-weight:bold;">약 ${gap}%p</span> 더 낮습니다.<br>
                    <span style="font-size:0.85rem; color:#666;">* 그래프가 낮을수록 더 안전함(실패 확률이 낮음)을 의미합니다.</span>
                `;
            } else {
                 summaryEl.innerHTML = `
                    <strong>효율(성공) 분석 결과</strong><br>
                    최대 효율 지점(${limit}회)에서 스탭업 가챠의 성공 확률이 일반 가챠보다 
                    <span style="color:#45a247; font-weight:bold;">약 ${gap}%p</span> 더 높습니다.<br>
                    <span style="font-size:0.85rem; color:#666;">* ${limit}회 이후부터는 일반 가챠와 동일한 확률 곡선을 그리게 됩니다.</span>
                `;
            }
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