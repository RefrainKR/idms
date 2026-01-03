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