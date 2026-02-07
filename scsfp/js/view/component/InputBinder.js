export class InputBinder {
    /**
     * @param {HTMLElement} element
     * @param {Observable} observable
     * @param {Object} options { min, max, def, type, maxObserver: Observable }
     */
    constructor(element, observable, options = {}) {
        if (!element || !observable) {
            this.element = null;
            this.unsubscribes = [];
            return;
        }

        this.element = element;
        this.observable = observable;
        this.options = options;
        this.unsubscribes = []; // 구독 해제 함수 수집

        this._bind();
    }

    _bind() {
        const { element, observable, options } = this;

        const isInt = options.type === 'int';
        let currentMax = options.max !== undefined ? options.max : Infinity;

        // [수정] 동적 Max 감지 로직 - HTML 속성 변경 없이 내부 변수만 관리
        if (options.maxObserver) {
            // 초기값 설정
            currentMax = options.maxObserver.value;

            // 초기 값이 Max를 초과하면 즉시 보정
            if (observable.value > currentMax) {
                observable.value = currentMax;
                element.value = currentMax;
            }

            // 이후 변경사항 감지
            const unsubMax = options.maxObserver.subscribe((newMax) => {
                currentMax = newMax;

                // 현재 값이 새 Max보다 크다면 즉시 깎음
                if (observable.value > newMax) {
                    observable.value = newMax;
                    element.value = newMax;
                }
            });
            this.unsubscribes.push(unsubMax);
        }

        let previousValue = observable.value;

        const unsubObs = observable.subscribe((val) => {
            if (document.activeElement !== element) {
                element.value = val;
                previousValue = val;
            }
        });
        this.unsubscribes.push(unsubObs);

        const onFocus = () => {
            previousValue = isInt ? parseInt(element.value) : parseFloat(element.value);
            element.value = '';
        };

        const commitValue = () => {
            let rawVal = element.value;
            if (rawVal.trim() === '') { element.value = previousValue; return; }

            let val = isInt ? parseInt(rawVal) : parseFloat(rawVal);
            if (isNaN(val)) { element.value = previousValue; return; }

            // 범위 제한 (options.min과 동적 currentMax 사용)
            const min = options.min !== undefined ? options.min : -Infinity;

            if (val < min) val = min;
            if (val > currentMax) val = currentMax;

            element.value = val;
            if (observable.value !== val) {
                observable.value = val;
                previousValue = val;
            } else {
                element.value = val;
            }
        };

        const onKeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                element.blur();
            }
        };

        element.addEventListener('focus', onFocus);
        element.addEventListener('change', commitValue);
        element.addEventListener('blur', commitValue);
        element.addEventListener('keydown', onKeydown);

        // 이벤트 리스너 해제 함수도 저장
        this.unsubscribes.push(() => {
            element.removeEventListener('focus', onFocus);
            element.removeEventListener('change', commitValue);
            element.removeEventListener('blur', commitValue);
            element.removeEventListener('keydown', onKeydown);
        });

        element.value = observable.value;
    }

    /**
     * 모든 구독 및 이벤트 리스너 해제
     */
    destroy() {
        this.unsubscribes.forEach(unsub => unsub());
        this.unsubscribes = [];
        this.element = null;
        this.observable = null;
        this.options = null;
    }
}