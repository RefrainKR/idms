import { ProbabilityEngine } from './ProbabilityEngine.js';
import { GACHA_RULES } from '../config/GachaConfig.js';
import { CHART_RANGE } from '../config/UIConfig.js';

/**
 * 비교 그래프에서 일반과 대조하는 스탭업 전략의 실제 의미.
 */
export const STEPUP_STRATEGY_KIND = Object.freeze({
    STEPUP_FIRST: 'stepupFirst',
    STEPUP_ONLY: 'stepupOnly'
});

/**
 * 가챠 전략별 수집 완료 확률과 목표 확률 도달 횟수를 계산한다.
 *
 * `best`는 목표 수집 완료 확률, `worst`는 목표를 하나도 얻지 못할 확률이다.
 * 계산식과 상태 전이는 ProbabilityEngine에 위임하고, 이 클래스는 전략 순서를 구성한다.
 */
export class EfficiencyCalculator {

    /**
     * 3성 전략을 특정 총 Pull 수까지 시뮬레이션한다.
     *
     * compared 전략은 Step-up을 한도까지 먼저 사용하고, 남은 Pull을 Normal로 진행한다.
     * @returns {{ normalOnlyCollectionDp: Array, stepupFirstCollectionDp: Array, stepupSelectTicketCount: number }}
     */
    static _simulate3StarStrategies(pulls, {
        pickupCount,
        targetCount,
        individualPickupRate,
        step4PickupTotalRate,
        maxStepupPulls,
        loopRewards,
        ceilingMode,
        step4Mode,
        randomTicketMode,
        targetMode = 'snipe'
    }) {
        const collectionCapacity = targetMode === 'any' ? pickupCount : null;

        let normalOnlyCollectionDp = new Array(targetCount + 1).fill(0);
        normalOnlyCollectionDp[0] = 1.0;
        for (let pull = 0; pull < pulls; pull++) {
            normalOnlyCollectionDp = ProbabilityEngine.runSinglePull(
                normalOnlyCollectionDp,
                individualPickupRate,
                collectionCapacity
            );
        }
        if (ceilingMode === 'included') {
            const sharedSelectRewardCount = Math.floor(
                pulls / GACHA_RULES.STAR3.SHARED_SELECT_REWARD_INTERVAL
            );
            for (let reward = 0; reward < sharedSelectRewardCount; reward++) {
                normalOnlyCollectionDp = ProbabilityEngine.runGuaranteedPull(normalOnlyCollectionDp);
            }
        }

        let stepupFirstCollectionDp = new Array(targetCount + 1).fill(0);
        stepupFirstCollectionDp[0] = 1.0;
        let stepupSelectTicketCount = 0;
        const stepupPullsUsed = Math.min(pulls, maxStepupPulls);

        for (let pull = 1; pull <= stepupPullsUsed; pull++) {
            const isStep4Pull = pull % GACHA_RULES.STAR3.STEPUP_CYCLE === 0;
            const loopNumber = Math.ceil(pull / GACHA_RULES.STAR3.STEPUP_CYCLE);
            const includesStep4Rate = isStep4Pull && step4Mode === 'included';

            stepupFirstCollectionDp = ProbabilityEngine.runSinglePull(
                stepupFirstCollectionDp,
                includesStep4Rate ? step4PickupTotalRate / pickupCount : individualPickupRate,
                collectionCapacity
            );

            if (isStep4Pull) {
                const loopReward = loopRewards[loopNumber];
                if (loopReward === 'random' && randomTicketMode === 'included') {
                    stepupFirstCollectionDp = ProbabilityEngine.runRandomTicket(
                        stepupFirstCollectionDp,
                        pickupCount,
                        collectionCapacity
                    );
                } else if (loopReward === 'select') {
                    stepupSelectTicketCount++;
                }
            }
        }

        const normalPullsAfterStepup = Math.max(0, pulls - maxStepupPulls);
        for (let pull = 0; pull < normalPullsAfterStepup; pull++) {
            stepupFirstCollectionDp = ProbabilityEngine.runSinglePull(
                stepupFirstCollectionDp,
                individualPickupRate,
                collectionCapacity
            );
        }

        if (ceilingMode === 'included') {
            const guaranteedSelectCount = stepupSelectTicketCount
                + Math.floor(pulls / GACHA_RULES.STAR3.SHARED_SELECT_REWARD_INTERVAL);
            for (let reward = 0; reward < guaranteedSelectCount; reward++) {
                stepupFirstCollectionDp = ProbabilityEngine.runGuaranteedPull(stepupFirstCollectionDp);
            }
        }

        return { normalOnlyCollectionDp, stepupFirstCollectionDp, stepupSelectTicketCount };
    }

    /**
     * 생일/콜라보의 확률 증가형 Step-up 전략을 시뮬레이션한다.
     * 유한 한도에서는 한도 이후 일반, 실질적 무제한에서는 스탭업만 진행한다.
     */
    static _simulateRateBoostStepupStrategies(pulls, {
        targetCount,
        normalPickupRate,
        stepupPickupRate,
        maxStepupPulls,
        sharedSelectRewardInterval,
        guaranteedTargetPullInterval,
        guaranteedTargetMode,
        ceilingMode
    }) {
        let normalOnlyCollectionDp = new Array(targetCount + 1).fill(0);
        normalOnlyCollectionDp[0] = 1.0;
        for (let pull = 0; pull < pulls; pull++) {
            normalOnlyCollectionDp = ProbabilityEngine.runSinglePull(normalOnlyCollectionDp, normalPickupRate);
        }
        if (ceilingMode === 'included') {
            const sharedSelectRewardCount = Math.floor(pulls / sharedSelectRewardInterval);
            for (let reward = 0; reward < sharedSelectRewardCount; reward++) {
                normalOnlyCollectionDp = ProbabilityEngine.runGuaranteedPull(normalOnlyCollectionDp);
            }
        }

        let comparedStrategyCollectionDp = new Array(targetCount + 1).fill(0);
        comparedStrategyCollectionDp[0] = 1.0;
        const stepupPullsUsed = Math.min(pulls, maxStepupPulls);

        for (let pull = 1; pull <= stepupPullsUsed; pull++) {
            const isGuaranteedTargetPull = guaranteedTargetPullInterval
                && pull % guaranteedTargetPullInterval === 0;

            if (isGuaranteedTargetPull && guaranteedTargetMode === 'included') {
                comparedStrategyCollectionDp = ProbabilityEngine.runGuaranteedPull(comparedStrategyCollectionDp);
            } else {
                comparedStrategyCollectionDp = ProbabilityEngine.runSinglePull(
                    comparedStrategyCollectionDp,
                    stepupPickupRate
                );
            }
        }

        const normalPullsAfterStepup = Math.max(0, pulls - maxStepupPulls);
        for (let pull = 0; pull < normalPullsAfterStepup; pull++) {
            comparedStrategyCollectionDp = ProbabilityEngine.runSinglePull(
                comparedStrategyCollectionDp,
                normalPickupRate
            );
        }

        if (ceilingMode === 'included') {
            const sharedSelectRewardCount = Math.floor(pulls / sharedSelectRewardInterval);
            for (let reward = 0; reward < sharedSelectRewardCount; reward++) {
                comparedStrategyCollectionDp = ProbabilityEngine.runGuaranteedPull(comparedStrategyCollectionDp);
            }
        }

        return { normalOnlyCollectionDp, comparedStrategyCollectionDp };
    }

    /**
     * 3성 일반과 스탭업 우선 전략 비교 데이터.
     */
    static calculate3StarComparison({
        pickupCount,
        targetCount,
        individualPickupRate,
        step4PickupTotalRate,
        maxLoops,
        loopRewards,
        ceilingMode,
        step4Mode,
        randomTicketMode,
        targetMode = 'snipe'
    }) {
        const labels = [];
        const normalOnlyData = [];
        const comparedStrategyData = [];
        const maxStepupPulls = maxLoops * GACHA_RULES.STAR3.STEPUP_CYCLE;
        const simulationOptions = {
            pickupCount,
            targetCount,
            individualPickupRate,
            step4PickupTotalRate,
            maxStepupPulls,
            loopRewards,
            ceilingMode,
            step4Mode,
            randomTicketMode,
            targetMode
        };

        for (let pulls = 0; pulls <= CHART_RANGE.EFFICIENCY_MAX_PULLS; pulls++) {
            labels.push(pulls);
            const { normalOnlyCollectionDp, stepupFirstCollectionDp } =
                this._simulate3StarStrategies(pulls, simulationOptions);
            normalOnlyData.push({
                best: normalOnlyCollectionDp[targetCount] * 100,
                worst: normalOnlyCollectionDp[0] * 100
            });
            comparedStrategyData.push({
                best: stepupFirstCollectionDp[targetCount] * 100,
                worst: stepupFirstCollectionDp[0] * 100
            });
        }

        return {
            labels,
            normalOnlyData,
            comparedStrategyData,
            comparedStrategyKind: STEPUP_STRATEGY_KIND.STEPUP_FIRST
        };
    }

    /**
     * 2성 일반과 선택 그룹 스탭업 전략 비교 데이터.
     */
    static calculate2StarComparison({
        groupPickupCount,
        groupTargetCount,
        totalPickupCount,
        totalPickupRate,
        ceilingMode
    }) {
        const labels = [];
        const normalOnlyData = [];
        const comparedStrategyData = [];

        for (let pulls = 0; pulls <= CHART_RANGE.EFFICIENCY_MAX_PULLS; pulls++) {
            labels.push(pulls);

            let normalOnlyCollectionDp = new Array(groupTargetCount + 1).fill(0);
            normalOnlyCollectionDp[0] = 1.0;
            for (let pull = 1; pull <= pulls; pull++) {
                const pickupTotalRate = pull % GACHA_RULES.STAR2.HIGH_RATE_INTERVAL === 0
                    ? GACHA_RULES.STAR2.HIGH_RATE_PROBABILITY
                    : totalPickupRate;
                normalOnlyCollectionDp = ProbabilityEngine.runSinglePull(
                    normalOnlyCollectionDp,
                    pickupTotalRate / totalPickupCount
                );
            }
            if (ceilingMode === 'included') {
                const normalSelectRewardCount = Math.floor(
                    pulls / GACHA_RULES.STAR2.NORMAL_SELECT_REWARD_INTERVAL
                );
                for (let reward = 0; reward < normalSelectRewardCount; reward++) {
                    normalOnlyCollectionDp = ProbabilityEngine.runGuaranteedPull(normalOnlyCollectionDp);
                }
            }
            normalOnlyData.push({
                best: normalOnlyCollectionDp[groupTargetCount] * 100,
                worst: normalOnlyCollectionDp[0] * 100
            });

            let stepupOnlyCollectionDp = new Array(groupTargetCount + 1).fill(0);
            stepupOnlyCollectionDp[0] = 1.0;
            for (let pull = 1; pull <= pulls; pull++) {
                const isGuaranteedPickupPull = pull === GACHA_RULES.STAR2.FIRST_GUARANTEED_PICKUP_PULL
                    || (pull > GACHA_RULES.STAR2.FIRST_GUARANTEED_PICKUP_PULL
                        && (pull - GACHA_RULES.STAR2.FIRST_GUARANTEED_PICKUP_PULL)
                            % GACHA_RULES.STAR2.GUARANTEED_PICKUP_INTERVAL === 0);
                stepupOnlyCollectionDp = ProbabilityEngine.runSinglePull(
                    stepupOnlyCollectionDp,
                    isGuaranteedPickupPull ? 1.0 / groupPickupCount : totalPickupRate / groupPickupCount
                );
            }
            if (ceilingMode === 'included') {
                const stepupSelectRewardCount = Math.floor(
                    pulls / GACHA_RULES.STAR2.STEPUP_SELECT_REWARD_INTERVAL
                );
                for (let reward = 0; reward < stepupSelectRewardCount; reward++) {
                    stepupOnlyCollectionDp = ProbabilityEngine.runGuaranteedPull(stepupOnlyCollectionDp);
                }
            }
            comparedStrategyData.push({
                best: stepupOnlyCollectionDp[groupTargetCount] * 100,
                worst: stepupOnlyCollectionDp[0] * 100
            });
        }

        return {
            labels,
            normalOnlyData,
            comparedStrategyData,
            comparedStrategyKind: STEPUP_STRATEGY_KIND.STEPUP_ONLY
        };
    }

    /**
     * 3성 전략별 목표 수집 완료 확률 곡선과 최초 목표 달성 Pull 수.
     */
    static calculate3StarCompletionCdf({
        pickupCount,
        targetCount,
        individualPickupRate,
        step4PickupTotalRate,
        maxLoops,
        loopRewards,
        ceilingMode,
        step4Mode,
        randomTicketMode,
        targetProbability = 0.9,
        targetMode = 'snipe'
    }) {
        const labels = [];
        const normalOnlyCompletionCdf = [];
        const comparedStrategyCompletionCdf = [];
        const maxStepupPulls = maxLoops * GACHA_RULES.STAR3.STEPUP_CYCLE;
        const simulationOptions = {
            pickupCount,
            targetCount,
            individualPickupRate,
            step4PickupTotalRate,
            maxStepupPulls,
            loopRewards,
            ceilingMode,
            step4Mode,
            randomTicketMode,
            targetMode
        };

        let normalOnlyRequiredPulls = null;
        let comparedStrategyRequiredPulls = null;

        for (let pulls = 0; pulls <= CHART_RANGE.EFFICIENCY_MAX_PULLS; pulls++) {
            labels.push(pulls);
            const { normalOnlyCollectionDp, stepupFirstCollectionDp } =
                this._simulate3StarStrategies(pulls, simulationOptions);

            const comparedStrategyProbability = stepupFirstCollectionDp[targetCount] * 100;
            comparedStrategyCompletionCdf.push(comparedStrategyProbability);
            if (comparedStrategyRequiredPulls === null
                && comparedStrategyProbability >= targetProbability * 100) {
                comparedStrategyRequiredPulls = pulls;
            }

            const normalOnlyProbability = normalOnlyCollectionDp[targetCount] * 100;
            normalOnlyCompletionCdf.push(normalOnlyProbability);
            if (normalOnlyRequiredPulls === null && normalOnlyProbability >= targetProbability * 100) {
                normalOnlyRequiredPulls = pulls;
            }
        }

        return {
            labels,
            normalOnlyCompletionCdf,
            comparedStrategyCompletionCdf,
            normalOnlyRequiredPulls,
            comparedStrategyRequiredPulls,
            comparedStrategyKind: STEPUP_STRATEGY_KIND.STEPUP_FIRST
        };
    }

    /**
     * 생일/콜라보 타입의 일반과 해당 스탭업 전략 비교 데이터.
     */
    static calculateRateBoostStepupComparison({
        normalPickupRate,
        stepupPickupRate,
        ceilingMode,
        guaranteedTargetMode,
        guaranteedTargetPullInterval,
        sharedSelectRewardInterval,
        targetCount,
        maxStepupPulls,
        comparedStrategyKind
    }) {
        const labels = [];
        const normalOnlyData = [];
        const comparedStrategyData = [];
        const simulationOptions = {
            targetCount,
            normalPickupRate,
            stepupPickupRate,
            maxStepupPulls,
            sharedSelectRewardInterval,
            guaranteedTargetPullInterval,
            guaranteedTargetMode,
            ceilingMode
        };

        for (let pulls = 0; pulls <= CHART_RANGE.EFFICIENCY_MAX_PULLS; pulls++) {
            labels.push(pulls);
            const { normalOnlyCollectionDp, comparedStrategyCollectionDp } =
                this._simulateRateBoostStepupStrategies(pulls, simulationOptions);
            normalOnlyData.push({
                best: normalOnlyCollectionDp[targetCount] * 100,
                worst: normalOnlyCollectionDp[0] * 100
            });
            comparedStrategyData.push({
                best: comparedStrategyCollectionDp[targetCount] * 100,
                worst: comparedStrategyCollectionDp[0] * 100
            });
        }

        return { labels, normalOnlyData, comparedStrategyData, comparedStrategyKind };
    }

    /**
     * 생일/콜라보 타입의 전략별 목표 수집 완료 확률 곡선과 최초 목표 달성 Pull 수.
     */
    static calculateRateBoostStepupCompletionCdf({
        normalPickupRate,
        stepupPickupRate,
        ceilingMode,
        guaranteedTargetMode,
        guaranteedTargetPullInterval,
        sharedSelectRewardInterval,
        targetCount,
        targetProbability,
        maxStepupPulls,
        comparedStrategyKind
    }) {
        const labels = [];
        const normalOnlyCompletionCdf = [];
        const comparedStrategyCompletionCdf = [];
        const simulationOptions = {
            targetCount,
            normalPickupRate,
            stepupPickupRate,
            maxStepupPulls,
            sharedSelectRewardInterval,
            guaranteedTargetPullInterval,
            guaranteedTargetMode,
            ceilingMode
        };

        let normalOnlyRequiredPulls = null;
        let comparedStrategyRequiredPulls = null;

        for (let pulls = 0; pulls <= CHART_RANGE.EFFICIENCY_MAX_PULLS; pulls++) {
            labels.push(pulls);
            const { normalOnlyCollectionDp, comparedStrategyCollectionDp } =
                this._simulateRateBoostStepupStrategies(pulls, simulationOptions);

            const comparedStrategyProbability = comparedStrategyCollectionDp[targetCount] * 100;
            comparedStrategyCompletionCdf.push(comparedStrategyProbability);
            if (comparedStrategyRequiredPulls === null
                && comparedStrategyProbability >= targetProbability * 100) {
                comparedStrategyRequiredPulls = pulls;
            }

            const normalOnlyProbability = normalOnlyCollectionDp[targetCount] * 100;
            normalOnlyCompletionCdf.push(normalOnlyProbability);
            if (normalOnlyRequiredPulls === null && normalOnlyProbability >= targetProbability * 100) {
                normalOnlyRequiredPulls = pulls;
            }
        }

        return {
            labels,
            normalOnlyCompletionCdf,
            comparedStrategyCompletionCdf,
            normalOnlyRequiredPulls,
            comparedStrategyRequiredPulls,
            comparedStrategyKind
        };
    }
}
