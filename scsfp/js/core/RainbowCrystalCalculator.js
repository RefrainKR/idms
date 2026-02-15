/**
 * RainbowCrystalCalculator.js
 * 무돌(虹の結晶) 획득 기대값 계산
 */

/**
 * 무돌 획득 기대값 계산기
 */
export class RainbowCrystalCalculator {
    /**
     * 카드 등급별 무돌 획득량
     */
    static REWARDS = {
        // P카드
        PCARD_1STAR: 1,   // 1성: 1개
        PCARD_2STAR: 5,   // 2성: 5개
        PCARD_3STAR: 25,  // 3성: 25개

        // S카드
        SCARD_R: 1,       // R: 1개
        SCARD_SR: 5,      // SR: 5개
        SCARD_SSR: 25     // SSR: 25개
    };

    /**
     * 일반 3성 가챠 확률 (리뉴얼 후: P카드 + S카드 동시 배출)
     */
    static STAR3_RATES = {
        // P카드 확률
        PCARD_3STAR: 0.05,   // 3성: 5%
        PCARD_2STAR: 0.15,   // 2성: 15%
        PCARD_1STAR: 0.33,   // 1성: 33%

        // S카드 확률
        SCARD_SSR: 0.03,     // SSR: 3%
        SCARD_SR: 0.05,      // SR: 5%
        SCARD_R: 0.39,       // R: 39%

        // 10회째 보정 (2성 or SR 이상 확정)
        PCARD_10TH: {
            PCARD_3STAR: 0.05,      // 3성: 5%
            PCARD_2STAR: 0.61333,   // 2성: 61.333% (15% + 46.333%)
            PCARD_1STAR: 0          // 1성: 0%
        },
        SCARD_10TH: {
            SCARD_SSR: 0.03,        // SSR: 3%
            SCARD_SR: 0.30667,      // SR: 30.667% (5% + 25.667%)
            SCARD_R: 0              // R: 0%
        }
    };

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
            expected += this.STAR3_RATES.PCARD_10TH.PCARD_3STAR * this.REWARDS.PCARD_3STAR;
            expected += this.STAR3_RATES.PCARD_10TH.PCARD_2STAR * this.REWARDS.PCARD_2STAR;
            expected += this.STAR3_RATES.PCARD_10TH.PCARD_1STAR * this.REWARDS.PCARD_1STAR;

            // S카드 기대값
            expected += this.STAR3_RATES.SCARD_10TH.SCARD_SSR * this.REWARDS.SCARD_SSR;
            expected += this.STAR3_RATES.SCARD_10TH.SCARD_SR * this.REWARDS.SCARD_SR;
            expected += this.STAR3_RATES.SCARD_10TH.SCARD_R * this.REWARDS.SCARD_R;
        } else {
            // 일반 회차
            // P카드 기대값
            expected += this.STAR3_RATES.PCARD_3STAR * this.REWARDS.PCARD_3STAR;
            expected += this.STAR3_RATES.PCARD_2STAR * this.REWARDS.PCARD_2STAR;
            expected += this.STAR3_RATES.PCARD_1STAR * this.REWARDS.PCARD_1STAR;

            // S카드 기대값
            expected += this.STAR3_RATES.SCARD_SSR * this.REWARDS.SCARD_SSR;
            expected += this.STAR3_RATES.SCARD_SR * this.REWARDS.SCARD_SR;
            expected += this.STAR3_RATES.SCARD_R * this.REWARDS.SCARD_R;
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
            const is10th = (i % 10 === 0); // 10의 배수일 때 10회째 보정
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
