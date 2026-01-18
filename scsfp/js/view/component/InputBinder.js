export class InputBinder {
    /**
     * @param {HTMLElement} element 
     * @param {Observable} observable 
     * @param {Object} options { min, max, def, type, maxObserver: Observable }
     */
    static bind(element, observable, options = {}) {
        if (!element || !observable) return;

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
            options.maxObserver.subscribe((newMax) => {
                currentMax = newMax;
                
                // 현재 값이 새 Max보다 크다면 즉시 깎음
                if (observable.value > newMax) {
                    observable.value = newMax;
                    element.value = newMax;
                }
            });
        }

        let previousValue = observable.value;

        observable.subscribe((val) => {
            if (document.activeElement !== element) {
                element.value = val;
                previousValue = val;
            }
        });

        element.addEventListener('focus', () => {
            previousValue = isInt ? parseInt(element.value) : parseFloat(element.value);
            element.value = '';
        });

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

        element.addEventListener('change', commitValue);
        element.addEventListener('blur', commitValue);
        element.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); element.blur(); } });
        
        element.value = observable.value;
    }
}