// DP: 일반 가챠 시행
export function runGacha(currentDP, probPerCard) {
    const N = currentDP.length - 1;
    let nextDP = new Array(N + 1).fill(0);
    for (let k = 0; k <= N; k++) {
        if (currentDP[k] === 0) continue;
        if (k === N) nextDP[k] += currentDP[k];
        else {
            let p_new = (N - k) * probPerCard;
            if (p_new > 1) p_new = 1;
            let p_stay = 1.0 - p_new;
            nextDP[k] += currentDP[k] * p_stay;
            nextDP[k+1] += currentDP[k] * p_new;
        }
    }
    return nextDP;
}

// DP: 선택권 (무조건 +1)
export function runSelectTicket(currentDP) {
    const N = currentDP.length - 1;
    let nextDP = new Array(N + 1).fill(0);
    for (let k = 0; k <= N; k++) {
        if (currentDP[k] === 0) continue;
        if (k < N) nextDP[k+1] += currentDP[k];
        else nextDP[N] += currentDP[k];
    }
    return nextDP;
}

// DP: 랜덤 확정 (중복 가능)
export function runRandomPickup(currentDP) {
    const N = currentDP.length - 1;
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

// 합성곱 (Convolution)
export function convolveDistributions(dpA, dpB) {
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

// 데이터 변환 (누적 확률 등)
export function transformData(dp, mode) {
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

// 총 획득 수 DP: 일반/스탭업 확률 시행
// dp[k] = 총 k개 먹을 확률
export function runTotalCountGacha(currentDP, p_total) {
    const size = currentDP.length;
    // 최대 갯수는 시행 횟수만큼 늘어나므로 배열 크기 확장
    // (여기서는 동적 배열로 처리)
    let nextDP = new Array(size + 1).fill(0);
    
    for (let k = 0; k < size; k++) {
        if (currentDP[k] === 0) continue;
        
        // 획득 실패 (개수 유지)
        nextDP[k] += currentDP[k] * (1 - p_total);
        
        // 획득 성공 (개수 +1)
        nextDP[k+1] += currentDP[k] * p_total;
    }
    return nextDP;
}

// 총 획득 수 DP: 확정 획득 (무조건 +1)
export function runGuaranteedTotal(currentDP) {
    const size = currentDP.length;
    let nextDP = new Array(size + 1).fill(0);
    
    for (let k = 0; k < size; k++) {
        if (currentDP[k] === 0) continue;
        // 무조건 1개 증가 (Shift Right)
        nextDP[k+1] = currentDP[k];
    }
    return nextDP;
}

// 특정 부분 집합(Subset) 랜덤권 로직
// currentDP: 내 타겟(M개)에 대한 수집 상태 배열
// totalN: 전체 픽업 캐릭터 수 (Pool Size)
export function runRandomSubset(currentDP, totalN) {
    const M = currentDP.length - 1; // 타겟의 수
    let nextDP = new Array(M + 1).fill(0);

    for (let k = 0; k <= M; k++) {
        if (currentDP[k] === 0) continue;
        
        // 이미 타겟을 다 모았으면 유지
        if (k === M) {
            nextDP[M] += currentDP[k];
        } else {
            // 새로운 타겟 획득 확률: (남은 타겟 수) / (전체 풀 크기)
            let p_new = (M - k) / totalN;
            
            // 기존 상태 유지(꽝 or 중복) 확률
            let p_stay = 1.0 - p_new;

            nextDP[k] += currentDP[k] * p_stay;
            nextDP[k+1] += currentDP[k] * p_new;
        }
    }
    return nextDP;
}