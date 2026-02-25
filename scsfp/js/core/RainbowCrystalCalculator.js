/**
 * RainbowCrystalCalculator.js
 * 무돌(虹の結晶) 획득 기대값 계산
 */
import { RAINBOW_CRYSTAL_RULES } from './Constants.js';

const { REWARDS, HIGH_RATE_INTERVAL } = RAINBOW_CRYSTAL_RULES;

/**
 * 무돌 획득 기대값 계산기
 */
export class RainbowCrystalCalculator {

    /**
     * 입력 확률로부터 1회 무돌 기대값 계산
     * @param {Object} rates - { p3star, p2star, p1star, pSSR, pSR, pR } (소수점, 0~1)
     * @param {boolean} is10th - 10회째(2/SR확정) 여부
     * @returns {number} 무돌 기대값
     */
    static singleExpected(rates, is10th = false) {
        const { p3star, p2star, p1star, pSSR, pSR, pR } = rates;
        let expected = 0;

        if (is10th) {
            // 10회째: 2성/SR 이상 확정
            // P카드: 3성은 그대로, 남은 확률은 2성에 모두 배분
            const pTotal = p3star + p2star + p1star;
            const p10_3star = p3star;
            const p10_2star = pTotal - p3star; // 1성 몫을 2성으로
            expected += p10_3star * REWARDS.PCARD_3STAR;
            expected += p10_2star * REWARDS.PCARD_2STAR;

            // S카드: SSR은 그대로, 남은 확률은 SR에 모두 배분
            const sTotal = pSSR + pSR + pR;
            const p10_SSR = pSSR;
            const p10_SR = sTotal - pSSR; // R 몫을 SR로
            expected += p10_SSR * REWARDS.SCARD_SSR;
            expected += p10_SR * REWARDS.SCARD_SR;
        } else {
            expected += p3star * REWARDS.PCARD_3STAR;
            expected += p2star * REWARDS.PCARD_2STAR;
            expected += p1star * REWARDS.PCARD_1STAR;
            expected += pSSR * REWARDS.SCARD_SSR;
            expected += pSR * REWARDS.SCARD_SR;
            expected += pR * REWARDS.SCARD_R;
        }

        return expected;
    }

    /**
     * 입력 확률 기반 - 누적 무돌 기대값 계산
     * @param {Object} rates - { p3star, p2star, p1star, pSSR, pSR, pR } (소수점, 0~1)
     * @param {number} pulls - 계산할 총 뽑기 횟수
     * @param {boolean} include10th - 10회째 2/SR확정 포함 여부
     * @returns {{ perPull: number, per10: number, total: number, breakdown: Object }}
     */
    static calcFromInput(rates, pulls, include10th = true) {
        let total = 0;
        for (let i = 1; i <= pulls; i++) {
            const is10th = include10th && (i % HIGH_RATE_INTERVAL === 0);
            total += this.singleExpected(rates, is10th);
        }

        // 10회 단위 기대값 (10연 기준)
        let per10 = 0;
        for (let i = 1; i <= 10; i++) {
            const is10th = include10th && (i === 10);
            per10 += this.singleExpected(rates, is10th);
        }

        // 1회 기대값 (보정 없는 단순 1회)
        const perPull = this.singleExpected(rates, false);

        // 등급별 breakdown (일반 1회 기준)
        const breakdown = {
            pcard: {
                star3: rates.p3star * REWARDS.PCARD_3STAR,
                star2: rates.p2star * REWARDS.PCARD_2STAR,
                star1: rates.p1star * REWARDS.PCARD_1STAR
            },
            scard: {
                SSR: rates.pSSR * REWARDS.SCARD_SSR,
                SR: rates.pSR * REWARDS.SCARD_SR,
                R: rates.pR * REWARDS.SCARD_R
            }
        };

        return { perPull, per10, total };
    }
}
