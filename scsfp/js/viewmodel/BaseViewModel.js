/**
 * BaseViewModel.js
 * 모든 ViewModel의 공통 기반 클래스
 *
 * 공통 상태 및 정리(destroy) 패턴을 제공합니다.
 * BaseGachaViewModel과 PaymentViewModel이 이를 상속합니다.
 */
export class BaseViewModel {
    constructor() {
        this.isInitializing = true;
        this._subscriptions = []; // Observable 구독 해제 함수 저장
        this._inputBinders = []; // InputBinder 인스턴스 저장
    }

    /**
     * 리소스 정리: 모든 구독 및 InputBinder 해제
     */
    destroy() {
        this._subscriptions.forEach(unsubscribe => unsubscribe());
        this._subscriptions = [];

        this._inputBinders.forEach(binder => binder.destroy());
        this._inputBinders = [];
    }
}
