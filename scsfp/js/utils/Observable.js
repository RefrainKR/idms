/**
 * js/core/Observable.js
 * 데이터의 변화를 감지하고 알리는 반응형 객체
 */
export class Observable {
    constructor(initialValue) {
        this._value = initialValue;
        this._listeners = [];
    }

    get value() { return this._value; }
    
    set value(newValue) {
        if (this._value !== newValue) {
            this._value = newValue;
            this.notify();
        }
    }

    subscribe(listener) {
        this._listeners.push(listener);

        // unsubscribe 함수 반환
        return () => {
            this._listeners = this._listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this._listeners.forEach(listener => listener(this._value));
    }
}