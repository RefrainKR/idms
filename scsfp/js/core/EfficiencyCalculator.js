import { ProbabilityEngine } from './ProbabilityEngine.js';
import { GACHA_RULES } from '../config/GachaConfig.js';
import { CHART_RANGE } from '../config/UIConfig.js';

/**
 * EfficiencyCalculator - 가챠 효율 계산 로직을 중앙화한 서비스 클래스
 *
 * 각 ViewModel에서 중복되던 효율 계산 로직을 분리하여 재사용성과 유지보수성을 향상시킵니다.
 */
export class EfficiencyCalculator {

    // ==========================================
    // 내부 시뮬레이션 메서드
    // ==========================================

    /**
     * 3성 가챠 - 특정 pulls 수에 대해 일반/스탭업 DP를 시뮬레이션
     * @returns {{ dpN: Array, dpS: Array, sSelectCnt: number }}
     */
    static _simulate3Star(pulls, { N, M, p_indiv, p_step4_total, stepupLimit, loopRewards, ceilingMode, step4Mode, randomMode, targetMode = 'snipe' }) {
        // 아무나 모드: capacity = N, 저격 모드: capacity = null (dp.length - 1 = M 기본값)
        const cap = targetMode === 'any' ? N : null;

        // 일반 가챠
        let dpN = new Array(M + 1).fill(0);
        dpN[0] = 1.0;
        for (let i = 0; i < pulls; i++) {
            dpN = ProbabilityEngine.runSinglePull(dpN, p_indiv, cap);
        }
        if (ceilingMode === 'included') {
            const nCeil = Math.floor(pulls / GACHA_RULES.STAR3.CEILING_INTERVAL);
            for (let i = 0; i < nCeil; i++) {
                dpN = ProbabilityEngine.runGuaranteedPull(dpN);
            }
        }

        // 스탭업 가챠
        let dpS = new Array(M + 1).fill(0);
        dpS[0] = 1.0;
        let sSelectCnt = 0;
        const actualStepPulls = Math.min(pulls, stepupLimit);

        for (let i = 1; i <= actualStepPulls; i++) {
            const isStep4 = (i % GACHA_RULES.STAR3.STEPUP_CYCLE === 0);
            const curLoop = Math.ceil(i / GACHA_RULES.STAR3.STEPUP_CYCLE);
            const useStep4 = (isStep4 && i <= stepupLimit && step4Mode === 'included');

            dpS = ProbabilityEngine.runSinglePull(dpS, useStep4 ? (p_step4_total / N) : p_indiv, cap);

            if (isStep4 && i <= stepupLimit) {
                const reward = loopRewards[curLoop];
                if (reward === 'random' && randomMode === 'included') {
                    dpS = ProbabilityEngine.runRandomTicket(dpS, N, cap);
                } else if (reward === 'select') {
                    sSelectCnt++;
                }
            }
        }

        // 스탭업 초과분은 일반 가챠로 처리
        if (pulls > stepupLimit) {
            const extraPulls = pulls - stepupLimit;
            for (let i = 0; i < extraPulls; i++) {
                dpS = ProbabilityEngine.runSinglePull(dpS, p_indiv, cap);
            }
        }

        if (ceilingMode === 'included') {
            const sCeil = sSelectCnt + Math.floor(pulls / GACHA_RULES.STAR3.CEILING_INTERVAL);
            for (let i = 0; i < sCeil; i++) {
                dpS = ProbabilityEngine.runGuaranteedPull(dpS);
            }
        }

        return { dpN, dpS, sSelectCnt };
    }

    /**
     * 단순 스탭업 가챠 - 특정 pulls 수에 대해 일반/스탭업 DP를 시뮬레이션
     * @returns {{ dpN: Array, dpS: Array }}
     */
    static _simulateSimpleStepup(pulls, { M, normalRate, stepRate, stepupLimit, ceilingMode, step3Mode }) {
        // 일반 가챠
        let dpN = new Array(M + 1).fill(0);
        dpN[0] = 1.0;
        for (let i = 0; i < pulls; i++) {
            dpN = ProbabilityEngine.runSinglePull(dpN, normalRate);
        }
        if (ceilingMode === 'included') {
            const nCeil = Math.floor(pulls / GACHA_RULES.BIRTHDAY.CEILING_INTERVAL);
            for (let i = 0; i < nCeil; i++) {
                dpN = ProbabilityEngine.runGuaranteedPull(dpN);
            }
        }

        // 스탭업 가챠
        let dpS = new Array(M + 1).fill(0);
        dpS[0] = 1.0;
        const actualStepPulls = Math.min(pulls, stepupLimit);

        for (let i = 1; i <= actualStepPulls; i++) {
            const isStep3 = (i % GACHA_RULES.BIRTHDAY.STEPUP_GUARANTEE === 0);

            if (isStep3 && step3Mode === 'included') {
                dpS = ProbabilityEngine.runGuaranteedPull(dpS);
            } else {
                dpS = ProbabilityEngine.runSinglePull(dpS, stepRate);
            }
        }

        // 스탭업 초과분은 일반 가챠로 처리
        if (pulls > stepupLimit) {
            const extraPulls = pulls - stepupLimit;
            for (let i = 0; i < extraPulls; i++) {
                dpS = ProbabilityEngine.runSinglePull(dpS, normalRate);
            }
        }

        if (ceilingMode === 'included') {
            const sCeil = Math.floor(pulls / GACHA_RULES.BIRTHDAY.CEILING_INTERVAL);
            for (let i = 0; i < sCeil; i++) {
                dpS = ProbabilityEngine.runGuaranteedPull(dpS);
            }
        }

        return { dpN, dpS };
    }

    // ==========================================
    // 공개 API
    // ==========================================

    /**
     * 3성 가챠 효율 데이터 계산
     * @returns {Object} { labels, normalData, stepupData }
     */
    static calculate3Star({ N, M, p_indiv, p_step4_total, maxLoops, loopRewards, ceilingMode, step4Mode, randomMode, targetMode = 'snipe' }) {
        const labels = [];
        const normalData = [];
        const stepupData = [];
        const stepupLimit = maxLoops * GACHA_RULES.STAR3.STEPUP_CYCLE;
        const simParams = { N, M, p_indiv, p_step4_total, stepupLimit, loopRewards, ceilingMode, step4Mode, randomMode, targetMode };

        for (let pulls = 0; pulls <= CHART_RANGE.EFFICIENCY_MAX_PULLS; pulls++) {
            labels.push(pulls);
            const { dpN, dpS } = this._simulate3Star(pulls, simParams);
            normalData.push({ best: dpN[M] * 100, worst: dpN[0] * 100 });
            stepupData.push({ best: dpS[M] * 100, worst: dpS[0] * 100 });
        }

        return { labels, normalData, stepupData };
    }

    /**
     * 2성 가챠 효율 데이터 계산
     * @returns {Object} { labels, normalData, stepupData }
     */
    static calculate2Star({ N_group, M_group, N_total, rateTotal, ceilingMode }) {
        const labels = [];
        const normalData = [];
        const stepupData = [];

        for (let pulls = 0; pulls <= CHART_RANGE.EFFICIENCY_MAX_PULLS; pulls++) {
            labels.push(pulls);

            // 일반 가챠 시뮬레이션
            let dpN = new Array(M_group + 1).fill(0);
            dpN[0] = 1.0;
            for (let i = 1; i <= pulls; i++) {
                dpN = ProbabilityEngine.runSinglePull(
                    dpN,
                    (i % GACHA_RULES.STAR2.HIGH_RATE_INTERVAL === 0 ? GACHA_RULES.STAR2.HIGH_RATE_PROBABILITY : rateTotal) / N_total
                );
            }
            if (ceilingMode === 'included') {
                const ceil = Math.floor(pulls / GACHA_RULES.STAR2.NORMAL_CEILING_INTERVAL);
                for (let i = 0; i < ceil; i++) {
                    dpN = ProbabilityEngine.runGuaranteedPull(dpN);
                }
            }
            normalData.push({ best: dpN[M_group] * 100, worst: dpN[0] * 100 });

            // 스탭업 가챠 시뮬레이션
            let dpS = new Array(M_group + 1).fill(0);
            dpS[0] = 1.0;
            for (let i = 1; i <= pulls; i++) {
                const isGuar = (i === GACHA_RULES.STAR2.STEPUP_GUARANTEE_FIRST ||
                               (i > GACHA_RULES.STAR2.STEPUP_GUARANTEE_FIRST &&
                                (i - GACHA_RULES.STAR2.STEPUP_GUARANTEE_FIRST) % GACHA_RULES.STAR2.STEPUP_GUARANTEE_INTERVAL === 0));
                dpS = ProbabilityEngine.runSinglePull(dpS, isGuar ? (1.0 / N_group) : (rateTotal / N_group));
            }
            if (ceilingMode === 'included') {
                const ceil = Math.floor(pulls / GACHA_RULES.STAR2.STEPUP_CEILING_INTERVAL);
                for (let i = 0; i < ceil; i++) {
                    dpS = ProbabilityEngine.runGuaranteedPull(dpS);
                }
            }
            stepupData.push({ best: dpS[M_group] * 100, worst: dpS[0] * 100 });
        }

        return { labels, normalData, stepupData };
    }

    /**
     * 3성 가챠 CDF(누적분포함수) 데이터 계산
     * @returns {Object} { labels, cdfDataStepup, cdfDataNormal, stepupRequired, normalRequired }
     */
    static calculate3StarCDF({ N, M, p_indiv, p_step4_total, maxLoops, loopRewards, ceilingMode, step4Mode, randomMode, targetProb = 0.9, targetMode = 'snipe' }) {
        const labels = [];
        const cdfDataStepup = [];
        const cdfDataNormal = [];
        const maxPulls = CHART_RANGE.EFFICIENCY_MAX_PULLS;
        const stepupLimit = maxLoops * GACHA_RULES.STAR3.STEPUP_CYCLE;
        const simParams = { N, M, p_indiv, p_step4_total, stepupLimit, loopRewards, ceilingMode, step4Mode, randomMode, targetMode };

        let stepupRequired = null;
        let normalRequired = null;

        for (let pulls = 0; pulls <= maxPulls; pulls++) {
            labels.push(pulls);

            const { dpN, dpS } = this._simulate3Star(pulls, simParams);

            const stepupProb = dpS[M] * 100;
            cdfDataStepup.push(stepupProb);
            if (stepupRequired === null && stepupProb >= targetProb * 100) {
                stepupRequired = pulls;
            }

            const normalProb = dpN[M] * 100;
            cdfDataNormal.push(normalProb);
            if (normalRequired === null && normalProb >= targetProb * 100) {
                normalRequired = pulls;
            }
        }

        return { labels, cdfDataStepup, cdfDataNormal, stepupRequired, normalRequired };
    }

    /**
     * 단순 스탭업 가챠 효율 데이터 계산 (생일/콜라보 타입)
     * @returns {Object} { labels, normalData, stepupData }
     */
    static calculateSimpleStepup({ normalRate, stepRate, ceilingMode, step3Mode, N, M, stepupLimit = 9999 }) {
        const labels = [];
        const normalData = [];
        const stepupData = [];
        const simParams = { M, normalRate, stepRate, stepupLimit, ceilingMode, step3Mode };

        for (let pulls = 0; pulls <= CHART_RANGE.EFFICIENCY_MAX_PULLS; pulls++) {
            labels.push(pulls);
            const { dpN, dpS } = this._simulateSimpleStepup(pulls, simParams);
            normalData.push({ best: dpN[M] * 100, worst: dpN[0] * 100 });
            stepupData.push({ best: dpS[M] * 100, worst: dpS[0] * 100 });
        }

        return { labels, normalData, stepupData };
    }

    /**
     * 단순 스탭업 가챠 CDF(누적분포함수) 데이터 계산 (생일/콜라보 타입)
     * @returns {Object} { labels, cdfDataStepup, cdfDataNormal, stepupRequired, normalRequired }
     */
    static calculateSimpleStepupCDF({ normalRate, stepRate, ceilingMode, step3Mode, M, targetProb, stepupLimit }) {
        const labels = [];
        const cdfDataStepup = [];
        const cdfDataNormal = [];
        const maxPulls = CHART_RANGE.EFFICIENCY_MAX_PULLS;
        const simParams = { M, normalRate, stepRate, stepupLimit, ceilingMode, step3Mode };

        let stepupRequired = null;
        let normalRequired = null;

        for (let pulls = 0; pulls <= maxPulls; pulls++) {
            labels.push(pulls);

            const { dpN, dpS } = this._simulateSimpleStepup(pulls, simParams);

            const stepupProb = dpS[M] * 100;
            cdfDataStepup.push(stepupProb);
            if (stepupRequired === null && stepupProb >= targetProb * 100) {
                stepupRequired = pulls;
            }

            const normalProb = dpN[M] * 100;
            cdfDataNormal.push(normalProb);
            if (normalRequired === null && normalProb >= targetProb * 100) {
                normalRequired = pulls;
            }
        }

        return { labels, cdfDataStepup, cdfDataNormal, stepupRequired, normalRequired };
    }
}
