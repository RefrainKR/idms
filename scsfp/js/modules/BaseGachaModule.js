import { storageManager } from '../lib/utils/StorageManager.js';
import { InputNumberElement } from '../lib/utils/InputNumberElement.js';
import { EXCLUDE_SAVE_IDS } from '../config.js';

/**
 * 가챠 계산기 모듈의 공통 기능을 담당하는 베이스 클래스
 */
export class BaseGachaModule {
    /**
     * @param {string} moduleType - 모듈 식별자 ('star3' 또는 'star2')
     * @param {Object} config - config.js에 정의된 해당 모듈의 설정 (KEY, INPUTS 포함)
     */
    constructor(moduleType, config) {
        this.moduleType = moduleType;
        this.config = config;
        
        // 입력 필드 인스턴스(InputNumberElement)들을 저장할 객체
        this.inputs = {};
        
        // 계산 결과를 담아둘 캐시
        this.cache = null;
        
        // Chart.js 인스턴스들을 관리할 참조 객체 (각 서브탭별)
        this.chartRefs = {
            collection: { current: null },
            total: { current: null },
            specific: { current: null },
            efficiency: { current: null }
        };
        
        // 초기화 중에는 콜백 실행을 방지하기 위한 플래그
        this.isInitializing = true;
    }

    /**
     * 입력 필드를 초기화하고 이벤트를 바인딩합니다.
     * @param {Function} additionalInitLogic - 하위 클래스에서 실행할 추가 초기화 로직 (옵션)
     */
    initInputs(additionalInitLogic = null) {
        const savedData = storageManager.load(this.config.KEY) || {};
        
        this.config.INPUTS.forEach(cfg => {
            const el = document.getElementById(cfg.id);
            if (!el) {
                console.warn(`[${this.moduleType}] Element not found: ${cfg.id}`);
                return;
            }

            // 저장된 데이터가 있으면 사용하고, 없으면 기본값(def) 사용
            // 단, EXCLUDE_SAVE_IDS에 포함된 항목(예: 시행횟수)은 항상 0으로 초기화
            let initialVal;
            if (EXCLUDE_SAVE_IDS.includes(cfg.id)) {
                initialVal = 0;
            } else if (savedData[cfg.id] !== undefined && savedData[cfg.id] !== null && savedData[cfg.id] !== "") {
                initialVal = savedData[cfg.id];
            } else {
                initialVal = cfg.def;
            }

            // InputNumberElement 생성 및 콜백 등록
            this.inputs[cfg.id] = new InputNumberElement(el, cfg.min, cfg.max, initialVal, (val) => {
                // 초기화가 완료된 후에만 입력 변경에 따른 재계산 실행
                if (!this.isInitializing) {
                    this.onInputChange(cfg.id, val);
                }
            });
        });

        // 하위 클래스(Star3 등)에서 필요한 추가 로직(예: 루프 보상 UI 생성) 실행
        if (typeof additionalInitLogic === 'function') {
            additionalInitLogic(savedData);
        }
        
        // 초기화 완료 플래그 전환 및 첫 계산 수행
        this.isInitializing = false;
        this.calculate();
    }

    /**
     * 입력값이 변경되었을 때 실행되는 기본 핸들러입니다.
     * 하위 클래스에서 특정 ID에 대한 처리가 필요하면 오버라이드할 수 있습니다.
     */
    onInputChange(id, value) {
        this.calculate();
    }

    /**
     * 현재 입력 필드들의 상태를 localStorage에 저장합니다.
     * @param {Object} extraData - 입력 필드 외에 추가로 저장할 데이터 (예: loopRewards)
     */
    saveData(extraData = {}) {
        if (this.isInitializing) return;

        const dataToSave = { ...extraData };
        this.config.INPUTS.forEach(cfg => {
            // 저장 제외 대상이 아닌 경우에만 저장
            if (!EXCLUDE_SAVE_IDS.includes(cfg.id) && this.inputs[cfg.id]) {
                dataToSave[cfg.id] = this.inputs[cfg.id].getValue();
            }
        });

        storageManager.save(this.config.KEY, dataToSave);
    }

    /**
     * 모든 설정을 초기 상태로 되돌립니다.
     * @param {Function} additionalResetLogic - 하위 클래스에서 실행할 추가 리셋 로직 (옵션)
     */
    reset(additionalResetLogic = null) {
        const label = this.moduleType === 'star3' ? '3성' : '2성';
        if (!confirm(`${label} 탭의 모든 설정을 초기화하시겠습니까?`)) return;

        // 저장된 데이터 삭제
        storageManager.remove(this.config.KEY);

        // 입력 필드들을 기본값으로 복구 (콜백은 마지막에 한 번만 실행되도록 false 처리)
        this.config.INPUTS.forEach(cfg => {
            if (this.inputs[cfg.id]) {
                this.inputs[cfg.id].setValue(cfg.def, false);
            }
        });

        // 하위 클래스 추가 리셋 (예: 루프 셀렉트 박스 초기화 등)
        if (typeof additionalResetLogic === 'function') {
            additionalResetLogic();
        }

        // 최종 재계산 및 UI 갱신
        this.calculate();
    }

    /**
     * [추상 메서드] 확률 계산 로직 - 하위 클래스에서 반드시 구현해야 함
     */
    calculate() {
        throw new Error(`[${this.moduleType}] calculate() 메서드가 구현되지 않았습니다.`);
    }

    /**
     * [추상 메서드] 결과 화면 렌더링 - 하위 클래스에서 반드시 구현해야 함
     */
    renderUI() {
        throw new Error(`[${this.moduleType}] renderUI() 메서드가 구현되지 않았습니다.`);
    }
}