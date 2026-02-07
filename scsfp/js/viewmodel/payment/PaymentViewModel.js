import { PaymentModel } from '../../model/payment/PaymentModel.js';
import { PaymentView } from '../../view/payment/PaymentView.js';
import { PAYMENT_CONFIG, PACKAGES } from '../../core/PaymentConstants.js';
import { StorageManager } from '../../utils/StorageManager.js';
import { InputBinder } from '../../view/component/InputBinder.js';

/**
 * PaymentViewModel.js
 * 과금 효율 계산의 프레젠테이션 로직
 */
export class PaymentViewModel {
    constructor() {
        this.model = new PaymentModel();
        this.view = new PaymentView();
        this.isInitializing = true;
        this._inputBinders = []; // InputBinder 인스턴스 저장
        this._subscriptions = []; // Observable 구독 저장
    }

    /**
     * 초기화
     */
    init() {
        // 1. 스토리지에서 로드
        this.load();

        // 2. 입력 바인딩
        this.bindInputs();

        // 3. Observable 구독
        this.subscribeToModel();

        // 4. 탭 네비게이션 바인딩
        this.bindTabs();

        this.isInitializing = false;

        // 5. 초기 렌더링
        this.renderPackageTables();

        // 6. 통화 토글 버튼 바인딩 (렌더링 후)
        this.bindCurrencyToggle();
    }

    /**
     * 입력 필드 바인딩
     */
    bindInputs() {
        // 환율
        const exchangeRateInput = document.getElementById('payment-exchange-rate');
        if (exchangeRateInput) {
            const binder = new InputBinder(exchangeRateInput, this.model.exchangeRate, { min: 0, type: 'int' });
            this._inputBinders.push(binder);
        }

        // 엔화 할인율 (ASOBI/Android)
        const jpyDiscountRateInput = document.getElementById('payment-jpy-discount-rate');
        if (jpyDiscountRateInput) {
            const binder = new InputBinder(jpyDiscountRateInput, this.model.jpyDiscountRate, { min: 0, max: 100, type: 'float' });
            this._inputBinders.push(binder);
        }

        // 원화 할인율 (iOS)
        const krwDiscountRateInput = document.getElementById('payment-krw-discount-rate');
        if (krwDiscountRateInput) {
            const binder = new InputBinder(krwDiscountRateInput, this.model.krwDiscountRate, { min: 0, max: 100, type: 'float' });
            this._inputBinders.push(binder);
        }

        // 원화 할인 상한 (숨김 처리됨)
        const krwDiscountCapInput = document.getElementById('payment-krw-discount-cap');
        if (krwDiscountCapInput) {
            const binder = new InputBinder(krwDiscountCapInput, this.model.krwDiscountCap, { min: 0, type: 'int' });
            this._inputBinders.push(binder);
        }
    }

    /**
     * 모델 변경 구독
     */
    subscribeToModel() {
        // 모든 설정 변경 시 재계산
        const observables = [
            this.model.exchangeRate,
            this.model.jpyDiscountRate,
            this.model.krwDiscountRate,
            this.model.krwDiscountCap
        ];

        observables.forEach(observable => {
            const unsubscribe = observable.subscribe(() => {
                if (!this.isInitializing) {
                    this.save();
                    this.renderPackageTables();
                }
            });
            this._subscriptions.push(unsubscribe);
        });
    }

    /**
     * 탭 네비게이션 바인딩
     */
    bindTabs() {
        const tabButtons = document.querySelectorAll('#payment-tab-system .tab-button');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;

                // 모든 탭 버튼 비활성화
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // 모든 탭 콘텐츠 숨김
                document.querySelectorAll('#payment-tab-system > .tab-content').forEach(tab => {
                    tab.classList.remove('active');
                });

                // 선택된 탭 표시
                document.getElementById(targetTab).classList.add('active');

                // 탭 전환 시 필요한 작업
                this.onTabChange(targetTab);
            });
        });
    }

    /**
     * 탭 전환 시 호출
     */
    onTabChange(tabId) {
        // 향후 탭별 특정 작업 추가 가능
        console.log(`[PaymentViewModel] 탭 전환: ${tabId}`);
    }

    /**
     * 통화 토글 버튼 바인딩
     */
    bindCurrencyToggle() {
        const currencyBtn = document.getElementById('payment-toggle-currency');
        const efficiencyBtn = document.getElementById('payment-toggle-efficiency');

        if (!currencyBtn) return;

        // 초기 상태: 엔화 표시, 원화 숨김
        this.toggleCurrency('JPY');

        // 통화 토글
        currencyBtn.addEventListener('click', () => {
            const currentCurrency = currencyBtn.dataset.currency;
            const newCurrency = currentCurrency === 'JPY' ? 'KRW' : 'JPY';

            // 버튼 텍스트 변경
            currencyBtn.textContent = newCurrency === 'JPY' ? '엔화 (¥)' : '원화 (₩)';

            // 데이터 속성 업데이트
            currencyBtn.dataset.currency = newCurrency;

            // 통화 표시 전환
            this.toggleCurrency(newCurrency);

            // 효율 버튼 텍스트도 업데이트
            this.updateEfficiencyButtonText(efficiencyBtn, newCurrency);
        });

        // 효율 표시 모드 토글
        if (efficiencyBtn) {
            efficiencyBtn.addEventListener('click', () => {
                const currentMode = efficiencyBtn.dataset.mode;
                const newMode = currentMode === 'price-per-gem' ? 'gem-per-price' : 'price-per-gem';

                efficiencyBtn.dataset.mode = newMode;

                // 버튼 텍스트 업데이트
                const currency = currencyBtn.dataset.currency || 'JPY';
                this.updateEfficiencyButtonText(efficiencyBtn, currency);

                // 테이블 재렌더링
                this.renderPackageTables();
            });
        }
    }

    /**
     * 효율 버튼 텍스트 업데이트
     */
    updateEfficiencyButtonText(efficiencyBtn, currency) {
        if (!efficiencyBtn) return;

        const mode = efficiencyBtn.dataset.mode;
        const currencySymbol = currency === 'JPY' ? '¥' : '₩';

        // 버튼 텍스트 업데이트 (단위만 표시)
        if (mode === 'price-per-gem') {
            efficiencyBtn.textContent = `${currencySymbol}/돌`;
        } else {
            efficiencyBtn.textContent = `돌/${currencySymbol}`;
        }
    }

    /**
     * 통화 표시 전환
     */
    toggleCurrency(currency) {
        const jpyCells = document.querySelectorAll('.payment-comparison-table .currency-jpy');
        const krwCells = document.querySelectorAll('.payment-comparison-table .currency-krw');

        if (currency === 'KRW') {
            // 원화 표시, 엔화 숨김
            jpyCells.forEach(cell => cell.classList.add('hide-jpy'));
            krwCells.forEach(cell => cell.classList.remove('hide-krw'));
        } else {
            // 엔화 표시, 원화 숨김
            jpyCells.forEach(cell => cell.classList.remove('hide-jpy'));
            krwCells.forEach(cell => cell.classList.add('hide-krw'));
        }
    }

    /**
     * 패키지 비교표 렌더링
     */
    renderPackageTables() {
        this.view.renderPackageTable(PACKAGES, this.model);

        // 렌더링 직후 통화 토글 다시 적용 (환율 변경 시에도 적용)
        const toggleBtn = document.getElementById('payment-toggle-currency');
        if (toggleBtn) {
            const currentCurrency = toggleBtn.dataset.currency || 'JPY';
            this.toggleCurrency(currentCurrency);
        }
    }

    /**
     * 스토리지에 저장
     */
    save() {
        StorageManager.save(PAYMENT_CONFIG.KEY, this.model.toJSON());
    }

    /**
     * 스토리지에서 로드
     */
    load() {
        const data = StorageManager.load(PAYMENT_CONFIG.KEY);
        this.model.fromJSON(data);
    }

    /**
     * 리소스 정리
     */
    destroy() {
        // 모든 InputBinder 해제
        this._inputBinders.forEach(binder => binder.destroy());
        this._inputBinders = [];

        // 모든 Observable 구독 해제
        this._subscriptions.forEach(unsubscribe => unsubscribe());
        this._subscriptions = [];
    }
}
