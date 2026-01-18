import { PROBABILITY_MODE } from './GachaConstants.js';

export class ProbabilityEngine {
    
    // ==========================================
    // 1. 상태 전이 (Transition) - 수집
    // ==========================================

    static runSinglePull(dp, prob) {
        const size = dp.length - 1; 
        let nextDP = new Array(size + 1).fill(0);

        for (let k = 0; k <= size; k++) {
            if (dp[k] === 0) continue;
            
            if (k === size) {
                nextDP[k] += dp[k];
            } else {
                // [방어 코드] 100% 초과 방지
                let p_new = Math.min((size - k) * prob, 1.0);
                
                nextDP[k] += dp[k] * (1.0 - p_new);
                nextDP[k + 1] += dp[k] * p_new;
            }
        }
        return nextDP;
    }

    static runGuaranteedPull(dp) {
        const size = dp.length - 1;
        let nextDP = new Array(size + 1).fill(0);

        for (let k = 0; k <= size; k++) {
            if (dp[k] === 0) continue;
            if (k < size) nextDP[k + 1] += dp[k];
            else nextDP[size] += dp[k];
        }
        return nextDP;
    }

    static runRandomTicket(dp, poolSize) {
        const size = dp.length - 1; 
        let nextDP = new Array(size + 1).fill(0);

        for (let k = 0; k <= size; k++) {
            if (dp[k] === 0) continue;
            if (k === size) {
                nextDP[size] += dp[k];
            } else {
                // [방어 코드] 극단적 파라미터 방지
                let p_new = Math.min((size - k) / poolSize, 1.0);
                
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
        
        // [방어 코드] 확률이 0~1 사이인지 강제 검증 (음수 방지)
        const validProb = Math.min(Math.max(prob, 0), 1.0);

        for (let k = 0; k < size; k++) {
            if (dp[k] === 0) continue;
            nextDP[k] += dp[k] * (1 - validProb);
            nextDP[k + 1] += dp[k] * validProb;
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
            // [방어 코드] 부동소수점 오차로 0.999...가 되는 것 방지
            newDP[N] = 1.0; 
        } else if (mode === PROBABILITY_MODE.CUMULATIVE_MORE) {
            for (let i = N; i >= 0; i--) {
                sum += dp[i];
                newDP[i] = Math.min(sum, 1.0);
            }
            // [방어 코드] 0개 이상은 무조건 100%
            newDP[0] = 1.0; 
        }
        return newDP;
    }
}