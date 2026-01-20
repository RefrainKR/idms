import { ProbabilityEngine } from './ProbabilityEngine.js';
import { GACHA_RULES } from './GachaConstants.js';

/**
 * EfficiencyCalculator - 가챠 효율 계산 로직을 중앙화한 서비스 클래스
 *
 * 각 ViewModel에서 중복되던 효율 계산 로직을 분리하여 재사용성과 유지보수성을 향상시킵니다.
 */
export class EfficiencyCalculator {
    /**
     * 3성 가챠 효율 데이터 계산
     * @param {Object} params - 계산 파라미터
     * @param {number} params.N - 픽업 총 인원 수
     * @param {number} params.M - 목표 인원 수
     * @param {number} params.p_indiv - 개별 확률 (0~1)
     * @param {number} params.p_step4_total - Step4 총 확률 (0~1)
     * @param {number} params.maxLoops - 최대 루프 수
     * @param {Object} params.loopRewards - 루프 보상 설정
     * @param {string} params.ceilingMode - 천장 모드 ('included' | 'excluded')
     * @param {string} params.step4Mode - Step4 모드 ('included' | 'excluded')
     * @param {string} params.randomMode - 랜덤 모드 ('included' | 'excluded')
     * @returns {Object} { labels, normalData, stepupData }
     */
    static calculate3Star({ N, M, p_indiv, p_step4_total, maxLoops, loopRewards, ceilingMode, step4Mode, randomMode }) {
        const labels = [];
        const normalData = [];
        const stepupData = [];
        const stepupLimit = maxLoops * GACHA_RULES.STAR3.STEPUP_CYCLE;

        for (let pulls = 0; pulls <= 200; pulls++) {
            labels.push(pulls);

            // 일반 가챠 시뮬레이션
            let dpN = new Array(M + 1).fill(0);
            dpN[0] = 1.0;
            for (let i = 0; i < pulls; i++) {
                dpN = ProbabilityEngine.runSinglePull(dpN, p_indiv);
            }
            if (ceilingMode === 'included') {
                const nCeil = Math.floor(pulls / GACHA_RULES.STAR3.CEILING_INTERVAL);
                for (let i = 0; i < nCeil; i++) {
                    dpN = ProbabilityEngine.runGuaranteedPull(dpN);
                }
            }
            normalData.push({ best: dpN[M] * 100, worst: dpN[0] * 100 });

            // 스탭업 가챠 시뮬레이션
            let dpS = new Array(M + 1).fill(0);
            dpS[0] = 1.0;
            let sSelectCnt = 0;
            for (let i = 1; i <= pulls; i++) {
                const isStep4 = (i % GACHA_RULES.STAR3.STEPUP_CYCLE === 0);
                const curLoop = Math.ceil(i / GACHA_RULES.STAR3.STEPUP_CYCLE);
                const useStep4 = (isStep4 && i <= stepupLimit && step4Mode === 'included');
                dpS = ProbabilityEngine.runSinglePull(dpS, useStep4 ? (p_step4_total / N) : p_indiv);

                if (isStep4 && i <= stepupLimit) {
                    const reward = loopRewards[curLoop];
                    if (reward === 'random' && randomMode === 'included') {
                        dpS = ProbabilityEngine.runRandomTicket(dpS, N);
                    } else if (reward === 'select') {
                        sSelectCnt++;
                    }
                }
            }
            if (ceilingMode === 'included') {
                const sCeil = sSelectCnt + Math.floor(pulls / GACHA_RULES.STAR3.CEILING_INTERVAL);
                for (let i = 0; i < sCeil; i++) {
                    dpS = ProbabilityEngine.runGuaranteedPull(dpS);
                }
            }
            stepupData.push({ best: dpS[M] * 100, worst: dpS[0] * 100 });
        }

        return { labels, normalData, stepupData };
    }

    /**
     * 2성 가챠 효율 데이터 계산
     * @param {Object} params - 계산 파라미터
     * @param {number} params.N_group - 그룹 인원 수
     * @param {number} params.M_group - 그룹 목표 인원 수
     * @param {number} params.N_total - 전체 픽업 인원 수
     * @param {number} params.rateTotal - 총 픽업 확률 (0~1)
     * @param {string} params.ceilingMode - 천장 모드
     * @returns {Object} { labels, normalData, stepupData }
     */
    static calculate2Star({ N_group, M_group, N_total, rateTotal, ceilingMode }) {
        const labels = [];
        const normalData = [];
        const stepupData = [];

        for (let pulls = 0; pulls <= 200; pulls++) {
            labels.push(pulls);

            // 일반 가챠 시뮬레이션
            let dpN = new Array(M_group + 1).fill(0);
            dpN[0] = 1.0;
            for (let i = 1; i <= pulls; i++) {
                dpN = ProbabilityEngine.runSinglePull(
                    dpN,
                    (i % GACHA_RULES.STAR2.HIGH_RATE_INTERVAL === 0 ? 0.95 : rateTotal) / N_total
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
     * @param {Object} params - 계산 파라미터
     * @param {number} params.N - 픽업 총 인원 수
     * @param {number} params.M - 목표 인원 수
     * @param {number} params.p_indiv - 개별 확률 (0~1)
     * @param {number} params.p_step4_total - Step4 총 확률 (0~1)
     * @param {number} params.maxLoops - 최대 루프 수
     * @param {Object} params.loopRewards - 루프 보상 설정
     * @param {string} params.ceilingMode - 천장 모드 ('included' | 'excluded')
     * @param {string} params.step4Mode - Step4 모드 ('included' | 'excluded')
     * @param {string} params.randomMode - 랜덤 모드 ('included' | 'excluded')
     * @returns {Object} { labels, cdfDataStepup, cdfDataNormal }
     */
    static calculate3StarCDF({ N, M, p_indiv, p_step4_total, maxLoops, loopRewards, ceilingMode, step4Mode, randomMode }) {
        const labels = [];
        const cdfDataStepup = [];
        const cdfDataNormal = [];
        const maxPulls = 200;
        const stepupLimit = maxLoops * GACHA_RULES.STAR3.STEPUP_CYCLE;

        for (let pulls = 0; pulls <= maxPulls; pulls++) {
            labels.push(pulls);

            // 1. 스탭업 가챠 + 일반 가챠 (스탭업 한도 초과 시)
            let dpS = new Array(M + 1).fill(0);
            dpS[0] = 1.0;

            let sSelectCnt = 0;
            const actualStepPulls = Math.min(pulls, stepupLimit);

            for (let i = 1; i <= actualStepPulls; i++) {
                const isStep4 = (i % GACHA_RULES.STAR3.STEPUP_CYCLE === 0);
                const curLoop = Math.ceil(i / GACHA_RULES.STAR3.STEPUP_CYCLE);
                const useStep4 = (isStep4 && step4Mode === 'included');

                dpS = ProbabilityEngine.runSinglePull(dpS, useStep4 ? (p_step4_total / N) : p_indiv);

                if (isStep4) {
                    const reward = loopRewards[curLoop];
                    if (reward === 'random' && randomMode === 'included') {
                        dpS = ProbabilityEngine.runRandomTicket(dpS, N);
                    } else if (reward === 'select') {
                        sSelectCnt++;
                    }
                }
            }

            // 스탭업 초과분은 일반 가챠로 처리
            if (pulls > stepupLimit) {
                const extraPulls = pulls - stepupLimit;
                for (let i = 0; i < extraPulls; i++) {
                    dpS = ProbabilityEngine.runSinglePull(dpS, p_indiv);
                }
            }

            // 천장 처리 (스탭업)
            if (ceilingMode === 'included') {
                const sCeil = sSelectCnt + Math.floor(pulls / GACHA_RULES.STAR3.CEILING_INTERVAL);
                for (let i = 0; i < sCeil; i++) {
                    dpS = ProbabilityEngine.runGuaranteedPull(dpS);
                }
            }

            cdfDataStepup.push(dpS[M] * 100);

            // 2. 일반 가챠만
            let dpN = new Array(M + 1).fill(0);
            dpN[0] = 1.0;

            for (let i = 0; i < pulls; i++) {
                dpN = ProbabilityEngine.runSinglePull(dpN, p_indiv);
            }

            // 천장 처리 (일반)
            if (ceilingMode === 'included') {
                const nCeil = Math.floor(pulls / GACHA_RULES.STAR3.CEILING_INTERVAL);
                for (let i = 0; i < nCeil; i++) {
                    dpN = ProbabilityEngine.runGuaranteedPull(dpN);
                }
            }

            cdfDataNormal.push(dpN[M] * 100);
        }

        return { labels, cdfDataStepup, cdfDataNormal };
    }

    /**
     * 생일 가챠 효율 데이터 계산
     * @param {Object} params - 계산 파라미터
     * @param {number} params.normalRate - 일반 확률 (0~1)
     * @param {number} params.stepRate - 스탭업 확률 (0~1)
     * @param {string} params.ceilingMode - 천장 모드
     * @returns {Object} { labels, normalData, stepupData }
     */
    static calculateBirthday({ normalRate, stepRate, ceilingMode }) {
        const M = 1; // 생일 가챠는 항상 1명 목표
        const labels = [];
        const normalData = [];
        const stepupData = [];

        for (let pulls = 0; pulls <= 200; pulls++) {
            labels.push(pulls);

            // 일반 가챠 시뮬레이션
            let dpN = [1.0, 0];
            for (let i = 0; i < pulls; i++) {
                dpN = ProbabilityEngine.runSinglePull(dpN, normalRate);
            }
            if (ceilingMode === 'included') {
                const nCeil = Math.floor(pulls / GACHA_RULES.BIRTHDAY.CEILING_INTERVAL);
                for (let i = 0; i < nCeil; i++) {
                    dpN = ProbabilityEngine.runGuaranteedPull(dpN);
                }
            }
            normalData.push({ best: dpN[M] * 100, worst: dpN[0] * 100 });

            // 스탭업 가챠 시뮬레이션 (최대 30회까지만)
            let dpS = [1.0, 0];
            const stepPulls = Math.min(pulls, GACHA_RULES.BIRTHDAY.STEPUP_MAX);

            for (let i = 1; i <= stepPulls; i++) {
                if (i === GACHA_RULES.BIRTHDAY.STEPUP_GUARANTEE) {
                    dpS = ProbabilityEngine.runGuaranteedPull(dpS);
                } else {
                    dpS = ProbabilityEngine.runSinglePull(dpS, stepRate);
                }
            }

            // 스탭업 30회 초과분은 일반 가챠로 처리
            if (pulls > GACHA_RULES.BIRTHDAY.STEPUP_MAX) {
                const extraPulls = pulls - GACHA_RULES.BIRTHDAY.STEPUP_MAX;
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
            stepupData.push({ best: dpS[M] * 100, worst: dpS[0] * 100 });
        }

        return { labels, normalData, stepupData };
    }
}
