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
        const paidGems = pkg.paidGems || 0;

        if (paidGems === 0) return 1;

        // 항상 돌/100엔 기준으로 계산 (실제 결제 통화의 할인만 적용)
        if (currency === 'KRW') {
            // iOS: 원화 결제 → 엔화로 환산 (원화 할인만 적용)
            const basePriceKRW = pkg.price;
            const discountedPriceKRW = model.applyKRWDiscount(basePriceKRW);
            const discountedPriceJPY = Math.round((discountedPriceKRW / model.exchangeRate.value) * 100);
            return discountedPriceJPY > 0 ? paidGems / discountedPriceJPY : 0;
        } else {
            // ASOBI, Android: 엔화 결제 (엔화 할인만 적용)
            const basePriceJPY = pkg.price;
            const discountedPriceJPY = model.applyJPYDiscount(basePriceJPY);
            return discountedPriceJPY > 0 ? paidGems / discountedPriceJPY : 0;
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
        const colspan = viewMode === 'simple' ? '10' : '16';
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

        // Simple 모드에서는 colspan 조정
        const colspan = viewMode === 'simple' ? '3' : '5';
        const simpleClass = viewMode === 'simple' ? ' hide-simple' : '';

        return `
            <thead>
                <tr>
                    <th rowspan="2" class="header-package">패키지</th>
                    <th colspan="${colspan}" class="header-platform">ASOBI</th>
                    <th colspan="${colspan}" class="header-platform">Android</th>
                    <th colspan="${colspan}" class="header-platform">iOS</th>
                </tr>
                <tr>
                    <!-- 아소비 -->
                    <th class="header-attr currency-jpy${simpleClass}">가격(¥)</th>
                    <th class="header-attr currency-krw hide-krw${simpleClass}">가격(₩)</th>
                    <th class="header-attr${simpleClass}">유료돌</th>
                    <th class="header-attr">기타</th>
                    <th class="header-attr currency-jpy">${jpyHeader}</th>
                    <th class="header-attr currency-krw hide-krw">${krwHeader}</th>
                    <th class="header-attr">효율(x배)</th>
                    <!-- Android -->
                    <th class="header-attr currency-jpy${simpleClass}">가격(¥)</th>
                    <th class="header-attr currency-krw hide-krw${simpleClass}">가격(₩)</th>
                    <th class="header-attr${simpleClass}">유료돌</th>
                    <th class="header-attr">기타</th>
                    <th class="header-attr currency-jpy">${jpyHeader}</th>
                    <th class="header-attr currency-krw hide-krw">${krwHeader}</th>
                    <th class="header-attr">효율(x배)</th>
                    <!-- iOS -->
                    <th class="header-attr currency-krw hide-krw${simpleClass}">가격(₩)</th>
                    <th class="header-attr currency-jpy${simpleClass}">가격(¥)</th>
                    <th class="header-attr${simpleClass}">유료돌</th>
                    <th class="header-attr">기타</th>
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

        let html = '<tr>';

        // 첫 번째 열: 패키지 이름
        const firstPkg = packageData.ASOBI?.[category]?.[pkgId] ||
                         packageData.ANDROID?.[category]?.[pkgId] ||
                         packageData.IOS?.[category]?.[pkgId];

        html += `<td class="cell-package">${firstPkg?.name || pkgId}</td>`;

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
                const extras = this._formatExtras(pkg);

                // 선택 상태 클래스
                const selectedClass = isBaseline ? ' selected' : '';
                const firstClass = isBaseline ? ' platform-first' : '';
                const lastClass = isBaseline ? ' platform-last' : '';

                if (currency === 'KRW') {
                    // iOS: 원화만 결제 가능 (원화 할인 → 엔화로 환산)
                    const basePriceKRW = pkg.price;
                    const discountedPriceKRW = model.applyKRWDiscount(basePriceKRW);
                    // 엔화는 원화의 환산값 (할인 전/후 모두 환산)
                    const basePriceJPY = Math.round((basePriceKRW / model.exchangeRate.value) * 100);
                    const discountedPriceJPY = Math.round((discountedPriceKRW / model.exchangeRate.value) * 100);

                    // 효율 계산 (모드에 따라 다름)
                    let krwEfficiency, yenEfficiency;
                    if (efficiencyMode === 'price-per-gem') {
                        // 원/돌, 엔/돌
                        krwEfficiency = paidGems > 0 ? discountedPriceKRW / paidGems : 0;
                        yenEfficiency = paidGems > 0 ? discountedPriceJPY / paidGems : 0;
                    } else {
                        // 돌/원, 돌/엔
                        krwEfficiency = discountedPriceKRW > 0 ? paidGems / discountedPriceKRW : 0;
                        yenEfficiency = discountedPriceJPY > 0 ? paidGems / discountedPriceJPY : 0;
                    }

                    // 효율 배수 계산 (항상 돌/100엔 기준)
                    const currentEfficiency = discountedPriceJPY > 0 ? paidGems / discountedPriceJPY : 0;
                    const efficiencyMultiplier = baselineEfficiency > 0 ? currentEfficiency / baselineEfficiency : 0;

                    // 단위 추가 (단위만 표시)
                    const krwUnit = efficiencyMode === 'price-per-gem' ? '₩' : '돌';
                    const yenUnit = efficiencyMode === 'price-per-gem' ? '¥' : '돌';

                    // 할인 표시
                    const priceKRWDisplay = discountedPriceKRW < basePriceKRW
                        ? `<s>${basePriceKRW.toLocaleString()}₩</s> ${discountedPriceKRW.toLocaleString()}₩`
                        : `${discountedPriceKRW.toLocaleString()}₩`;
                    const priceJPYDisplay = discountedPriceJPY < basePriceJPY
                        ? `<s>${basePriceJPY.toLocaleString()}¥</s> ${discountedPriceJPY.toLocaleString()}¥`
                        : `${discountedPriceJPY.toLocaleString()}¥`;

                    html += `<td class="cell-number platform-cell${selectedClass}${firstClass} currency-krw hide-krw${simpleClass}" data-platform="${platform}" data-category="${category}" data-package="${pkgId}">${priceKRWDisplay}</td>`;
                    html += `<td class="cell-number platform-cell${selectedClass} currency-jpy${simpleClass}" data-platform="${platform}" data-category="${category}" data-package="${pkgId}">${priceJPYDisplay}</td>`;
                    html += `<td class="cell-number platform-cell${selectedClass}${simpleClass}" data-platform="${platform}" data-category="${category}" data-package="${pkgId}">${paidGems.toLocaleString()}돌</td>`;
                    html += `<td class="cell-extras platform-cell${selectedClass}" data-platform="${platform}" data-category="${category}" data-package="${pkgId}">${extras}</td>`;
                    html += `<td class="cell-efficiency platform-cell${selectedClass} currency-krw hide-krw" data-platform="${platform}" data-category="${category}" data-package="${pkgId}">${krwEfficiency.toFixed(FORMAT.DECIMAL_PLACES.EFFICIENCY)}${krwUnit}</td>`;
                    html += `<td class="cell-efficiency platform-cell${selectedClass} currency-jpy" data-platform="${platform}" data-category="${category}" data-package="${pkgId}">${yenEfficiency.toFixed(FORMAT.DECIMAL_PLACES.EFFICIENCY)}${yenUnit}</td>`;
                    html += `<td class="cell-multiplier platform-cell${selectedClass}${lastClass}" data-platform="${platform}" data-category="${category}" data-package="${pkgId}">${efficiencyMultiplier.toFixed(FORMAT.DECIMAL_PLACES.EFFICIENCY)}배</td>`;
                } else {
                    // ASOBI, Android: 엔화만 결제 가능 (엔화 할인 → 원화로 환산)
                    const basePriceJPY = pkg.price;
                    const discountedPriceJPY = model.applyJPYDiscount(basePriceJPY);
                    // 원화는 엔화의 환산값 (할인 전/후 모두 환산)
                    const basePriceKRW = Math.round((basePriceJPY / 100) * model.exchangeRate.value);
                    const discountedPriceKRW = Math.round((discountedPriceJPY / 100) * model.exchangeRate.value);

                    // 효율 계산 (모드에 따라 다름)
                    let yenEfficiency, krwEfficiency;
                    if (efficiencyMode === 'price-per-gem') {
                        // 엔/돌, 원/돌
                        yenEfficiency = paidGems > 0 ? discountedPriceJPY / paidGems : 0;
                        krwEfficiency = paidGems > 0 ? discountedPriceKRW / paidGems : 0;
                    } else {
                        // 돌/엔, 돌/원
                        yenEfficiency = discountedPriceJPY > 0 ? paidGems / discountedPriceJPY : 0;
                        krwEfficiency = discountedPriceKRW > 0 ? paidGems / discountedPriceKRW : 0;
                    }

                    // 효율 배수 계산 (항상 돌/100엔 기준)
                    const currentEfficiency = discountedPriceJPY > 0 ? paidGems / discountedPriceJPY : 0;
                    const efficiencyMultiplier = baselineEfficiency > 0 ? currentEfficiency / baselineEfficiency : 0;

                    // 단위 추가 (단위만 표시)
                    const yenUnit = efficiencyMode === 'price-per-gem' ? '¥' : '돌';
                    const krwUnit = efficiencyMode === 'price-per-gem' ? '₩' : '돌';

                    // 할인 표시
                    const priceJPYDisplay = discountedPriceJPY < basePriceJPY
                        ? `<s>${basePriceJPY.toLocaleString()}¥</s> ${discountedPriceJPY.toLocaleString()}¥`
                        : `${discountedPriceJPY.toLocaleString()}¥`;
                    const priceKRWDisplay = discountedPriceKRW < basePriceKRW
                        ? `<s>${basePriceKRW.toLocaleString()}₩</s> ${discountedPriceKRW.toLocaleString()}₩`
                        : `${discountedPriceKRW.toLocaleString()}₩`;

                    html += `<td class="cell-number platform-cell${selectedClass}${firstClass} currency-jpy${simpleClass}" data-platform="${platform}" data-category="${category}" data-package="${pkgId}" data-currency="jpy">${priceJPYDisplay}</td>`;
                    html += `<td class="cell-number platform-cell${selectedClass} currency-krw hide-krw${simpleClass}" data-platform="${platform}" data-category="${category}" data-package="${pkgId}" data-currency="krw">${priceKRWDisplay}</td>`;
                    html += `<td class="cell-number platform-cell${selectedClass}${simpleClass}" data-platform="${platform}" data-category="${category}" data-package="${pkgId}">${paidGems.toLocaleString()}돌</td>`;
                    html += `<td class="cell-extras platform-cell${selectedClass}" data-platform="${platform}" data-category="${category}" data-package="${pkgId}">${extras}</td>`;
                    html += `<td class="cell-efficiency platform-cell${selectedClass} currency-jpy" data-platform="${platform}" data-category="${category}" data-package="${pkgId}">${yenEfficiency.toFixed(FORMAT.DECIMAL_PLACES.EFFICIENCY)}${yenUnit}</td>`;
                    html += `<td class="cell-efficiency platform-cell${selectedClass} currency-krw hide-krw" data-platform="${platform}" data-category="${category}" data-package="${pkgId}">${krwEfficiency.toFixed(FORMAT.DECIMAL_PLACES.EFFICIENCY)}${krwUnit}</td>`;
                    html += `<td class="cell-multiplier platform-cell${selectedClass}${lastClass}" data-platform="${platform}" data-category="${category}" data-package="${pkgId}">${efficiencyMultiplier.toFixed(FORMAT.DECIMAL_PLACES.EFFICIENCY)}배</td>`;
                }
            } else {
                // 해당 플랫폼에 패키지 없음 (viewMode에 따라 colspan 조정)
                const emptyColspan = viewMode === 'simple' ? '3' : '5';
                html += `<td class="cell-empty" colspan="${emptyColspan}">-</td>`;
            }
        });

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
     * 무돌(虹の結晶) 가격 분석 테이블 렌더링
     * @param {object} packageData - 패키지 데이터
     * @param {PaymentModel} model - PaymentModel 인스턴스
     */
    renderRainbowCrystalAnalysis(packageData, model) {
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

        results.forEach(result => {
            const totalPrice = showKRW ? result.pricePerCrystal.total.krw : result.pricePerCrystal.total.jpy;
            const unitPrice = showKRW ? result.pricePerCrystal.krw : result.pricePerCrystal.jpy;
            const currency = showKRW ? '₩' : '¥';
            const isNegative = result.isNegative;

            // 전체 가격 표시 (소수점 없이 반올림, 음수면 빨간색)
            const roundedTotalPrice = Math.round(totalPrice);
            const priceClass = isNegative ? 'price-negative' : '';
            const totalPriceDisplay = `<span class="${priceClass}">${roundedTotalPrice.toLocaleString()}${currency}</span>`;

            // 개당 가격 표시 (소수점 3자리까지, 음수면 빨간색)
            const unitPriceDisplay = `<span class="${priceClass}">${unitPrice.toFixed(FORMAT.DECIMAL_PLACES.RAINBOW_PRICE)}${currency}</span>`;

            // 권장 구매처: 음수 (ASOBI 더 비쌈) → "ASOBI", 양수 (iOS 더 비쌈) → "복합적"
            const recommendation = isNegative ? 'ASOBI' : '복합적';

            html += `
                <tr>
                    <td class="cell-package">${result.packageId}팩</td>
                    <td class="cell-number">${result.rainbowCrystals}개</td>
                    <td class="cell-price">${unitPriceDisplay}</td>
                    <td class="cell-price">${totalPriceDisplay}</td>
                    <td class="cell-recommendation">${recommendation}</td>
                </tr>
            `;
        });

        html += '</tbody>';
        html += '</table>';

        // 참고 정보 추가
        html += `
            <p class="table-reference-info">
                ※ 동일 패키지의 ASOBI와 iOS 가격 차이를 통해 무돌의 가치를 역산합니다.<br>
                ※ 정규화(유료돌 차이에 의한 계산)를 통해 순수한 무돌의 가치만 추출합니다.
            </p>
        `;

        container.innerHTML = html;
    }
}
