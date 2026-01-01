
export class InputNumberElement {
    constructor(inputElement, min, max, defaultValue, changeCallback, fallbackValueOnBlank = null) {
        if (!inputElement) {
            console.error("InputNumberElement: inputElement is not provided.");
            return;
        }
        this.inputElement = inputElement;
        this.min = min;
        this.max = max;
        this.defaultValue = defaultValue;

        this.changeCallback = changeCallback;
        this.fallbackValueOnBlank = fallbackValueOnBlank;

        this.previousValue = null;

        this.inputElement.min = String(this.min);
        this.inputElement.max = String(this.max);

        // 확률 계산 등을 위해 소수점 지원이 필요하므로 parseFloat 사용
        const initialParsedValue = parseFloat(this.inputElement.value);
        
        if (isNaN(initialParsedValue)) {
            this.inputElement.value = String(defaultValue);
        } else {
            const validatedInitialValue = Math.max(this.min, Math.min(this.max, initialParsedValue));
            this.inputElement.value = String(validatedInitialValue);
        }
        
        this.bindEvents();
    }

    bindEvents() {
        this.inputElement.addEventListener('focus', this.handleFocus.bind(this));
        this.inputElement.addEventListener('blur', this.handleChange.bind(this)); 
        this.inputElement.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    handleFocus() {
        this.previousValue = this.getValue();
        this.inputElement.value = '';
    }

    handleChange() {
        let value = parseFloat(this.inputElement.value);
        let valueForCallback;
        let valueForDisplay;

        if (isNaN(value) || this.inputElement.value.trim() === '') {
            if (this.fallbackValueOnBlank !== null) {
                valueForCallback = this.fallbackValueOnBlank;
                valueForDisplay = String(this.fallbackValueOnBlank);
            } else {
                valueForCallback = (this.previousValue !== null && !isNaN(this.previousValue)) ? this.previousValue : this.defaultValue; 
                valueForDisplay = (valueForCallback !== null && !isNaN(valueForCallback)) ? String(valueForCallback) : '';
            }
        } else {
            valueForCallback = Math.max(this.min, Math.min(this.max, value));
            valueForDisplay = String(valueForCallback);
        }
        
        this.inputElement.value = valueForDisplay;

        if (typeof this.changeCallback === 'function') {
            this.changeCallback(valueForCallback, this.inputElement);
        }
    }

    handleKeyDown(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.inputElement.blur();
        }
    }

    getValue() {
        let value = parseFloat(this.inputElement.value);
        if (isNaN(value)) {
            return this.defaultValue; 
        }
        return Math.max(this.min, Math.min(this.max, value));
    }

    setValue(value, triggerCallback = true) {
        let valueForCallback;
        let valueForDisplay;

        if (value === null || value === '') {
            valueForCallback = this.defaultValue;
            valueForDisplay = '';
        } else {
            let parsedValue = parseFloat(value);
            if (isNaN(parsedValue)) {
                valueForCallback = this.defaultValue;
                valueForDisplay = '';
            } else {
                valueForCallback = Math.max(this.min, Math.min(this.max, parsedValue));
                valueForDisplay = String(valueForCallback);
            }
        }
        
        this.inputElement.value = valueForDisplay;

        if (triggerCallback && typeof this.changeCallback === 'function') {
            this.changeCallback(valueForCallback, this.inputElement);
        }
    }

    // 동적으로 Max값을 변경하기 위해 추가된 메서드
    setMax(newMax) {
        this.max = newMax;
        this.inputElement.max = String(newMax);
        
        // 현재 값이 새로운 Max보다 크다면 조정
        const currentValue = this.getValue();
        if (currentValue > newMax) {
            this.setValue(newMax, true); // 값이 변경되었으므로 콜백 트리거
        }
    }
}