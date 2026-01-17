import { PROBABILITY_MODE } from './GachaConstants.js';

/**
 * js/core/ProbabilityEngine.js
 * 가챠 확률 계산을 담당하는 순수 수학 클래스 (Static)
 */
export class ProbabilityEngine {
    // ==========================================
    // 1. 상태 전이 (Transition) - 수집(Collection)
    // ==========================================

    /**
     * 일반 가챠 시행 (수집 확률 DP)
     */
    static runSinglePull(dp, prob) {
        const size = dp.length - 1; 
        let nextDP = new Array(size + 1).fill(0);

        for (let k = 0; k <= size; k++) {
            if (dp[k] === 0) continue;
            
            if (k === size) {
                nextDP[k] += dp[k]; 
            } else {
                let p_new = (size - k) * prob;
                if (p_new > 1) p_new = 1; // 확률 보정
                
                nextDP[k] += dp[k] * (1.0 - p_new);
                nextDP[k + 1] += dp[k] * p_new;
            }
        }
        return nextDP;
    }

    /**
     * 확정권/천장 시행 (무조건 1개 획득)
     * k -> k+1로 확률 100% 이동
     */
    static runGuaranteedPull(dp) {
        const size = dp.length - 1;
        let nextDP = new Array(size + 1).fill(0);

        for (let k = 0; k <= size; k++) {
            if (dp[k] === 0) continue;
            
            // 아직 덜 모았으면 +1
            if (k < size) {
                nextDP[k + 1] += dp[k];
            } 
            // 이미 다 모았으면 유지
            else {
                nextDP[size] += dp[k];
            }
        }
        return nextDP;
    }

    /**
     * 랜덤 티켓 시행
     */
    static runRandomTicket(dp, poolSize) {
        const size = dp.length - 1; 
        let nextDP = new Array(size + 1).fill(0);

        for (let k = 0; k <= size; k++) {
            if (dp[k] === 0) continue;
            if (k === size) {
                nextDP[size] += dp[k];
            } else {
                let p_new = (size - k) / poolSize;
                nextDP[k] += dp[k] * (1.0 - p_new);
                nextDP[k + 1] += dp[k] * p_new;
            }
        }
        return nextDP;
    }

    // ==========================================
    // 2. 총 획득 수 계산
    // ==========================================

    static accumulateCountProb(dp, prob) {
        const size = dp.length;
        let nextDP = new Array(size + 1).fill(0);

        for (let k = 0; k < size; k++) {
            if (dp[k] === 0) continue;
            nextDP[k] += dp[k] * (1 - prob);
            nextDP[k + 1] += dp[k] * prob;
        }
        return nextDP;
    }

    static accumulateCountGuaranteed(dp) {
        const size = dp.length;
        let nextDP = new Array(size + 1).fill(0);
        for (let k = 0; k < size; k++) {
            if (dp[k] === 0) continue;
            nextDP[k + 1] = dp[k];
        }
        return nextDP;
    }

    // ==========================================
    // 3. 고급 연산 & 유틸
    // ==========================================

    static convolve(dpA, dpB) {
        const lenA = dpA.length;
        const lenB = dpB.length;
        let result = new Array(lenA + lenB - 1).fill(0);

        for (let i = 0; i < lenA; i++) {
            if (dpA[i] === 0) continue;
            for (let j = 0; j < lenB; j++) {
                if (dpB[j] === 0) continue;
                result[i + j] += dpA[i] * dpB[j];
            }
        }
        return result;
    }

    static transformData(dp, mode) {
        if (mode === PROBABILITY_MODE.INDIVIDUAL) return [...dp];

        const N = dp.length - 1;
        let newDP = new Array(dp.length).fill(0);
        let sum = 0;

        if (mode === PROBABILITY_MODE.CUMULATIVE_LESS) {
            for (let i = 0; i <= N; i++) {
                sum += dp[i];
                newDP[i] = Math.min(sum, 1.0);
            }
        } else if (mode === PROBABILITY_MODE.CUMULATIVE_MORE) {
            for (let i = N; i >= 0; i--) {
                sum += dp[i];
                newDP[i] = Math.min(sum, 1.0);
            }
        }
        return newDP;
    }
}