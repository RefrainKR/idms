import { FORMAT } from '../../config/UIConfig.js';

/**
 * PaymentView.js
 * 과금 효율 계산 결과 렌더링 (엑셀 스타일 테이블)
 */
export class PaymentView {

    /**
     * 기준 패키지의 돌/엔 효율 계산
     * @param {object} packageData - 전체 패키지 데이터
     * @param {PaymentModel} model - PaymentModel 인스턴스
     * @returns {number} 기준 패키지의 돌/엔 효율 (돌 per 100엔)
     */
    _getBaselineEfficiency(packageData, model) {
        const baseline = model.baselinePackage.value;
        const pkg = packageData[baseline.platform]?.[baseline.category]?.[baseline.id];

        if (!pkg) return 1; // 기준 패키지가 없으면 1 반환

        const currency = packageData[baseline.platform]?.currency;
        const freeGemValue = model.freeGemValue?.value ?? 100;
        const effectiveGems = (pkg.paidGems || 0) + (pkg.freeGems || 0) * (freeGemValue / 100);

        if (effectiveGems === 0) return 1;

        // 항상 돌/100엔 기준으로 계산 (실제 결제 통화의 할인만 적용)
        if (currency === 'KRW') {
            // iOS: 원화 결제 → 엔화로 환산 (원화 할인만 적용)
            const basePriceKRW = pkg.price;
            const discountedPriceKRW = model.applyKRWDiscount(basePriceKRW);
            const discountedPriceJPY = Math.round((discountedPriceKRW / model.exchangeRate.value) * 100);
            return discountedPriceJPY > 0 ? effectiveGems / discountedPriceJPY : 0;
        } else {
            // ASOBI, Android: 엔화 결제 (엔화 할인만 적용)
            const basePriceJPY = pkg.price;
            const discountedPriceJPY = model.applyJPYDiscount(basePriceJPY);
            return discountedPriceJPY > 0 ? effectiveGems / discountedPriceJPY : 0;
        }
    }

    /**
     * 패키지 비교표 렌더링 (엑셀 스타일)
     * Y축: 패키지 이름
     * X축: 플랫폼별 속성 (유료돌, 무료돌, 기타 재화, 돌/엔)
     *
     * @param {object} packageData - 패키지 데이터 (PACKAGES 객체)
     * @param {PaymentModel} model - PaymentModel 인스턴스 (환율, 할인, 재화 가치 포함)
     */
    renderPackageTable(packageData, model) {
        const container = document.getElementById('payment-package-table-container');
        if (!container) return;

        // 뷰 모드 확인 (All or Simple)
        const viewBtn = document.getElementById('payment-toggle-view');
        const viewMode = viewBtn?.dataset.view || 'all';

        // 효율 표시 모드 확인
        const efficiencyBtn = document.getElementById('payment-toggle-efficiency');
        const efficiencyMode = efficiencyBtn?.dataset.mode || 'price-per-gem';

        // 기준 패키지 효율 계산 (전체 테이블에서 1회만)
        const baselineEfficiency = this._getBaselineEfficiency(packageData, model);

        // 통합 테이블 생성
        let html = '<table class="data-table payment-comparison-table">';

        // 헤더 (1번만)
        html += this._renderTableHeader(efficiencyMode, viewMode);

        // 바디
        html += '<tbody>';

        // 1. 상시 패키지
        html += this._renderCategoryRows('NORMAL', '상시', packageData, model, efficiencyMode, baselineEfficiency, viewMode);

        // 2. 월 주기 패키지
        html += this._renderCategoryRows('MONTHLY', '월 주기', packageData, model, efficiencyMode, baselineEfficiency, viewMode);

        // 3. 한정 패키지
        html += this._renderCategoryRows('LIMITED', '한정', packageData, model, efficiencyMode, baselineEfficiency, viewMode);

        html += '</tbody>';
        html += '</table>';

        container.innerHTML = html;
    }

    /**
     * 카테고리별 행 렌더링 (구분선 + 패키지 행들)
     * @param {number} baselineEfficiency - 기준 패키지의 효율 (전체 테이블에서 미리 계산됨)
     */
    _renderCategoryRows(category, categoryName, packageData, model, efficiencyMode, baselineEfficiency, viewMode) {
        // 해당 카테고리에 패키지가 있는지 확인
        const platforms = ['ASOBI', 'ANDROID', 'IOS'];
        let hasPackages = false;

        for (const platform of platforms) {
            if (packageData[platform]?.[category] && Object.keys(packageData[platform][category]).length > 0) {
                hasPackages = true;
                break;
            }
        }

        if (!hasPackages) return '';

        // 패키지 ID 목록 추출 (모든 플랫폼 통합)
        const packageIdsSet = new Set();
        platforms.forEach(platform => {
            if (packageData[platform]?.[category]) {
                Object.keys(packageData[platform][category]).forEach(id => packageIdsSet.add(id));
            }
        });
        const packageIds = Array.from(packageIdsSet).sort();

        let html = '';

        // 카테고리 구분 행 (viewMode에 따라 colspan 조정)
        // all:    1(pkg) + 1(공통) + 5(ASOBI) + 4(Android) + 4(iOS) + 1(차이값) = 16
        // simple: 1(pkg) + 1(공통) + 2(ASOBI) + 2(Android) + 2(iOS) + 1(차이값) = 9
        const colspan = viewMode === 'simple' ? '9' : '16';
        html += `<tr class="category-separator">`;
        html += `<td colspan="${colspan}">${categoryName}</td>`;
        html += `</tr>`;

        // 패키지 행들
        packageIds.forEach(pkgId => {
            html += this._renderPackageRow(pkgId, category, packageData, model, efficiencyMode, baselineEfficiency, viewMode);
        });

        return html;
    }

    /**
     * 테이블 헤더 렌더링
     */
    _renderTableHeader(efficiencyMode, viewMode) {
        // 효율 헤더 텍스트 결정 (전체 형식: ¥/돌, 돌/¥)
        const jpyHeader = efficiencyMode === 'price-per-gem' ? '¥/돌' : '돌/¥';
        const krwHeader = efficiencyMode === 'price-per-gem' ? '₩/돌' : '돌/₩';

        const simpleClass = viewMode === 'simple' ? ' hide-simple' : '';

        // 공통 유료돌: 1열 (항상 표시)
        // ASOBI: 가격, 무료돌, 기타, 효율, 배수 = 5열 (all) / 2열 (simple: 기타 hidden)
        // Android/iOS: 가격, 기타, 효율, 배수 = 4열 (all) / 2열 (simple)
        // 차이값: 1열 (항상 표시, rowspan=2)
        const asobiColspan = viewMode === 'simple' ? '2' : '5';
        const otherColspan = viewMode === 'simple' ? '2' : '4';

        return `
            <thead>
                <tr>
                    <th rowspan="2" class="header-package">패키지</th>
                    <th colspan="1" class="header-platform">공통</th>
                    <th colspan="${asobiColspan}" class="header-platform">ASOBI</th>
                    <th colspan="${otherColspan}" class="header-platform">Android</th>
                    <th colspan="${otherColspan}" class="header-platform">iOS</th>
                    <th rowspan="2" class="header-attr">차이값</th>
                </tr>
                <tr>
                    <!-- 공통 -->
                    <th class="header-attr">유료돌</th>
                    <!-- 아소비 -->
                    <th class="header-attr currency-jpy${simpleClass}">가격(¥)</th>
                    <th class="header-attr currency-krw hide-krw${simpleClass}">가격(₩)</th>
                    <th class="header-attr${simpleClass}">무료돌</th>
                    <th class="header-attr${simpleClass}">기타</th>
                    <th class="header-attr currency-jpy">${jpyHeader}</th>
                    <th class="header-attr currency-krw hide-krw">${krwHeader}</th>
                    <th class="header-attr">효율(x배)</th>
                    <!-- Android -->
                    <th class="header-attr currency-jpy${simpleClass}">가격(¥)</th>
                    <th class="header-attr currency-krw hide-krw${simpleClass}">가격(₩)</th>
                    <th class="header-attr${simpleClass}">기타</th>
                    <th class="header-attr currency-jpy">${jpyHeader}</th>
                    <th class="header-attr currency-krw hide-krw">${krwHeader}</th>
                    <th class="header-attr">효율(x배)</th>
                    <!-- iOS -->
                    <th class="header-attr currency-krw hide-krw${simpleClass}">가격(₩)</th>
                    <th class="header-attr currency-jpy${simpleClass}">가격(¥)</th>
                    <th class="header-attr${simpleClass}">기타</th>
                    <th class="header-attr currency-krw hide-krw">${krwHeader}</th>
                    <th class="header-attr currency-jpy">${jpyHeader}</th>
                    <th class="header-attr">효율(x배)</th>
                </tr>
            </thead>
        `;
    }

    /**
     * 패키지 행 렌더링
     * @param {number} baselineEfficiency - 기준 패키지의 효율 (미리 계산됨)
     */
    _renderPackageRow(pkgId, category, packageData, model, efficiencyMode, baselineEfficiency, viewMode) {
        const platforms = ['ASOBI', 'ANDROID', 'IOS'];
        const simpleClass = viewMode === 'simple' ? ' hide-simple' : '';
        const freeGemValue = model.freeGemValue?.value ?? 100;

        let html = '<tr>';

        // 첫 번째 열: 패키지 이름
        const firstPkg = packageData.ASOBI?.[category]?.[pkgId] ||
                         packageData.ANDROID?.[category]?.[pkgId] ||
                         packageData.IOS?.[category]?.[pkgId];

        html += `<td class="cell-package">${firstPkg?.name || pkgId}</td>`;

        // 공통 유료돌 (all 플랫폼 동일) — Android/iOS 기준 (ASOBI 무료돌 제외)
        const commonPaidGems = packageData.ANDROID?.[category]?.[pkgId]?.paidGems
                            ?? packageData.IOS?.[category]?.[pkgId]?.paidGems
                            ?? packageData.ASOBI?.[category]?.[pkgId]?.paidGems
                            ?? 0;
        html += `<td class="cell-number">${commonPaidGems ? commonPaidGems.toLocaleString() + '돌' : '-'}</td>`;

        // 각 플랫폼별 데이터
        platforms.forEach(platform => {
            const pkg = packageData[platform]?.[category]?.[pkgId];
            const currency = packageData[platform]?.currency;

            // 기준 패키지 여부 확인
            const baseline = model.baselinePackage.value;
            const isBaseline = baseline.platform === platform &&
                             baseline.category === category &&
                             baseline.id === pkgId;

            if (pkg) {
                const paidGems = pkg.paidGems || 0;
                const freeGems = pkg.freeGems || 0;
                // 효율 계산에 사용할 실질 돌 수 (무료돌 가치 반영)
                const effectiveGems = paidGems + freeGems * (freeGemValue / 100);
                const extras = this._formatExtras(pkg);

                // 선택 상태 클래스
                const selectedClass = isBaseline ? ' selected' : '';
                const firstClass = isBaseline ? ' platform-first' : '';
                const lastClass = isBaseline ? ' platform-last' : '';

                if (currency === 'KRW') {
                    // iOS: 원화만 결제 가능 (원화 할인 → 엔화로 환산)
                    const basePriceKRW = pkg.price;
                    const discountedPriceKRW = model.applyKRWDiscount(basePriceKRW);
                    const basePriceJPY = Math.round((basePriceKRW / model.exchangeRate.value) * 100);
                    const discountedPriceJPY = Math.round((discountedPriceKRW / model.exchangeRate.value) * 100);

                    let krwEfficiency, yenEfficiency;
                    if (efficiencyMode === 'price-per-gem') {
                        krwEfficiency = effectiveGems > 0 ? discountedPriceKRW / effectiveGems : 0;
                        yenEfficiency = effectiveGems > 0 ? discountedPriceJPY / effectiveGems : 0;
                    } else {
                        krwEfficiency = discountedPriceKRW > 0 ? effectiveGems / discountedPriceKRW : 0;
                        yenEfficiency = discountedPriceJPY > 0 ? effectiveGems / discountedPriceJPY : 0;
                    }

                    const currentEfficiency = discountedPriceJPY > 0 ? effectiveGems / discountedPriceJPY : 0;
                    const efficiencyMultiplier = baselineEfficiency > 0 ? currentEfficiency / baselineEfficiency : 0;

                    const krwUnit = efficiencyMode === 'price-per-gem' ? '₩' : '돌';
                    const yenUnit = efficiencyMode === 'price-per-gem' ? '¥' : '돌';

                    const priceKRWDisplay = discountedPriceKRW < basePriceKRW
                        ? `<s>${basePriceKRW.toLocaleString()}₩</s> ${discountedPriceKRW.toLocaleString()}₩`
                        : `${discountedPriceKRW.toLocaleString()}₩`;
                    const priceJPYDisplay = discountedPriceJPY < basePriceJPY
                        ? `<s>${basePriceJPY.toLocaleString()}¥</s> ${discountedPriceJPY.toLocaleString()}¥`
                        : `${discountedPriceJPY.toLocaleString()}¥`;

                    // iOS: 유료돌 열 없음 (공통 열로 통합)
                    html += `<td class="cell-number platform-cell${selectedClass}${firstClass} currency-krw hide-krw${simpleClass}" data-platform="${platform}" data-category="${category}" data-package="${pkgId}">${priceKRWDisplay}</td>`;
                    html += `<td class="cell-number platform-cell${selectedClass} currency-jpy${simpleClass}" data-platform="${platform}" data-category="${category}" data-package="${pkgId}">${priceJPYDisplay}</td>`;
                    html += `<td class="cell-extras platform-cell${selectedClass}${simpleClass}" data-platform="${platform}" data-category="${category}" data-package="${pkgId}">${extras}</td>`;
                    html += `<td class="cell-efficiency platform-cell${selectedClass} currency-krw hide-krw" data-platform="${platform}" data-category="${category}" data-package="${pkgId}">${krwEfficiency.toFixed(FORMAT.DECIMAL_PLACES.EFFICIENCY)}${krwUnit}</td>`;
                    html += `<td class="cell-efficiency platform-cell${selectedClass} currency-jpy" data-platform="${platform}" data-category="${category}" data-package="${pkgId}">${yenEfficiency.toFixed(FORMAT.DECIMAL_PLACES.EFFICIENCY)}${yenUnit}</td>`;
                    html += `<td class="cell-multiplier platform-cell${selectedClass}${lastClass}" data-platform="${platform}" data-category="${category}" data-package="${pkgId}">${efficiencyMultiplier.toFixed(FORMAT.DECIMAL_PLACES.EFFICIENCY)}배</td>`;
                } else {
                    // ASOBI, Android: 엔화만 결제 가능 (엔화 할인 → 원화로 환산)
                    const basePriceJPY = pkg.price;
                    const discountedPriceJPY = model.applyJPYDiscount(basePriceJPY);
                    const basePriceKRW = Math.round((basePriceJPY / 100) * model.exchangeRate.value);
                    const discountedPriceKRW = Math.round((discountedPriceJPY / 100) * model.exchangeRate.value);

                    let yenEfficiency, krwEfficiency;
                    if (efficiencyMode === 'price-per-gem') {
                        yenEfficiency = effectiveGems > 0 ? discountedPriceJPY / effectiveGems : 0;
                        krwEfficiency = effectiveGems > 0 ? discountedPriceKRW / effectiveGems : 0;
                    } else {
                        yenEfficiency = discountedPriceJPY > 0 ? effectiveGems / discountedPriceJPY : 0;
                        krwEfficiency = discountedPriceKRW > 0 ? effectiveGems / discountedPriceKRW : 0;
                    }

                    const currentEfficiency = discountedPriceJPY > 0 ? effectiveGems / discountedPriceJPY : 0;
                    const efficiencyMultiplier = baselineEfficiency > 0 ? currentEfficiency / baselineEfficiency : 0;

                    const yenUnit = efficiencyMode === 'price-per-gem' ? '¥' : '돌';
                    const krwUnit = efficiencyMode === 'price-per-gem' ? '₩' : '돌';

                    const priceJPYDisplay = discountedPriceJPY < basePriceJPY
                        ? `<s>${basePriceJPY.toLocaleString()}¥</s> ${discountedPriceJPY.toLocaleString()}¥`
                        : `${discountedPriceJPY.toLocaleString()}¥`;
                    const priceKRWDisplay = discountedPriceKRW < basePriceKRW
                        ? `<s>${basePriceKRW.toLocaleString()}₩</s> ${discountedPriceKRW.toLocaleString()}₩`
                        : `${discountedPriceKRW.toLocaleString()}₩`;

                    html += `<td class="cell-number platform-cell${selectedClass}${firstClass} currency-jpy${simpleClass}" data-platform="${platform}" data-category="${category}" data-package="${pkgId}" data-currency="jpy">${priceJPYDisplay}</td>`;
                    html += `<td class="cell-number platform-cell${selectedClass} currency-krw hide-krw${simpleClass}" data-platform="${platform}" data-category="${category}" data-package="${pkgId}" data-currency="krw">${priceKRWDisplay}</td>`;
                    // ASOBI만 무료돌 열 추가
                    if (platform === 'ASOBI') {
                        html += `<td class="cell-number platform-cell${selectedClass}${simpleClass}" data-platform="${platform}" data-category="${category}" data-package="${pkgId}">${freeGems ? freeGems.toLocaleString() + '돌' : '-'}</td>`;
                    }
                    html += `<td class="cell-extras platform-cell${selectedClass}${simpleClass}" data-platform="${platform}" data-category="${category}" data-package="${pkgId}">${extras}</td>`;
                    html += `<td class="cell-efficiency platform-cell${selectedClass} currency-jpy" data-platform="${platform}" data-category="${category}" data-package="${pkgId}">${yenEfficiency.toFixed(FORMAT.DECIMAL_PLACES.EFFICIENCY)}${yenUnit}</td>`;
                    html += `<td class="cell-efficiency platform-cell${selectedClass} currency-krw hide-krw" data-platform="${platform}" data-category="${category}" data-package="${pkgId}">${krwEfficiency.toFixed(FORMAT.DECIMAL_PLACES.EFFICIENCY)}${krwUnit}</td>`;
                    html += `<td class="cell-multiplier platform-cell${selectedClass}${lastClass}" data-platform="${platform}" data-category="${category}" data-package="${pkgId}">${efficiencyMultiplier.toFixed(FORMAT.DECIMAL_PLACES.EFFICIENCY)}배</td>`;
                }
            } else {
                // 해당 플랫폼에 패키지 없음 (viewMode에 따라 colspan 조정)
                // ASOBI: 5열 (all) / 2열 (simple), Android/iOS: 4열 (all) / 2열 (simple)
                const emptyColspan = viewMode === 'simple' ? '2' : (platform === 'ASOBI' ? '5' : '4');
                html += `<td class="cell-empty" colspan="${emptyColspan}">-</td>`;
            }
        });

        // 차이값: iOS 가격 - ASOBI 가격 (통화 토글 연동)
        const asobiDiffPkg = packageData.ASOBI?.[category]?.[pkgId];
        const iosDiffPkg = packageData.IOS?.[category]?.[pkgId];
        if (asobiDiffPkg && iosDiffPkg) {
            const asobiDiscJPY = model.applyJPYDiscount(asobiDiffPkg.price);
            const asobiDiscKRW = Math.round(model.convertToKRW(asobiDiscJPY));
            const iosDiscKRW = model.applyKRWDiscount(iosDiffPkg.price);
            const iosDiscJPY = Math.round((iosDiscKRW / model.exchangeRate.value) * 100);
            const diffJPY = iosDiscJPY - asobiDiscJPY;
            const diffKRW = iosDiscKRW - asobiDiscKRW;
            const fmtDiff = (val, sym) => {
                const sign = val >= 0 ? '+' : '-';
                return `${sign}${Math.abs(val).toLocaleString()}${sym}`;
            };
            html += `<td class="cell-number cell-diff"><span class="currency-jpy">${fmtDiff(diffJPY, '¥')}</span><span class="currency-krw hide-krw">${fmtDiff(diffKRW, '₩')}</span></td>`;
        } else {
            html += `<td class="cell-number cell-diff">-</td>`;
        }

        html += '</tr>';
        return html;
    }

    /**
     * 기타 재화 포맷
     */
    _formatExtras(pkg) {
        const extras = [];

        if (pkg.rainbow) extras.push(`무돌×${pkg.rainbow}`);
        if (pkg.wings) extras.push(`날개×${pkg.wings}`);
        if (pkg.pieces) extras.push(`피스×${pkg.pieces}`);
        if (pkg.ourstream) extras.push(`STREAM×${pkg.ourstream}`);
        if (pkg.totalFreeGems) extras.push(`무료돌×${pkg.totalFreeGems}`);

        return extras.length > 0 ? extras.join(', ') : '-';
    }

    /**
     * 페스 패키지 비교표 렌더링
     * @param {object} fesData - FES_PACKAGES 데이터
     * @param {PaymentModel} model - PaymentModel 인스턴스
     * @param {{ fesKey: string, platformKey: string }} baseline - 기준 셀
     */
    renderFesTable(fesData, model, baseline) {
        const container = document.getElementById('fes-table-container');
        if (!container) return;

        const efficiencyBtn = document.getElementById('fes-toggle-efficiency');
        const efficiencyMode = efficiencyBtn?.dataset.mode || 'price-per-gem';

        // 티켓 가치 (돌 환산)
        const ticketValue = model.ticketValue?.value ?? 0;

        // 유효 돌 수 계산 (freeGems + 티켓 가치 환산)
        const effectiveGems = (p) => p.freeGems + (p.ticket || 0) * ticketValue;

        // 기준 셀 효율 계산 (돌/¥ 기준, 티켓 가치 포함)
        const baselineFesData = fesData[baseline.fesKey];
        const baselinePlatformData = baselineFesData?.platforms[baseline.platformKey];
        let baselinePriceJPY = 0;
        if (baselinePlatformData) {
            if (baselinePlatformData.currency === 'KRW') {
                const discKRW = model.applyKRWDiscount(baselinePlatformData.price);
                baselinePriceJPY = Math.round((discKRW / model.exchangeRate.value) * 100);
            } else {
                baselinePriceJPY = model.applyJPYDiscount(baselinePlatformData.price);
            }
        }
        const baselineEfficiency = baselinePriceJPY > 0 ? effectiveGems(baselinePlatformData ?? {}) / baselinePriceJPY : 0;

        // 효율 헤더
        const jpyHeader = efficiencyMode === 'price-per-gem' ? '¥/돌' : '돌/¥';
        const krwHeader = efficiencyMode === 'price-per-gem' ? '₩/돌' : '돌/₩';

        let html = '<table class="data-table fes-comparison-table">';

        html += `<thead><tr>
            <th class="header-package">패키지</th>
            <th class="header-attr">플랫폼</th>
            <th class="header-attr currency-jpy">가격(¥)</th>
            <th class="header-attr currency-krw hide-krw">가격(₩)</th>
            <th class="header-attr">무료돌</th>
            <th class="header-attr">무돌</th>
            <th class="header-attr">티켓</th>
            <th class="header-attr">메달</th>
            <th class="header-attr currency-jpy">${jpyHeader}</th>
            <th class="header-attr currency-krw hide-krw">${krwHeader}</th>
            <th class="header-attr">효율(x배)</th>
        </tr></thead>`;

        html += '<tbody>';

        for (const [fesKey, fes] of Object.entries(fesData)) {
            const platformNames = ['ASOBI', 'ANDROID', 'IOS'];
            let isFirstRow = true;

            for (const platformKey of platformNames) {
                const p = fes.platforms[platformKey];
                if (!p) continue;

                // 가격 계산 (환율/할인 반영)
                let discountedPriceJPY, discountedPriceKRW;
                if (p.currency === 'KRW') {
                    discountedPriceKRW = model.applyKRWDiscount(p.price);
                    discountedPriceJPY = Math.round((discountedPriceKRW / model.exchangeRate.value) * 100);
                } else {
                    discountedPriceJPY = model.applyJPYDiscount(p.price);
                    discountedPriceKRW = Math.round((discountedPriceJPY / 100) * model.exchangeRate.value);
                }

                // 유효 돌 수 (freeGems + 티켓 환산)
                const gems = effectiveGems(p);

                // 효율 계산 (티켓 가치 포함)
                let yenEfficiency, krwEfficiency;
                if (efficiencyMode === 'price-per-gem') {
                    yenEfficiency = gems > 0 ? discountedPriceJPY / gems : 0;
                    krwEfficiency = gems > 0 ? discountedPriceKRW / gems : 0;
                } else {
                    yenEfficiency = discountedPriceJPY > 0 ? gems / discountedPriceJPY : 0;
                    krwEfficiency = discountedPriceKRW > 0 ? gems / discountedPriceKRW : 0;
                }

                // 효율 배수 (항상 돌/¥ 기준, 티켓 가치 포함)
                const currentEfficiency = discountedPriceJPY > 0 ? gems / discountedPriceJPY : 0;
                const multiplier = baselineEfficiency > 0 ? currentEfficiency / baselineEfficiency : 0;

                const yenUnit = efficiencyMode === 'price-per-gem' ? '¥' : '돌';
                const krwUnit = efficiencyMode === 'price-per-gem' ? '₩' : '돌';

                const platformLabel = platformKey === 'ANDROID' ? 'Android' : platformKey === 'IOS' ? 'iOS' : 'ASOBI';

                // 기준 셀 여부
                const isSelected = fesKey === baseline.fesKey && platformKey === baseline.platformKey;
                const selectedClass = isSelected ? ' selected' : '';
                const firstClass = isSelected ? ' platform-first' : '';
                const lastClass = isSelected ? ' platform-last' : '';

                const attr = `data-fes="${fesKey}" data-platform="${platformKey}"`;

                html += '<tr>';
                if (isFirstRow) {
                    html += `<td class="cell-package" rowspan="3">${fes.name}</td>`;
                    isFirstRow = false;
                }
                html += `<td class="cell-package platform-cell${selectedClass}${firstClass}" ${attr}>${platformLabel}</td>`;
                html += `<td class="cell-number platform-cell${selectedClass} currency-jpy" ${attr}>${discountedPriceJPY.toLocaleString()}¥</td>`;
                html += `<td class="cell-number platform-cell${selectedClass} currency-krw hide-krw" ${attr}>${discountedPriceKRW.toLocaleString()}₩</td>`;
                html += `<td class="cell-number platform-cell${selectedClass}" ${attr}>${p.freeGems.toLocaleString()}돌</td>`;
                html += `<td class="cell-number platform-cell${selectedClass}" ${attr}>${p.rainbow ? p.rainbow.toLocaleString() + '개' : '-'}</td>`;
                html += `<td class="cell-number platform-cell${selectedClass}" ${attr}>${p.ticket ? p.ticket + '장' : '-'}</td>`;
                html += `<td class="cell-number platform-cell${selectedClass}" ${attr}>${p.medal ? p.medal + '개' : '-'}</td>`;
                html += `<td class="cell-efficiency platform-cell${selectedClass} currency-jpy" ${attr}>${yenEfficiency.toFixed(FORMAT.DECIMAL_PLACES.EFFICIENCY)}${yenUnit}</td>`;
                html += `<td class="cell-efficiency platform-cell${selectedClass} currency-krw hide-krw" ${attr}>${krwEfficiency.toFixed(FORMAT.DECIMAL_PLACES.EFFICIENCY)}${krwUnit}</td>`;
                html += `<td class="cell-multiplier platform-cell${selectedClass}${lastClass}" ${attr}>${multiplier.toFixed(FORMAT.DECIMAL_PLACES.EFFICIENCY)}배</td>`;
                html += '</tr>';
            }
        }

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    /**
     * 무돌(虹の結晶) 가격 분석 테이블 렌더링
     * @param {object} packageData - 패키지 데이터
     * @param {PaymentModel} model - PaymentModel 인스턴스
     * @param {object} fesData - FES_PACKAGES 데이터
     */
    renderRainbowCrystalAnalysis(packageData, model, fesData) {
        const container = document.getElementById('rainbow-crystal-table-container');
        if (!container) return;

        // 통화 토글 상태 확인
        const currencyBtn = document.getElementById('payment-toggle-currency');
        const showKRW = currencyBtn?.dataset.currency === 'KRW';

        // 무돌 가격 계산
        const results = model.calculateRainbowCrystalPrices(packageData);

        if (results.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">분석 가능한 데이터가 없습니다.</p>';
            return;
        }

        let html = '<table class="data-table rainbow-crystal-table">';

        // 헤더
        html += `
            <thead>
                <tr>
                    <th>패키지</th>
                    <th>개수</th>
                    <th>개당 가격${showKRW ? '(₩)' : '(¥)'}</th>
                    <th>전체 가격${showKRW ? '(₩)' : '(¥)'}</th>
                    <th>권장</th>
                </tr>
            </thead>
        `;

        // 바디
        html += '<tbody>';

        const renderRow = (label, result) => {
            const totalPrice = showKRW ? result.pricePerCrystal.total.krw : result.pricePerCrystal.total.jpy;
            const unitPrice = showKRW ? result.pricePerCrystal.krw : result.pricePerCrystal.jpy;
            const currency = showKRW ? '₩' : '¥';
            const isNegative = result.isNegative;

            const roundedTotalPrice = Math.round(totalPrice);
            const priceClass = isNegative ? 'price-negative' : '';
            const totalPriceDisplay = `<span class="${priceClass}">${roundedTotalPrice.toLocaleString()}${currency}</span>`;
            const unitPriceDisplay = `<span class="${priceClass}">${unitPrice.toFixed(FORMAT.DECIMAL_PLACES.RAINBOW_PRICE)}${currency}</span>`;
            const recommendation = isNegative ? 'ASOBI' : '복합적';

            return `
                <tr>
                    <td class="cell-package">${label}</td>
                    <td class="cell-number">${result.rainbowCrystals}개</td>
                    <td class="cell-price">${unitPriceDisplay}</td>
                    <td class="cell-price">${totalPriceDisplay}</td>
                    <td class="cell-recommendation">${recommendation}</td>
                </tr>
            `;
        };

        results.forEach(result => {
            html += renderRow(`${result.packageId}팩`, result);
        });

        // 시즌 페스 행 추가
        const seasonResult = model.calculateSeasonFesRainbowPrice(fesData);
        if (seasonResult) {
            html += renderRow('시즌', seasonResult);
        }

        html += '</tbody>';
        html += '</table>';

        container.innerHTML = html;

        // paymentSummary에 참고 정보 표시 (summary result-box 자체가 컨테이너)
        const summaryEl = document.getElementById('paymentSummary');
        if (summaryEl) {
            summaryEl.innerHTML = `
                <p class="reference-info">※ 공통: 동일 패키지의 ASOBI와 iOS 가격 차이를 통해 무돌의 가치를 역산합니다.</p>
                <p class="reference-info">※ 정규화: ASOBI의 추가 무료돌·가챠 티켓을 iOS 유료돌 단가 기준으로 환산하여 차감 후 잔액이 무돌 가격이 됩니다.</p>
                <p class="reference-info">※ 패키지: ASOBI(¥, +무료돌) 와 iOS(₩) 의 차이</p>
                <p class="reference-info">※ 시즌 페스: ASOBI(¥1,960 / +250무료돌)와 iOS(₩17,000) 차이</p>
            `;
        }
    }
}
