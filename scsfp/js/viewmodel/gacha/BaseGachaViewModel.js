import { StorageManager } from '../../utils/StorageManager.js';
import { InputBinder } from '../../view/component/InputBinder.js';

export class BaseGachaViewModel {
    constructor(storageKey, config) { // config 인자 추가
        this.storageKey = storageKey;
        this.config = config;
        this.model = null;
        this.isInitializing = true;
    }

    init() {
        const savedData = StorageManager.load(this.storageKey);
        if (savedData && this.model) {
            this.model.fromJSON(savedData);
        }

        for (const key in this.model) {
            if (this.model[key].subscribe) { // Observable 인지 확인
                this.model[key].subscribe(() => {
                    if (!this.isInitializing) {
                        this.calculate();
                        this.save();
                    }
                });
            }
        }

        this.bindInputs(); // InputBinder 연결
        this.isInitializing = false;
        this.calculate();
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
                type: (el.step === '1' || id.toLowerCase().includes('pulls') || id.toLowerCase().includes('count')) ? 'int' : 'float',
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