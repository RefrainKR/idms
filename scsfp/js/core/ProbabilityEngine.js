import { PROBABILITY_MODE, GACHA_RULES } from '../config/GachaConfig.js';
import { ProbabilityValidator } from '../utils/ProbabilityValidator.js';

export class ProbabilityEngine {
    
    // ==========================================
    // 1. 상태 전이 (Transition) - 수집
    // ==========================================

    static runSinglePull(dp, prob, capacity = null) {
        const size = capacity ?? (dp.length - 1);
        let nextDP = new Array(dp.length).fill(0);

        // [개선] 중앙화된 확률 검증
        const validProb = ProbabilityValidator.clamp(prob);

        for (let k = 0; k < dp.length; k++) {
            if (dp[k] === 0) continue;

            if (k === dp.length - 1 || size - k <= 0) {
                nextDP[k] += dp[k];
            } else {
                // [개선] getTotalProb 사용으로 안전성 강화
                const p_new = ProbabilityValidator.getTotalProb(validProb, size - k);

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

    static runRandomTicket(dp, poolSize, capacity = null) {
        const size = capacity ?? (dp.length - 1);
        let nextDP = new Array(dp.length).fill(0);

        for (let k = 0; k < dp.length; k++) {
            if (dp[k] === 0) continue;
            if (k === dp.length - 1 || size - k <= 0) {
                nextDP[k] += dp[k];
            } else {
                // [개선] 확률 계산 안전성 강화
                const individualProb = 1.0 / poolSize;
                const p_new = ProbabilityValidator.getTotalProb(individualProb, size - k);

                nextDP[k] += dp[k] * (1.0 - p_new);
                nextDP[k + 1] += dp[k] * p_new;
            }
        }
        return nextDP;
    }

    // ==========================================
    // 2. 이 획득 수 계산
    // ==========================================

    static accumulateCountProb(dp, prob) {
        const size = dp.length;
        let nextDP = new Array(size + 1).fill(0);
        
        // [개선] 중앙화된 확률 검증
        const validProb = ProbabilityValidator.clamp(prob);

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

    /**
     * 2성 스탭업 그룹 계산
     * @param {number} N - 그룹 내 픽업 수
     * @param {number} M - 목표 수집 수
     * @param {number} pulls - 가챠 횟수
     * @param {number} rate - 총 픽업 확률 (0~1)
     * @returns {Object} { dp, dpTotal }
     */
    static calcStepupGroup(N, M, pulls, rate) {
        let dp = new Array(M + 1).fill(0);
        dp[0] = 1.0;
        let dpTotal = [1.0];

        if (pulls <= 0) return { dp, dpTotal };

        const p_normal_one = rate / N;
        const p_guar_one = 1.0 / N;

        const p_normal_any = ProbabilityValidator.getTotalProb(p_normal_one, M);
        const p_guar_any = ProbabilityValidator.getTotalProb(p_guar_one, M);

        for (let i = 1; i <= pulls; i++) {
            const isGuar = (i === GACHA_RULES.STAR2.STEPUP_GUARANTEE_FIRST ||
                           (i > GACHA_RULES.STAR2.STEPUP_GUARANTEE_FIRST &&
                            (i - GACHA_RULES.STAR2.STEPUP_GUARANTEE_FIRST) % GACHA_RULES.STAR2.STEPUP_GUARANTEE_INTERVAL === 0));
            const p_one = isGuar ? p_guar_one : p_normal_one;
            const p_any = isGuar ? p_guar_any : p_normal_any;

            dp = ProbabilityEngine.runSinglePull(dp, p_one);
            dpTotal = ProbabilityEngine.accumulateCountProb(dpTotal, p_any);
        }

        return { dp, dpTotal };
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
            // [개선] 부동소수점 오차 보정
            newDP = ProbabilityValidator.fixCumulativeEnd(newDP);
        } else if (mode === PROBABILITY_MODE.CUMULATIVE_MORE) {
            for (let i = N; i >= 0; i--) {
                sum += dp[i];
                newDP[i] = Math.min(sum, 1.0);
            }
            // [개선] 0개 이상은 무조건 100%
            newDP[0] = 1.0;
        }
        return newDP;
    }
}