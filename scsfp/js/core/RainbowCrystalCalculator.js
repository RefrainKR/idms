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
     * 입력 확률 기반 - 누적 무돌 기대값 계산 (일반 가챠)
     * @param {Object} rates - { p3star, p2star, p1star, pSSR, pSR, pR } (소수점, 0~1)
     * @param {number} pulls - 계산할 총 뽑기 횟수
     * @param {boolean} include10th - 10회째 2/SR확정 포함 여부
     * @returns {{ perPull: number, per10: number, total: number }}
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

        return { perPull, per10, total };
    }

    /**
     * Step3 1~9회째 확률 계산 (3성/SSR 각 2배, 증가분은 1성/R에서 차감)
     * @param {Object} rates
     * @returns {Object} 보정된 rates
     */
    static step3Rates(rates) {
        const { p3star, p2star, p1star, pSSR, pSR, pR } = rates;
        const deltaP = p3star; // 3성이 2배가 되면 증가분 = p3star
        const deltaS = pSSR;   // SSR이 2배가 되면 증가분 = pSSR

        // P카드: 1성에서 우선 차감, 부족하면 2성에서 차감
        let new_p1star = p1star - deltaP;
        let new_p2star = p2star;
        if (new_p1star < 0) {
            new_p2star += new_p1star; // 2성에서 부족분 차감
            new_p1star = 0;
        }

        // S카드: R에서 우선 차감, 부족하면 SR에서 차감
        let new_pR = pR - deltaS;
        let new_pSR = pSR;
        if (new_pR < 0) {
            new_pSR += new_pR; // SR에서 부족분 차감
            new_pR = 0;
        }

        return {
            p3star: p3star * 2,
            p2star: Math.max(0, new_p2star),
            p1star: new_p1star,
            pSSR: pSSR * 2,
            pSR: Math.max(0, new_pSR),
            pR: new_pR
        };
    }

    /**
     * Step2/Step3 10회째 확정枠 확률 (★2/SR이상확정枠)
     * 법칙: ★★★/SSR 각 2배, 나머지(1 - ★★★×2 - SSR×2)를 ★★:SR = 2:1로 배분
     * 검증(정규): ★★★10% + SSR6% → 나머지84% → ★★ 56%, SR 28% ✓
     * 검증(PJ):   ★★★15% + SSR6% → 나머지79% → ★★ 52.667%, SR 26.333% ✓
     * @param {Object} rates - 입력 기본 확률 (소수점, 0~1)
     * @returns {Object} 확정枠 rates
     */
    static step2_10thRates(rates) {
        const p3star = rates.p3star * 2;
        const pSSR = rates.pSSR * 2;
        const remaining = 1 - p3star - pSSR;
        return { p3star, p2star: remaining * 2 / 3, p1star: 0, pSSR, pSR: remaining / 3, pR: 0 };
    }

    /**
     * 스탭업 가챠 1주 (Step1~4, 40회) 무돌 기대값 계산
     * @param {Object} rates
     * @returns {number} 40회 기대값
     */
    static calcStepup1Week(rates) {
        const step3Rates = this.step3Rates(rates);
        const top10thRates = this.step2_10thRates(rates);
        // Step4 40회째: 25무돌 고정 (항상 중복 가정)
        const STEP4_40TH_FIXED = 25;

        let total = 0;
        // Step1 (1~10회): 일반 10연과 동일 (1~9회 기본, 10회째 1성→2성, R→SR)
        for (let i = 1; i <= 10; i++) {
            total += this.singleExpected(rates, i === 10);
        }
        // Step2 (11~20회): 1~9회 기본, 20회째 전체→3성/SSR
        for (let i = 1; i <= 9; i++) {
            total += this.singleExpected(rates, false);
        }
        total += this.singleExpected(top10thRates, false); // 20회째
        // Step3 (21~30회): 1~9회 3성/SSR 2배 보정, 30회째 전체→3성/SSR
        for (let i = 1; i <= 9; i++) {
            total += this.singleExpected(step3Rates, false);
        }
        total += this.singleExpected(top10thRates, false); // 30회째
        // Step4 (31~40회): 1~9회 기본, 40회째 25무돌 고정
        for (let i = 1; i <= 9; i++) {
            total += this.singleExpected(rates, false);
        }
        total += STEP4_40TH_FIXED; // 40회째

        return total;
    }

    /**
     * 스탭업 가챠 총 무돌 기대값 계산
     * @param {Object} rates
     * @param {number} stepPulls - 스탭업 총 횟수
     * @returns {number} 총 기대값
     */
    static calcStepupTotal(rates, stepPulls) {
        if (stepPulls <= 0) return 0;

        const step3Rates = this.step3Rates(rates);
        const top10thRates = this.step2_10thRates(rates);
        const STEP4_40TH_FIXED = 25;

        // Step 내 회차 순서: 각 40회 반복 주기 내 위치 판별
        let total = 0;
        for (let i = 1; i <= stepPulls; i++) {
            const posInWeek = ((i - 1) % 40) + 1; // 1~40
            if (posInWeek <= 10) {
                // Step1: 10회째 1성→2성, R→SR
                total += this.singleExpected(rates, posInWeek === 10);
            } else if (posInWeek <= 20) {
                // Step2: 20회째 전체→3성/SSR
                if (posInWeek === 20) {
                    total += this.singleExpected(top10thRates, false);
                } else {
                    total += this.singleExpected(rates, false);
                }
            } else if (posInWeek <= 30) {
                // Step3: 1~9회 2배 보정, 30회째 전체→3성/SSR
                if (posInWeek === 30) {
                    total += this.singleExpected(top10thRates, false);
                } else {
                    total += this.singleExpected(step3Rates, false);
                }
            } else {
                // Step4: 40회째 25무돌 고정, 나머지 기본
                if (posInWeek === 40) {
                    total += STEP4_40TH_FIXED;
                } else {
                    total += this.singleExpected(rates, false);
                }
            }
        }
        return total;
    }
}
