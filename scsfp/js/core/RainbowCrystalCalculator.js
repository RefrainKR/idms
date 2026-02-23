/**
 * RainbowCrystalCalculator.js
 * 무돌(虹の結晶) 획득 기대값 계산
 */
import { RAINBOW_CRYSTAL_RULES } from './Constants.js';

const { REWARDS, STAR3_RATES, HIGH_RATE_INTERVAL } = RAINBOW_CRYSTAL_RULES;

/**
 * 무돌 획득 기대값 계산기
 */
export class RainbowCrystalCalculator {

    /**
     * 일반 3성 가챠 - 1회 뽑기 무돌 기대값
     * @param {boolean} is10th - 10회째(보정) 여부
     * @returns {number} 무돌 기대값
     */
    static star3Single(is10th = false) {
        let expected = 0;

        if (is10th) {
            // 10회째: 2성 or SR 이상 확정
            // P카드 기대값
            expected += STAR3_RATES.PCARD_10TH.PCARD_3STAR * REWARDS.PCARD_3STAR;
            expected += STAR3_RATES.PCARD_10TH.PCARD_2STAR * REWARDS.PCARD_2STAR;
            expected += STAR3_RATES.PCARD_10TH.PCARD_1STAR * REWARDS.PCARD_1STAR;

            // S카드 기대값
            expected += STAR3_RATES.SCARD_10TH.SCARD_SSR * REWARDS.SCARD_SSR;
            expected += STAR3_RATES.SCARD_10TH.SCARD_SR * REWARDS.SCARD_SR;
            expected += STAR3_RATES.SCARD_10TH.SCARD_R * REWARDS.SCARD_R;
        } else {
            // 일반 회차
            // P카드 기대값
            expected += STAR3_RATES.PCARD_3STAR * REWARDS.PCARD_3STAR;
            expected += STAR3_RATES.PCARD_2STAR * REWARDS.PCARD_2STAR;
            expected += STAR3_RATES.PCARD_1STAR * REWARDS.PCARD_1STAR;

            // S카드 기대값
            expected += STAR3_RATES.SCARD_SSR * REWARDS.SCARD_SSR;
            expected += STAR3_RATES.SCARD_SR * REWARDS.SCARD_SR;
            expected += STAR3_RATES.SCARD_R * REWARDS.SCARD_R;
        }

        return expected;
    }

    /**
     * 일반 3성 가챠 - 누적 무돌 기대값
     * @param {number} maxPulls - 최대 뽑기 횟수 (기본: 200)
     * @returns {Array<{pulls: number, expected: number}>} 누적 기대값 배열
     */
    static star3Cumulative(maxPulls = 200) {
        const results = [];
        let cumulative = 0;

        for (let i = 1; i <= maxPulls; i++) {
            const is10th = (i % HIGH_RATE_INTERVAL === 0); // 10의 배수일 때 10회째 보정
            const singleExpected = this.star3Single(is10th);
            cumulative += singleExpected;

            results.push({
                pulls: i,
                expected: cumulative
            });
        }

        return results;
    }

    /**
     * 일반 3성 가챠 - 10회 단위 무돌 기대값 (차트용)
     * @param {number} maxPulls - 최대 뽑기 횟수 (기본: 200)
     * @returns {Array<{pulls: number, expected: number}>} 10회 단위 기대값 배열
     */
    static star3ByTens(maxPulls = 200) {
        const allResults = this.star3Cumulative(maxPulls);

        // 10회 단위로 필터링 (10, 20, 30, ...)
        return allResults.filter(result => result.pulls % 10 === 0);
    }
}
