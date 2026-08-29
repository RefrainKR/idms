import { StorageManager } from '../../utils/StorageManager.js';
import { InputBinder } from '../../component/InputBinder.js';
import { ProbabilityEngine } from '../../core/ProbabilityEngine.js';
import { EfficiencyCalculator } from '../../core/EfficiencyCalculator.js';
import { ProbabilityValidator } from '../../utils/ProbabilityValidator.js';
import { GACHA_RULES } from '../../config/GachaConfig.js';
import { BaseViewModel } from '../BaseViewModel.js';

export class BaseGachaViewModel extends BaseViewModel {
    constructor(storageKey, config) {
        super();
        this.storageKey = storageKey;
        this.config = config;
        this.model = null;
    }

    init() {
        const savedData = StorageManager.load(this.storageKey);
        if (savedData && this.model) {
            this.model.fromJSON(savedData);
        }

        // Dependencies 적용 (fromJSON 이후, bindInputs 전에 실행하여 maxObserver가 올바르게 설정되도록)
        this.applyDependencies();

        for (const key in this.model) {
            if (this.model[key].subscribe) { // Observable 인지 확인
                const unsubscribe = this.model[key].subscribe(() => {
                    if (!this.isInitializing) {
                        this.calculate();
                        this.save();
                        // targetProbability는 공유 설정이므로 별도 저장
                        if (key === 'targetProbability') {
                            StorageManager.saveSharedSettings();
                        }
                    }
                });
                this._subscriptions.push(unsubscribe); // 저장
            }
        }

        this.bindInputs(); // InputBinder 연결
        this.isInitializing = false;
        this.calculate();
    }

    /**
     * CONFIG.DEPENDENCIES에서 정의된 Observable 의존성 자동 적용
     * setupDataDependencies()를 대체하는 범용 메서드
     */
    applyDependencies() {
        if (!this.config || !this.config.DEPENDENCIES) return;

        this.config.DEPENDENCIES.forEach(dep => {
            const sourceObservable = this.model[dep.source];
            if (!sourceObservable || !sourceObservable.subscribe) {
                console.warn(`Dependency source '${dep.source}' not found in model`);
                return;
            }

            // 초기값 즉시 적용 (isInitializing=true 상태에서도 실행)
            dep.handler(sourceObservable.value, this.model, this);

            // 이후 변경사항 구독
            const unsubscribe = sourceObservable.subscribe((value) => {
                if (!this.isInitializing) {
                    dep.handler(value, this.model, this);
                }
            });

            this._subscriptions.push(unsubscribe);
        });
    }

    bindInputs() {
        if (!this.inputsMap) return;

        const configMap = new Map();
        // [보완] this.config와 this.config.INPUTS가 존재하는지 안전하게 체크
        if (this.config && this.config.INPUTS) {
            this.config.INPUTS.forEach(i => configMap.set(i.id, i));
        }

        for (const [id, obs] of Object.entries(this.inputsMap)) {
            const el = document.getElementById(id);
            if (!el) continue;

            const setting = configMap.get(id) || {};
            let binderOptions = {
                type: setting.type || 'float',  // CONFIG에서 명시적으로 가져옴
                min: setting.min,
                max: setting.max,
                def: setting.def
            };

            // [신규] 자식 클래스에서 추가 옵션을 줄 수 있는 훅(Hook)
            if (this.getCustomBinderOptions) {
                const customOpts = this.getCustomBinderOptions(id);
                if (customOpts) {
                    binderOptions = { ...binderOptions, ...customOpts };
                }
            }

            // InputBinder 인스턴스 생성 및 저장
            const binder = new InputBinder(el, obs, binderOptions);
            this._inputBinders.push(binder);
        }
    }

    reset() {
        if (confirm("설정을 초기화하시겠습니까?")) {
            StorageManager.remove(this.storageKey);
            location.reload();
        }
    }

    save() {
        if (this.isInitializing || !this.model) return;
        StorageManager.save(this.storageKey, this.model.toJSON());
    }

    /**
     * 가챠 설정 dialog의 열기, 닫기와 backdrop 클릭을 공통 연결한다.
     */
    bindSettingsDialog(dialogId, openButtonId) {
        const dialog = document.getElementById(dialogId);
        const openButton = document.getElementById(openButtonId);
        if (!dialog || !openButton) return;

        openButton.addEventListener('click', () => {
            if (typeof dialog.showModal === 'function') dialog.showModal();
            else dialog.setAttribute('open', '');
        });

        const closeDialog = () => {
            if (typeof dialog.close === 'function') dialog.close();
            else {
                dialog.removeAttribute('open');
                openButton.focus();
            }
        };

        dialog.querySelectorAll('[data-dialog-close]').forEach((button) => {
            button.addEventListener('click', closeDialog);
        });
        dialog.addEventListener('click', (event) => {
            if (event.target === dialog) closeDialog();
        });
        dialog.addEventListener('close', () => openButton.focus());
    }

    /** 모바일에서 수집 차트와 확률표를 같은 결과 영역 안에서 교체한다. */
    bindMobileCollectionViewToggle(buttonId, contentId) {
        const button = document.getElementById(buttonId);
        const content = document.getElementById(contentId);
        if (!button || !content) return;

        const setView = (view) => {
            content.dataset.mobileView = view;
            const isLegend = view === 'legend';
            button.textContent = isLegend ? '차트' : '확률표';
            button.setAttribute('aria-pressed', String(isLegend));
        };

        setView(content.dataset.mobileView || 'chart');
        button.addEventListener('click', () => {
            setView(content.dataset.mobileView === 'chart' ? 'legend' : 'chart');
        });
    }

    /**
     * 사용자 입력을 유효한 목표 수집 수로 변환한다. 0은 전체 수집을 뜻한다.
     */
    resolveTargetCount(pickupCount, targetCountInput) {
        let targetCount = (targetCountInput === 0 || !targetCountInput)
            ? pickupCount
            : Number(targetCountInput);
        if (targetCount > pickupCount) targetCount = pickupCount;
        return targetCount;
    }

    /**
     * 단순 스탭업 가챠 공통 계산 (Birthday/Collab 타입)
     * @param {Object} params
     * @param {Object} params.rules - GACHA_RULES의 해당 타입 (BIRTHDAY 또는 COLLAB)
     * @param {string} params.guaranteedTargetMode - 확정 획득 반영 모드
     * @param {number|null} params.guaranteedTargetPullInterval - 확정 획득 회차 간격
     */
    _runRateBoostStepupCalculation({
        rules,
        guaranteedTargetMode,
        guaranteedTargetPullInterval
    }) {
        const pickupCount = this.model.pickupCount.value;
        const targetCount = this.resolveTargetCount(pickupCount, this.model.targetCount.value);

        const normalRate = this.model.normalRate.value / 100;
        const stepRate = this.model.stepRate.value / 100;
        const normalPulls = this.model.normalPulls.value;
        const stepPulls = this.model.stepPulls.value;
        const totalPulls = normalPulls + stepPulls;

        let collectionDp = new Array(targetCount + 1).fill(0);
        collectionDp[0] = 1.0;
        let totalAcquisitionDp = [1.0];

        // 1. 일반 가챠
        const p_normal_any = ProbabilityValidator.getTotalProb(normalRate, targetCount);
        for (let i = 0; i < normalPulls; i++) {
            collectionDp = ProbabilityEngine.runSinglePull(collectionDp, normalRate);
            totalAcquisitionDp = ProbabilityEngine.accumulateCountProb(totalAcquisitionDp, p_normal_any);
        }

        // 2. 스탭업 가챠
        const p_step_any = ProbabilityValidator.getTotalProb(stepRate, targetCount);
        for (let i = 1; i <= stepPulls; i++) {
            const isGuaranteedTargetPull = guaranteedTargetPullInterval
                && i % guaranteedTargetPullInterval === 0;

            if (isGuaranteedTargetPull && guaranteedTargetMode === 'included') {
                collectionDp = ProbabilityEngine.runGuaranteedPull(collectionDp);
                totalAcquisitionDp = ProbabilityEngine.accumulateCountGuaranteed(totalAcquisitionDp);
            } else {
                collectionDp = ProbabilityEngine.runSinglePull(collectionDp, stepRate);
                totalAcquisitionDp = ProbabilityEngine.accumulateCountProb(totalAcquisitionDp, p_step_any);
            }
        }

        // 3. 천장 처리
        let sharedSelectRewardCount = 0;
        if (this.model.ceilingMode.value === 'included') {
            sharedSelectRewardCount = Math.floor(totalPulls / rules.SHARED_SELECT_REWARD_INTERVAL);
            for (let i = 0; i < sharedSelectRewardCount; i++) {
                collectionDp = ProbabilityEngine.runGuaranteedPull(collectionDp);
                totalAcquisitionDp = ProbabilityEngine.accumulateCountGuaranteed(totalAcquisitionDp);
            }
        }

        const guaranteedTargetCount = (guaranteedTargetPullInterval && guaranteedTargetMode === 'included')
            ? Math.floor(stepPulls / guaranteedTargetPullInterval)
            : 0;

        return {
            pickupCount,
            targetCount,
            collectionDp,
            totalAcquisitionDp,
            normalPulls,
            stepPulls,
            totalPulls,
            sharedSelectRewardCount,
            guaranteedTargetCount
        };
    }

    /**
     * 단순 스탭업 효율 데이터 계산 공통 메서드
     */
    _calculateRateBoostStepupComparison({
        rules,
        guaranteedTargetMode,
        guaranteedTargetPullInterval,
        maxStepupPulls,
        comparedStrategyKind
    }) {
        const targetCount = this.resolveTargetCount(
            this.model.pickupCount.value,
            this.model.targetCount.value
        );

        return EfficiencyCalculator.calculateRateBoostStepupComparison({
            normalPickupRate: this.model.normalRate.value / 100,
            stepupPickupRate: this.model.stepRate.value / 100,
            ceilingMode: this.model.ceilingMode.value,
            guaranteedTargetMode,
            guaranteedTargetPullInterval,
            sharedSelectRewardInterval: rules.SHARED_SELECT_REWARD_INTERVAL,
            targetCount,
            maxStepupPulls,
            comparedStrategyKind
        });
    }

    /**
     * 단순 스탭업 CDF 데이터 계산 공통 메서드
     */
    _calculateRateBoostStepupCompletionCdf({
        rules,
        guaranteedTargetMode,
        guaranteedTargetPullInterval,
        maxStepupPulls,
        comparedStrategyKind
    }) {
        const targetCount = this.resolveTargetCount(
            this.model.pickupCount.value,
            this.model.targetCount.value
        );

        return EfficiencyCalculator.calculateRateBoostStepupCompletionCdf({
            normalPickupRate: this.model.normalRate.value / 100,
            stepupPickupRate: this.model.stepRate.value / 100,
            ceilingMode: this.model.ceilingMode.value,
            guaranteedTargetMode,
            guaranteedTargetPullInterval,
            sharedSelectRewardInterval: rules.SHARED_SELECT_REWARD_INTERVAL,
            targetCount,
            targetProbability: this.model.targetProbability.value / 100,
            maxStepupPulls,
            comparedStrategyKind
        });
    }

    calculate() { throw new Error("Implement calculate()"); }
}
