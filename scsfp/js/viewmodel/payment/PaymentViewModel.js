import { PaymentModel } from '../../model/payment/PaymentModel.js';
import { PaymentView } from '../../view/payment/PaymentView.js';
import { PAYMENT_CONFIG, PACKAGES, FES_PACKAGES } from '../../config/PaymentConfig.js';
import { StorageManager } from '../../utils/StorageManager.js';
import { InputBinder } from '../../component/InputBinder.js';
import { BaseViewModel } from '../BaseViewModel.js';

/**
 * PaymentViewModel.js
 * 과금 효율 계산의 프레젠테이션 로직
 */
export class PaymentViewModel extends BaseViewModel {
    constructor() {
        super();
        this.model = new PaymentModel();
        this.view = new PaymentView();
        this._clickHandlerBound = false;      // 패키지 클릭 이벤트 바인딩 여부
        this._fesClickHandlerBound = false;   // 페스 클릭 이벤트 바인딩 여부
        this._fesBaseline = { fesKey: 'SEASON', platformKey: 'ANDROID' }; // 페스 기준 셀
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

        // 7. 페스 토글 버튼 바인딩
        this.bindFesToggle();

        // 8. 페스 셀 클릭 이벤트 바인딩
        this.bindFesTableClick();

        // 9. 패키지 셀 클릭 이벤트 바인딩
        this.bindPackageCellClick();
    }

    /**
     * 입력 필드 바인딩
     */
    bindInputs() {
        const inputs = PAYMENT_CONFIG.INPUTS;

        // 환율
        const exchangeRateInput = document.getElementById('payment-exchange-rate');
        if (exchangeRateInput) {
            const cfg = inputs.EXCHANGE_RATE;
            this._inputBinders.push(new InputBinder(exchangeRateInput, this.model.exchangeRate, {
                min: cfg.min, max: cfg.max, type: 'int'
            }));
        }

        // 엔화 할인율 (ASOBI/Android)
        const jpyDiscountRateInput = document.getElementById('payment-jpy-discount-rate');
        if (jpyDiscountRateInput) {
            const cfg = inputs.JPY_DISCOUNT_RATE;
            this._inputBinders.push(new InputBinder(jpyDiscountRateInput, this.model.jpyDiscountRate, {
                min: cfg.min, max: cfg.max, type: 'float'
            }));
        }

        // 원화 할인율 (iOS)
        const krwDiscountRateInput = document.getElementById('payment-krw-discount-rate');
        if (krwDiscountRateInput) {
            const cfg = inputs.KRW_DISCOUNT_RATE;
            this._inputBinders.push(new InputBinder(krwDiscountRateInput, this.model.krwDiscountRate, {
                min: cfg.min, max: cfg.max, type: 'float'
            }));
        }

        // 무료돌 가치 (유료돌 100당)
        const freeGemValueInput = document.getElementById('payment-free-gem-value');
        if (freeGemValueInput) {
            const cfg = inputs.FREE_GEM_VALUE;
            this._inputBinders.push(new InputBinder(freeGemValueInput, this.model.freeGemValue, {
                min: cfg.min, max: cfg.max, type: 'int'
            }));
        }

        // 티켓 가치 (무료돌 250당)
        const ticketValueInput = document.getElementById('payment-ticket-value');
        if (ticketValueInput) {
            const cfg = inputs.TICKET_VALUE;
            this._inputBinders.push(new InputBinder(ticketValueInput, this.model.ticketValue, {
                min: cfg.min, max: cfg.max, type: 'int'
            }));
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
            this.model.baselinePackage // 기준 패키지 변경 시에도 재계산
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

        // 무료돌 가치 변경 시 패키지 테이블 재렌더링 (ASOBI 효율 영향)
        this._subscriptions.push(
            this.model.freeGemValue.subscribe(() => {
                if (!this.isInitializing) {
                    this.save();
                    this.renderPackageTables();
                }
            })
        );

        // 티켓 가치 변경 시 페스 테이블 + 무돌 분석 재렌더링 (시즌 페스 무돌 계산에 사용)
        this._subscriptions.push(
            this.model.ticketValue.subscribe(() => {
                if (!this.isInitializing) {
                    this.save();
                    this.renderFesTable();
                    this.renderRainbowCrystalAnalysis();
                }
            })
        );
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
        // 무돌 탭이 아닐 경우 paymentSummary 비우기
        if (tabId !== 'payment-tab-rainbow') {
            const summaryEl = document.getElementById('paymentSummary');
            if (summaryEl) summaryEl.innerHTML = '';
        } else {
            // 무돌 탭으로 전환 시 재렌더링 (요약 복원)
            this.renderRainbowCrystalAnalysis();
        }
    }

    /**
     * 통화 토글 버튼 바인딩
     */
    bindCurrencyToggle() {
        const viewBtn = document.getElementById('payment-toggle-view');
        const currencyBtn = document.getElementById('payment-toggle-currency');
        const efficiencyBtn = document.getElementById('payment-toggle-efficiency');

        if (!currencyBtn) return;

        // 초기 상태: 원화 표시, 엔화 숨김
        currencyBtn.dataset.currency = 'KRW';
        currencyBtn.textContent = '원화 (₩)';
        this.toggleCurrency('KRW');
        this.renderRainbowCrystalAnalysis();

        // 효율 버튼 초기 텍스트 설정
        this.updateEfficiencyButtonText(efficiencyBtn, 'KRW');

        // 뷰 모드 토글 (All/Simple)
        if (viewBtn) {
            viewBtn.addEventListener('click', () => {
                const currentView = viewBtn.dataset.view;
                const newView = currentView === 'all' ? 'simple' : 'all';

                // 버튼 텍스트 변경
                viewBtn.textContent = newView === 'all' ? 'All' : 'Simple';

                // 데이터 속성 업데이트
                viewBtn.dataset.view = newView;

                // 테이블 재렌더링
                this.renderPackageTables();
            });
        }

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

            // 무돌 분석 테이블 재렌더링
            this.renderRainbowCrystalAnalysis();

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
     * 페스 토글 버튼 바인딩
     */
    bindFesToggle() {
        const currencyBtn = document.getElementById('fes-toggle-currency');
        const efficiencyBtn = document.getElementById('fes-toggle-efficiency');

        if (!currencyBtn) return;

        // 초기 상태: 원화 표시, 엔화 숨김
        currencyBtn.dataset.currency = 'KRW';
        currencyBtn.textContent = '원화 (₩)';
        this.toggleFesCurrency('KRW');

        // 효율 버튼 초기 텍스트
        this.updateEfficiencyButtonText(efficiencyBtn, 'KRW');

        // 통화 토글
        currencyBtn.addEventListener('click', () => {
            const currentCurrency = currencyBtn.dataset.currency;
            const newCurrency = currentCurrency === 'JPY' ? 'KRW' : 'JPY';

            currencyBtn.textContent = newCurrency === 'JPY' ? '엔화 (¥)' : '원화 (₩)';
            currencyBtn.dataset.currency = newCurrency;
            this.toggleFesCurrency(newCurrency);
            this.updateEfficiencyButtonText(efficiencyBtn, newCurrency);
        });

        // 효율 모드 토글
        if (efficiencyBtn) {
            efficiencyBtn.addEventListener('click', () => {
                const currentMode = efficiencyBtn.dataset.mode;
                const newMode = currentMode === 'price-per-gem' ? 'gem-per-price' : 'price-per-gem';
                efficiencyBtn.dataset.mode = newMode;

                const currency = currencyBtn.dataset.currency || 'JPY';
                this.updateEfficiencyButtonText(efficiencyBtn, currency);

                this.renderFesTable();
            });
        }
    }

    /**
     * 페스 테이블 통화 전환
     */
    toggleFesCurrency(currency) {
        const jpyCells = document.querySelectorAll('.fes-comparison-table .currency-jpy');
        const krwCells = document.querySelectorAll('.fes-comparison-table .currency-krw');

        if (currency === 'KRW') {
            jpyCells.forEach(cell => cell.classList.add('hide-jpy'));
            krwCells.forEach(cell => cell.classList.remove('hide-krw'));
        } else {
            jpyCells.forEach(cell => cell.classList.remove('hide-jpy'));
            krwCells.forEach(cell => cell.classList.add('hide-krw'));
        }
    }

    /**
     * 페스 테이블 셀 클릭 이벤트 바인딩 (이벤트 위임)
     */
    bindFesTableClick() {
        if (this._fesClickHandlerBound) return;

        const container = document.getElementById('fes-table-container');
        if (!container) return;

        container.addEventListener('click', (event) => {
            const cell = event.target.closest('.platform-cell');
            if (!cell) return;

            const fesKey = cell.dataset.fes;
            const platformKey = cell.dataset.platform;

            if (fesKey && platformKey) {
                this._fesBaseline = { fesKey, platformKey };
                this.renderFesTable();
            }
        });

        container.addEventListener('mouseover', (event) => {
            const cell = event.target.closest('.platform-cell');
            if (!cell) return;
            const fesKey = cell.dataset.fes;
            const platformKey = cell.dataset.platform;
            if (fesKey && platformKey) {
                container.querySelectorAll(`.platform-cell[data-fes="${fesKey}"][data-platform="${platformKey}"]`)
                    .forEach(c => c.classList.add('hover-group'));
            }
        });

        container.addEventListener('mouseout', (event) => {
            const cell = event.target.closest('.platform-cell');
            if (!cell) return;
            container.querySelectorAll('.platform-cell.hover-group')
                .forEach(c => c.classList.remove('hover-group'));
        });

        this._fesClickHandlerBound = true;
    }

    /**
     * 패키지 셀 클릭 이벤트 바인딩 (이벤트 위임)
     */
    bindPackageCellClick() {
        // 이미 바인딩되어 있으면 중복 방지
        if (this._clickHandlerBound) return;

        const container = document.getElementById('payment-package-table-container');
        if (!container) return;

        // 클릭 이벤트
        container.addEventListener('click', (event) => {
            const cell = event.target.closest('.platform-cell');
            if (!cell) return;

            const platform = cell.dataset.platform;
            const category = cell.dataset.category;
            const packageId = cell.dataset.package;

            if (platform && category && packageId) {
                // 기준 패키지 변경
                this.model.baselinePackage.value = {
                    platform,
                    category,
                    id: packageId
                };
            }
        });

        // Hover 이벤트 - 플랫폼별 그룹 hover
        container.addEventListener('mouseover', (event) => {
            const cell = event.target.closest('.platform-cell');
            if (!cell) return;

            const platform = cell.dataset.platform;
            const category = cell.dataset.category;
            const packageId = cell.dataset.package;

            if (platform && category && packageId) {
                // 같은 행(패키지)의 같은 플랫폼 셀들 찾기
                const row = cell.closest('tr');
                const platformCells = row.querySelectorAll(`.platform-cell[data-platform="${platform}"][data-category="${category}"][data-package="${packageId}"]`);
                platformCells.forEach(c => c.classList.add('hover-group'));
            }
        });

        container.addEventListener('mouseout', (event) => {
            const cell = event.target.closest('.platform-cell');
            if (!cell) return;

            // 모든 hover-group 클래스 제거
            const allCells = container.querySelectorAll('.platform-cell.hover-group');
            allCells.forEach(c => c.classList.remove('hover-group'));
        });

        this._clickHandlerBound = true;
    }

    /**
     * 패키지 비교표 렌더링
     */
    renderPackageTables() {
        const container = document.getElementById('payment-package-table-container');

        // 스크롤 위치 저장
        const scrollLeft = container ? container.scrollLeft : 0;
        const scrollTop = container ? container.scrollTop : 0;

        // 테이블 렌더링
        this.view.renderPackageTable(PACKAGES, this.model);

        // 렌더링 직후 통화 토글 다시 적용 (환율 변경 시에도 적용)
        const toggleBtn = document.getElementById('payment-toggle-currency');
        if (toggleBtn) {
            const currentCurrency = toggleBtn.dataset.currency || 'JPY';
            this.toggleCurrency(currentCurrency);
        }

        // 무돌 분석 테이블 렌더링
        this.renderRainbowCrystalAnalysis();

        // 페스 테이블 렌더링
        this.renderFesTable();

        // 스크롤 위치 복원 (DOM 업데이트 후에 실행)
        if (container && (scrollLeft > 0 || scrollTop > 0)) {
            requestAnimationFrame(() => {
                container.scrollLeft = scrollLeft;
                container.scrollTop = scrollTop;
            });
        }

        // 클릭 이벤트는 이벤트 위임으로 한 번만 바인딩되므로 재호출 불필요
    }

    /**
     * 무돌(虹の結晶) 분석 테이블 렌더링
     */
    renderRainbowCrystalAnalysis() {
        this.view.renderRainbowCrystalAnalysis(PACKAGES, this.model, FES_PACKAGES);
    }

    /**
     * 페스 패키지 비교표 렌더링
     */
    renderFesTable() {
        this.view.renderFesTable(FES_PACKAGES, this.model, this._fesBaseline);

        // 렌더링 후 통화 토글 재적용
        const toggleBtn = document.getElementById('fes-toggle-currency');
        if (toggleBtn) {
            const currency = toggleBtn.dataset.currency || 'JPY';
            this.toggleFesCurrency(currency);
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

}
