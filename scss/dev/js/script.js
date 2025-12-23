import { InputNumberElement } from './lib/utils/InputNumberElement.js';

// Chart.js 플러그인 등록
Chart.register(ChartDataLabels);
let myChart = null;
let stepPullsInputInstance = null; // 동적 제어를 위해 인스턴스 저장

// 페이지 로드 시 초기화
window.onload = function() {
    initInputElements();
    updateLoopSettings(); 
    calculate();
};

function initInputElements() {
    // 1. 픽업 개수 (Min 1, Max 100, Default 2)
    new InputNumberElement(
        document.getElementById('pickupCount'), 
        1, 100, 2, 
        calculate
    );

    // 2. 개별 픽업 확률 (Min 0, Max 100, Default 1)
    new InputNumberElement(
        document.getElementById('pickupRate'), 
        0, 100, 1, 
        calculate
    );

    // 3. 최대 주회 수 (Min 1, Max 10, Default 3) -> 변경 시 updateLoopSettings 호출
    new InputNumberElement(
        document.getElementById('maxLoops'), 
        1, 10, 3, 
        () => { updateLoopSettings(); } 
    );

    // 4. Step4 확률 (Min 0, Max 100, Default 20)
    new InputNumberElement(
        document.getElementById('step4Rate'), 
        0, 100, 20, 
        calculate
    );

    // 5. 일반 가챠 횟수 (Min 0, Max 9999, Default 0)
    new InputNumberElement(
        document.getElementById('normalPulls'), 
        0, 9999, 0, 
        calculate
    );

    // 6. 스탭업 가챠 횟수 (Min 0, Max 가변, Default 0)
    // 인스턴스를 변수에 저장해두어 나중에 setMax를 호출할 수 있게 함
    stepPullsInputInstance = new InputNumberElement(
        document.getElementById('stepPulls'), 
        0, 120, 0, // 초기 Max는 120이지만 updateLoopSettings에서 바로 갱신됨
        calculate
    );
}

// 최대 주회 수 변경 시 보상 설정 UI 갱신 및 Max 값 변경
function updateLoopSettings() {
    const maxLoopsInput = document.getElementById('maxLoops');
    const maxLoops = parseInt(maxLoopsInput.value) || 1;
    const container = document.getElementById('loopRewardsArea');
    
    // 기존 선택값 저장
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
        select.onchange = calculate; 

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

        if (savedRewards[i]) {
            select.value = savedRewards[i];
        } else {
            select.value = 'none';
        }
        
        wrapper.appendChild(label);
        wrapper.appendChild(select);
        container.appendChild(wrapper);
    }

    // 스탭업 가챠 최대 횟수(Max) 갱신 로직
    const maxPulls = maxLoops * 40;
    
    if (stepPullsInputInstance) {
        stepPullsInputInstance.setMax(maxPulls);
    }
    
    // 라벨 텍스트 업데이트
    document.querySelector('label[for="stepPulls"]').textContent = `스탭업 가챠 횟수 (Max ${maxPulls})`;
    
    calculate();
}

// 핵심 계산 로직 (InputNumberElement가 값을 관리하므로 DOM에서 바로 읽어도 안전함)
function calculate() {
    const N = parseInt(document.getElementById('pickupCount').value) || 0;
    const p_indiv_percent = parseFloat(document.getElementById('pickupRate').value) || 0;
    let p_step4_total_percent = parseFloat(document.getElementById('step4Rate').value) || 0;
    const normalPulls = parseInt(document.getElementById('normalPulls').value) || 0;
    
    const maxLoops = parseInt(document.getElementById('maxLoops').value) || 1;
    // const maxStepPulls = maxLoops * 40; // InputNumberElement가 처리하므로 불필요
    let stepPulls = parseInt(document.getElementById('stepPulls').value) || 0;

    if (N <= 0) return;
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
            if (k === N) {
                nextDP[k] += currentDP[k];
            } else {
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
            if (k === N) {
                nextDP[N] += currentDP[k];
            } else {
                let p_new = (N - k) / N;
                let p_dupe = k / N;
                nextDP[k] += currentDP[k] * p_dupe;
                nextDP[k+1] += currentDP[k] * p_new;
            }
        }
        return nextDP;
    }

    // 1. 일반 가챠
    for (let i = 0; i < normalPulls; i++) dp = runGacha(dp, p_normal_one);

    // 2. 스탭업 가챠
    for (let i = 1; i <= stepPulls; i++) {
        let isStep4 = (i % 40 === 0); 
        
        if (isStep4) countStep4++;
        else countNormal++;

        let currentProb = isStep4 ? p_step4_one : p_normal_one;
        dp = runGacha(dp, currentProb);
        
        if (i % 40 === 0) {
            let currentLoop = i / 40;
            let rewardType = loopRewards[currentLoop];
            
            if (rewardType === 'random') {
                dp = runRandomPickup(dp);
                randomRewardCount++;
            } else if (rewardType === 'select') {
                dp = runSelectTicket(dp);
                selectRewardCount++;
            }
        }
    }

    // 3. 통합 천장
    let totalPulls = normalPulls + stepPulls;
    let normalCeiling = Math.floor(totalPulls / 200);
    for (let i = 0; i < normalCeiling; i++) dp = runSelectTicket(dp);

    let totalCeilingCount = selectRewardCount + normalCeiling;

    // 결과 데이터 구성
    let labels = [];
    let data = [];
    let backgroundColors = [];

    for (let k = 0; k <= N; k++) {
        labels.push(`${k}픽업`);
        let percent = (dp[k] * 100).toFixed(2);
        data.push(percent);
        
        if (k === N) backgroundColors.push('#45a247');
        else {
            let opacity = 0.3 + (0.7 * (k / N));
            backgroundColors.push(`rgba(40, 60, 134, ${opacity})`);
        }
    }

    const allCollectedProb = (dp[N] * 100).toFixed(2);

    document.getElementById('summaryText').innerHTML = `
        <strong>분석 결과</strong><br>
        가챠 횟수 : ${totalPulls}회 (일반 ${normalPulls} + 스탭업 ${stepPulls})<br>
        랜덤 교환 : ${randomRewardCount}회<br>
        천장 교환 : ${totalCeilingCount}회 (보상 ${selectRewardCount} + 통합 ${normalCeiling})<br>
        <strong>올컴플릿 확률 : ${allCollectedProb}%</strong>
    `;

    updateLegend(labels, data, backgroundColors);
    renderChart(labels, data, backgroundColors);

    // 상세 근거 출력
    const logicDiv = document.getElementById('logicDetailText');
    logicDiv.style.display = 'block';

    let zeroPickupDesc = "";
    if (randomRewardCount > 0 || totalCeilingCount > 0) {
        zeroPickupDesc = "주회 보상 또는 천장으로 인해 0픽업은 불가능(0%)합니다.";
    } else {
        zeroPickupDesc = `총 ${totalPulls}회의 가챠가 모두 픽업을 빗나갈 확률입니다.`;
    }
    
    let rewardHistoryHtml = "";
    for(let i=1; i<=maxLoops; i++) {
        let rType = loopRewards[i];
        let rText = rType === 'none' ? '없음' : (rType === 'random' ? '랜덤' : '천장(선택)');
        if (i * 40 <= stepPulls) {
            rewardHistoryHtml += `[${i}주: ${rText}] `;
        } else {
            rewardHistoryHtml += `<span style="color:#aaa;">[${i}주: ${rText}]</span> `;
        }
    }

    logicDiv.innerHTML = `
        <span class="logic-title">상세 계산 근거</span>
        <ul class="logic-list">
            <li><strong>확률 적용:</strong> 기본 확률(${p_indiv_percent}%) ${countNormal}회, Step4 개별 확률(${(p_step4_total_percent/N).toFixed(2)}%) ${countStep4}회 적용되었습니다.</li>
            <li><strong>주회 보상 설정:</strong> ${rewardHistoryHtml}</li>
            <li><strong>랜덤 교환(${randomRewardCount}회):</strong> 보유 수에 따라 중복(상태유지) 또는 신규획득(수집+1) 확률이 적용됩니다.</li>
            <li><strong>천장 교환(${totalCeilingCount}회):</strong> 없는 픽업을 확정 획득합니다. (주회 보상 + 통합 200연 천장 포함)</li>
            <li><strong>0픽업 확률:</strong> ${zeroPickupDesc}</li>
        </ul>
    `;
}

function updateLegend(labels, data, colors) {
    const listContainer = document.getElementById('legendList');
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

function renderChart(labels, data, colors) {
    const ctx = document.getElementById('resultChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
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
                        if (value < 5) return null;
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