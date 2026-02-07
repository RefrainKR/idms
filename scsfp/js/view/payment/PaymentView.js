/**
 * PaymentView.js
 * 과금 효율 계산 결과 렌더링 (엑셀 스타일 테이블)
 */
export class PaymentView {

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

        // 효율 표시 모드 확인
        const efficiencyBtn = document.getElementById('payment-toggle-efficiency');
        const efficiencyMode = efficiencyBtn?.dataset.mode || 'price-per-gem';

        let html = '';

        // 1. 상시 패키지
        html += this._renderCategoryTable('NORMAL', '상시 패키지', packageData, model, efficiencyMode);

        // 2. 월 주기 패키지
        html += this._renderCategoryTable('MONTHLY', '월 주기 패키지', packageData, model, efficiencyMode);

        // 3. 한정 패키지
        html += this._renderCategoryTable('LIMITED', '한정 패키지', packageData, model, efficiencyMode);

        container.innerHTML = html;
    }

    /**
     * 카테고리별 테이블 렌더링
     */
    _renderCategoryTable(category, categoryName, packageData, model, efficiencyMode) {
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

        let html = `<div class="payment-payment-comparison-table">`;
        html += `<h4 class="category-title">${categoryName}</h4>`;
        html += '<table class="payment-comparison-table">';

        // 헤더
        html += this._renderTableHeader(efficiencyMode);

        // 바디
        html += '<tbody>';

        packageIds.forEach(pkgId => {
            html += this._renderPackageRow(pkgId, category, packageData, model, efficiencyMode);
        });

        html += '</tbody>';
        html += '</table>';
        html += '</div>';

        return html;
    }

    /**
     * 테이블 헤더 렌더링
     */
    _renderTableHeader(efficiencyMode) {
        // 효율 헤더 텍스트 결정 (전체 형식: ¥/돌, 돌/¥)
        const jpyHeader = efficiencyMode === 'price-per-gem' ? '¥/돌' : '돌/¥';
        const krwHeader = efficiencyMode === 'price-per-gem' ? '₩/돌' : '돌/₩';

        return `
            <thead>
                <tr>
                    <th rowspan="2" class="header-package">패키지</th>
                    <th colspan="4" class="header-platform">ASOBI</th>
                    <th colspan="4" class="header-platform">Android</th>
                    <th colspan="4" class="header-platform">iOS</th>
                </tr>
                <tr>
                    <!-- 아소비 -->
                    <th class="header-attr currency-jpy">가격(¥)</th>
                    <th class="header-attr currency-krw hide-krw">가격(₩)</th>
                    <th class="header-attr">유료돌</th>
                    <th class="header-attr">기타</th>
                    <th class="header-attr currency-jpy">${jpyHeader}</th>
                    <th class="header-attr currency-krw hide-krw">${krwHeader}</th>
                    <!-- Android -->
                    <th class="header-attr currency-jpy">가격(¥)</th>
                    <th class="header-attr currency-krw hide-krw">가격(₩)</th>
                    <th class="header-attr">유료돌</th>
                    <th class="header-attr">기타</th>
                    <th class="header-attr currency-jpy">${jpyHeader}</th>
                    <th class="header-attr currency-krw hide-krw">${krwHeader}</th>
                    <!-- iOS -->
                    <th class="header-attr currency-krw hide-krw">가격(₩)</th>
                    <th class="header-attr currency-jpy">가격(¥)</th>
                    <th class="header-attr">유료돌</th>
                    <th class="header-attr">기타</th>
                    <th class="header-attr currency-krw hide-krw">${krwHeader}</th>
                    <th class="header-attr currency-jpy">${jpyHeader}</th>
                </tr>
            </thead>
        `;
    }

    /**
     * 패키지 행 렌더링
     */
    _renderPackageRow(pkgId, category, packageData, model, efficiencyMode) {
        const platforms = ['ASOBI', 'ANDROID', 'IOS'];

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

            if (pkg) {
                const paidGems = pkg.paidGems || 0;
                const extras = this._formatExtras(pkg);

                if (currency === 'KRW') {
                    // iOS: 원화 기준 (₩ 먼저, ¥는 역환산)
                    const basePriceKRW = pkg.price;
                    const discountedPriceKRW = model.applyKRWDiscount(basePriceKRW);
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

                    // 단위 추가 (단위만 표시)
                    const krwUnit = efficiencyMode === 'price-per-gem' ? '₩' : '돌';
                    const yenUnit = efficiencyMode === 'price-per-gem' ? '¥' : '돌';

                    // 할인 표시
                    const priceKRWDisplay = discountedPriceKRW < basePriceKRW
                        ? `<s>${basePriceKRW.toLocaleString()}</s> ${discountedPriceKRW.toLocaleString()}`
                        : discountedPriceKRW.toLocaleString();
                    const priceJPYDisplay = discountedPriceJPY < basePriceJPY
                        ? `<s>${basePriceJPY.toLocaleString()}</s> ${discountedPriceJPY.toLocaleString()}`
                        : discountedPriceJPY.toLocaleString();

                    html += `<td class="cell-number currency-krw hide-krw">${priceKRWDisplay}</td>`;
                    html += `<td class="cell-number currency-jpy">${priceJPYDisplay}</td>`;
                    html += `<td class="cell-number">${paidGems.toLocaleString()}</td>`;
                    html += `<td class="cell-extras">${extras}</td>`;
                    html += `<td class="cell-efficiency currency-krw hide-krw">${krwEfficiency.toFixed(2)}${krwUnit}</td>`;
                    html += `<td class="cell-efficiency currency-jpy">${yenEfficiency.toFixed(2)}${yenUnit}</td>`;
                } else {
                    // ASOBI, Android: 엔화 기준 (¥ 먼저, ₩는 환산)
                    const basePriceJPY = pkg.price;
                    const discountedPriceJPY = model.applyJPYDiscount(basePriceJPY);
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

                    // 단위 추가 (단위만 표시)
                    const yenUnit = efficiencyMode === 'price-per-gem' ? '¥' : '돌';
                    const krwUnit = efficiencyMode === 'price-per-gem' ? '₩' : '돌';

                    // 할인 표시
                    const priceJPYDisplay = discountedPriceJPY < basePriceJPY
                        ? `<s>${basePriceJPY.toLocaleString()}</s> ${discountedPriceJPY.toLocaleString()}`
                        : discountedPriceJPY.toLocaleString();
                    const priceKRWDisplay = discountedPriceKRW < basePriceKRW
                        ? `<s>${basePriceKRW.toLocaleString()}</s> ${discountedPriceKRW.toLocaleString()}`
                        : discountedPriceKRW.toLocaleString();

                    html += `<td class="cell-number currency-jpy">${priceJPYDisplay}</td>`;
                    html += `<td class="cell-number currency-krw hide-krw">${priceKRWDisplay}</td>`;
                    html += `<td class="cell-number">${paidGems.toLocaleString()}</td>`;
                    html += `<td class="cell-extras">${extras}</td>`;
                    html += `<td class="cell-efficiency currency-jpy">${yenEfficiency.toFixed(2)}${yenUnit}</td>`;
                    html += `<td class="cell-efficiency currency-krw hide-krw">${krwEfficiency.toFixed(2)}${krwUnit}</td>`;
                }
            } else {
                // 해당 플랫폼에 패키지 없음
                html += `<td class="cell-empty" colspan="4">-</td>`;
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
        if (pkg.ourstream) extras.push(`OurSTREAM×${pkg.ourstream}`);
        if (pkg.totalFreeGems) extras.push(`무료돌×${pkg.totalFreeGems}`);

        return extras.length > 0 ? extras.join(', ') : '-';
    }
}
