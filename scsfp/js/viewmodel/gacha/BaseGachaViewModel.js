import { StorageManager } from '../../utils/StorageManager.js';
import { InputBinder } from '../../view/component/InputBinder.js';

export class BaseGachaViewModel {
    constructor(storageKey, config) { // config 인자 추가
        this.storageKey = storageKey;
        this.config = config;
        this.model = null;
        this.isInitializing = true;
        this._subscriptions = []; // 구독 해제 함수 저장
    }

    init() {
        const savedData = StorageManager.load(this.storageKey);
        if (savedData && this.model) {
            this.model.fromJSON(savedData);
        }

        for (const key in this.model) {
            if (this.model[key].subscribe) { // Observable 인지 확인
                const unsubscribe = this.model[key].subscribe(() => {
                    if (!this.isInitializing) {
                        this.calculate();
                        this.save();
                    }
                });
                this._subscriptions.push(unsubscribe); // 저장
            }
        }

        this.bindInputs(); // InputBinder 연결
        this.isInitializing = false;
        this.calculate();
    }

    destroy() {
        // 모든 구독 해제
        this._subscriptions.forEach(unsubscribe => unsubscribe());
        this._subscriptions = [];
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

            InputBinder.bind(el, obs, binderOptions);
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

    calculate() { throw new Error("Implement calculate()"); }
}