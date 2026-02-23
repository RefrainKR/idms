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
     * targetCount → M 변환 유틸
     * @param {number} N - 전체 픽업 수
     * @param {number} targetVal - 목표 수집 수 (0이면 전체)
     * @returns {number} 유효한 M 값
     */
    resolveTargetCount(N, targetVal) {
        let M = (targetVal === 0 || !targetVal) ? N : Number(targetVal);
        if (M > N) M = N;
        return M;
    }

    /**
     * 단순 스탭업 가챠 공통 계산 (Birthday/Collab 타입)
     * @param {Object} params
     * @param {Object} params.rules - GACHA_RULES의 해당 타입 (BIRTHDAY 또는 COLLAB)
     * @param {string} params.step3Mode - Step3 확정 모드 ('included'|'excluded')
     * @param {number} params.stepupLimit - 스탭업 최대 횟수
     * @param {number|null} params.stepupGuarantee - 확정 주기 (null이면 없음)
     * @returns {Object} { N, M, dp, dpTotal, ceilingCount, stepGuaranteed }
     */
    _runSimpleStepupCalculation({ rules, step3Mode, stepupLimit, stepupGuarantee }) {
        const N = this.model.pickupCount.value;
        const targetVal = this.model.targetCount.value;
        const M = this.resolveTargetCount(N, targetVal);

        const normalRate = this.model.normalRate.value / 100;
        const stepRate = this.model.stepRate.value / 100;
        const normalPulls = this.model.normalPulls.value;
        const stepPulls = this.model.stepPulls.value;
        const totalPulls = normalPulls + stepPulls;

        let dp = new Array(M + 1).fill(0);
        dp[0] = 1.0;
        let dpTotal = [1.0];

        // 1. 일반 가챠
        const p_normal_any = ProbabilityValidator.getTotalProb(normalRate, M);
        for (let i = 0; i < normalPulls; i++) {
            dp = ProbabilityEngine.runSinglePull(dp, normalRate);
            dpTotal = ProbabilityEngine.accumulateCountProb(dpTotal, p_normal_any);
        }

        // 2. 스탭업 가챠
        const p_step_any = ProbabilityValidator.getTotalProb(stepRate, M);
        for (let i = 1; i <= stepPulls; i++) {
            const isStep3 = stepupGuarantee && (i % stepupGuarantee === 0);

            if (isStep3 && step3Mode === 'included') {
                dp = ProbabilityEngine.runGuaranteedPull(dp);
                dpTotal = ProbabilityEngine.accumulateCountGuaranteed(dpTotal);
            } else {
                dp = ProbabilityEngine.runSinglePull(dp, stepRate);
                dpTotal = ProbabilityEngine.accumulateCountProb(dpTotal, p_step_any);
            }
        }

        // 3. 천장 처리
        let ceilingCount = 0;
        if (this.model.ceilingMode.value === 'included') {
            ceilingCount = Math.floor(totalPulls / rules.CEILING_INTERVAL);
            for (let i = 0; i < ceilingCount; i++) {
                dp = ProbabilityEngine.runGuaranteedPull(dp);
                dpTotal = ProbabilityEngine.accumulateCountGuaranteed(dpTotal);
            }
        }

        const stepGuaranteed = (stepupGuarantee && step3Mode === 'included')
            ? Math.floor(stepPulls / stepupGuarantee)
            : 0;

        return { N, M, dp, dpTotal, normalPulls, stepPulls, totalPulls, ceilingCount, stepGuaranteed };
    }

    /**
     * 단순 스탭업 효율 데이터 계산 공통 메서드
     */
    _getSimpleStepupEfficiency({ step3Mode, stepupLimit }) {
        const N = this.model.pickupCount.value;
        const M = this.resolveTargetCount(N, this.model.targetCount.value);

        return EfficiencyCalculator.calculateSimpleStepup({
            normalRate: this.model.normalRate.value / 100,
            stepRate: this.model.stepRate.value / 100,
            ceilingMode: this.model.ceilingMode.value,
            step3Mode,
            N,
            M,
            stepupLimit
        });
    }

    /**
     * 단순 스탭업 CDF 데이터 계산 공통 메서드
     */
    _getSimpleStepupCDF({ step3Mode, stepupLimit }) {
        const N = this.model.pickupCount.value;
        const M = this.resolveTargetCount(N, this.model.targetCount.value);
        const targetProb = this.model.targetProbability.value / 100;

        return EfficiencyCalculator.calculateSimpleStepupCDF({
            normalRate: this.model.normalRate.value / 100,
            stepRate: this.model.stepRate.value / 100,
            ceilingMode: this.model.ceilingMode.value,
            step3Mode,
            M,
            targetProb,
            stepupLimit
        });
    }

    calculate() { throw new Error("Implement calculate()"); }
}