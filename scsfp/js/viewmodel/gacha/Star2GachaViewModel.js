import { BaseGachaViewModel } from './BaseGachaViewModel.js';
import { Star2GachaModel } from '../../model/gacha/Star2GachaModel.js';
import { ProbabilityEngine } from '../../core/ProbabilityEngine.js';
import { EfficiencyCalculator } from '../../core/EfficiencyCalculator.js';
import { GachaResultView } from '../../view/gacha/GachaResultView.js';
import { ToggleButton } from '../../component/ToggleButton.js';
import { CONFIG, TOGGLE_STATES, GACHA_RULES } from '../../config/GachaConfig.js';
import { ProbabilityValidator } from '../../utils/ProbabilityValidator.js';
import { getGachaConfig, applyTabVisibility } from '../../view/gacha/GachaViewConfig.js';

export class Star2GachaViewModel extends BaseGachaViewModel {
    constructor() {
        super(CONFIG.STAR2.KEY, CONFIG.STAR2);
        this.model = new Star2GachaModel();
        
        this.inputsMap = {
            'star2-pickupCount': this.model.pickupCount,
            'star2-pickupRate': this.model.pickupRate,
            'star2-normalPulls': this.model.normalPulls,
        };
        ['A', 'B', 'C', 'D'].forEach(g => {
            this.inputsMap[`star2-countStep${g}`] = this.model[`countStep${g}`];
            this.inputsMap[`star2-pullsStep${g}`] = this.model[`pullsStep${g}`];
            this.inputsMap[`star2-targetCount${g}`] = this.model[`targetCount${g}`];
        });

        this.chartRefs = { collection: { current: null }, total: { current: null }, efficiency: { current: null }, specific: { current: null } };
    }

    init() {
        super.init(); // fromJSON → applyDependencies → bindInputs 순서로 실행됨

        this.bindToggles();

        const resetBtn = document.getElementById('star2-reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }
    }

    bindToggles() {
        new ToggleButton('star2-toggle-ceiling', TOGGLE_STATES.CEILING, (state) => {
            this.model.ceilingMode.value = state.name;
        }, this.model.ceilingMode.value);

        new ToggleButton('star2-toggle-view', TOGGLE_STATES.VIEW, (state) => {
            this.model.viewMode.value = state.name;
        }, this.model.viewMode.value);

        new ToggleButton('star2-group-view-mode', TOGGLE_STATES.GROUPS_VIEW, (s) => {
            this.model.viewTargetGroup.value = s.name;
            this.calculate();
        }, this.model.viewTargetGroup.value);

        new ToggleButton('star2-group-efficiency-mode', TOGGLE_STATES.GROUPS_EFF, (s) => {
            this.model.efficiencyTargetGroup.value = s.name;
            this.calculate();
        }, this.model.efficiencyTargetGroup.value);

        new ToggleButton('star2-efficiency-toggle', TOGGLE_STATES.EFFICIENCY, (s) => {
            this.model.efficiencyMode.value = s.name;
            this.calculate();
        }, this.model.efficiencyMode.value);
    }

    onTabChange(tabId) {
        this.calculate();

        const config = getGachaConfig('star2');
        applyTabVisibility(config, tabId);
    }

    // setupDataDependencies 제거됨 - CONFIG.STAR2.DEPENDENCIES로 대체

    getCustomBinderOptions(id) {
        // id가 star2-targetCountA 형식이면 countStepA를 감시
        if (id.startsWith('star2-targetCount')) {
            const group = id.slice(-1); // 'A'
            return { maxObserver: this.model[`countStep${group}`] };
        }
        return null;
    }

    calculate() {
        if (this.isInitializing) return;

        const totalPickupRate = this.model.pickupRate.value / 100;
        const totalPickupCount = this.model.pickupCount.value;
        const normalPulls = this.model.normalPulls.value;

        const targetInputs = ['A', 'B', 'C', 'D'].map(id => this.model[`targetCount${id}`].value);
        const isAllZero = targetInputs.every(v => v === 0);

        const viewGroup = this.model.viewTargetGroup.value; // 'ALL', 'A'...

        const groups = ['A', 'B', 'C', 'D'].map(id => {
            const pickupCount = this.model[`countStep${id}`].value;
            let targetCount = this.model[`targetCount${id}`].value;
            
            // [핵심] ALL 모드가 아니고 내 그룹이 아니면 저격 수 0 처리
            if (viewGroup !== 'ALL' && viewGroup !== id) {
                targetCount = 0;
            }
            if (isAllZero) {
                // 전부 0이면 기존처럼 그룹 전체 수집으로 동작
                targetCount = pickupCount;
            } else {
                // 하나라도 입력된 게 있다면, 0은 0으로 처리 (보정만 수행)
                if (targetCount > pickupCount) targetCount = pickupCount;
                if (targetCount < 0) targetCount = 0;
            }
            return {
                id,
                pickupCount,
                targetCount,
                stepupPulls: this.model[`pullsStep${id}`].value
            };
        });

        const groupedPickupCount = groups.reduce((sum, group) => sum + group.pickupCount, 0);
        if (totalPickupCount !== groupedPickupCount) {
            const star2Config = getGachaConfig('star2');
            const summaryId = star2Config ? star2Config.summary.element : 'gachaSummary';
            document.getElementById(summaryId).innerHTML = `<span class="validation-error">오류: 픽업 합계 불일치 (${totalPickupCount} vs ${groupedPickupCount})</span>`;
            return;
        }

        let collectionDp = [1.0];
        let totalAcquisitionDp = [1.0];
        let totalTargetCount = 0;
        let totalStepupPulls = 0;

        groups.forEach(group => {
            const groupResult = ProbabilityEngine.calcStepupGroup(
                group.pickupCount,
                group.targetCount,
                group.stepupPulls,
                totalPickupRate
            );
            collectionDp = ProbabilityEngine.convolve(collectionDp, groupResult.collectionDp);
            totalAcquisitionDp = ProbabilityEngine.convolve(
                totalAcquisitionDp,
                groupResult.totalAcquisitionDp
            );
            
            totalTargetCount += group.targetCount;
            totalStepupPulls += group.stepupPulls;
        });

        const normalIndividualPickupRate = totalPickupRate / totalPickupCount;
        const guaranteedSlotIndividualPickupRate = GACHA_RULES.STAR2.HIGH_RATE_PROBABILITY
            / totalPickupCount;
        
        const anyNormalTargetRate = ProbabilityValidator.getTotalProb(
            normalIndividualPickupRate,
            totalTargetCount
        );
        const anyGuaranteedSlotTargetRate = ProbabilityValidator.getTotalProb(
            guaranteedSlotIndividualPickupRate,
            totalTargetCount
        );

        for (let i = 1; i <= normalPulls; i++) {
            const isHigh = (i % GACHA_RULES.STAR2.HIGH_RATE_INTERVAL === 0);
            collectionDp = ProbabilityEngine.runSinglePull(
                collectionDp,
                isHigh ? guaranteedSlotIndividualPickupRate : normalIndividualPickupRate
            );
            totalAcquisitionDp = ProbabilityEngine.accumulateCountProb(
                totalAcquisitionDp,
                isHigh ? anyGuaranteedSlotTargetRate : anyNormalTargetRate
            );
        }

        // Normal 100스택과 Step-up 50스택은 서로 공유하지 않는다.
        const normalSelectRewardCount = Math.floor(
            normalPulls / GACHA_RULES.STAR2.NORMAL_SELECT_REWARD_INTERVAL
        );
        const stepupSelectRewardCount = Math.floor(
            totalStepupPulls / GACHA_RULES.STAR2.STEPUP_SELECT_REWARD_INTERVAL
        );
        const totalGuaranteedSelectCount = normalSelectRewardCount + stepupSelectRewardCount;
        if (this.model.ceilingMode.value === 'included') {
            for (let i = 0; i < totalGuaranteedSelectCount; i++) {
                collectionDp = ProbabilityEngine.runGuaranteedPull(collectionDp);
                totalAcquisitionDp = ProbabilityEngine.accumulateCountGuaranteed(totalAcquisitionDp);
            }
        }

        // 타겟 그룹 정보 설정
        let gid = this.model.efficiencyTargetGroup.value;
        if (!gid || !['A', 'B', 'C', 'D'].includes(gid)) gid = 'A';
        
        const targetGroupInfo = { 
            id: gid, 
            targetCount: isAllZero
                ? this.model[`countStep${gid}`].value
                : this.model[`targetCount${gid}`].value
        };

        const context = { 
            groups,
            totalPulls: normalPulls + totalStepupPulls,
            normalPulls,
            totalStepupPulls,
            normalSelectRewardCount,
            stepupSelectRewardCount,
            totalGuaranteedSelectCount,
            totalPickupRate,
            strategyComparison: this._calculateStrategyComparison(isAllZero),
            targetGroupInfo,
            pickupCount: totalPickupCount,
            targetCount: totalTargetCount,
            ceilingMode: this.model.ceilingMode.value
        };

        GachaResultView.render('star2', {
            pickupCount: totalPickupCount,
            targetCount: totalTargetCount,
            collectionDp,
            totalAcquisitionDp
        }, context, this.model, this.chartRefs);
    }

    _calculateStrategyComparison(isAllZero) {
        let gid = this.model.efficiencyTargetGroup.value || 'A';
        const groupPickupCount = this.model[`countStep${gid}`].value;

        let groupTargetCount = isAllZero
            ? groupPickupCount
            : this.model[`targetCount${gid}`].value;
        if (groupTargetCount > groupPickupCount) groupTargetCount = groupPickupCount;

        const totalPickupCount = this.model.pickupCount.value;
        const totalPickupRate = this.model.pickupRate.value / 100;

        return EfficiencyCalculator.calculate2StarComparison({
            groupPickupCount,
            groupTargetCount,
            totalPickupCount,
            totalPickupRate,
            ceilingMode: this.model.ceilingMode.value
        });
    }
}
