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
     * @param {number} exchangeRate - 환율 (100엔당 원화)
     */
    renderPackageTable(packageData, exchangeRate) {
        const container = document.getElementById('payment-package-table-container');
        if (!container) return;

        let html = '';

        // 1. 상시 패키지
        html += this._renderCategoryTable('NORMAL', '상시 패키지', packageData, exchangeRate);

        // 2. 월 주기 패키지
        html += this._renderCategoryTable('MONTHLY', '월 주기 패키지', packageData, exchangeRate);

        // 3. 한정 패키지
        html += this._renderCategoryTable('LIMITED', '한정 패키지', packageData, exchangeRate);

        container.innerHTML = html;
    }

    /**
     * 카테고리별 테이블 렌더링
     */
    _renderCategoryTable(category, categoryName, packageData, exchangeRate) {
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

        let html = `<div class="payment-payment-comparison-table" style="margin-bottom: 30px;">`;
        html += `<h4 style="margin-bottom: 10px; color: var(--primary);">${categoryName}</h4>`;
        html += '<table class="payment-comparison-table">';

        // 헤더
        html += this._renderTableHeader();

        // 바디
        html += '<tbody>';

        packageIds.forEach(pkgId => {
            html += this._renderPackageRow(pkgId, category, packageData, exchangeRate);
        });

        html += '</tbody>';
        html += '</table>';
        html += '</div>';

        return html;
    }

    /**
     * 테이블 헤더 렌더링
     */
    _renderTableHeader() {
        return `
            <thead>
                <tr>
                    <th rowspan="2" class="header-package">패키지</th>
                    <th colspan="4" class="header-platform">아소비 스토어</th>
                    <th colspan="4" class="header-platform">Android</th>
                    <th colspan="4" class="header-platform">iOS</th>
                </tr>
                <tr>
                    <!-- 아소비 -->
                    <th class="header-attr currency-jpy">가격(¥)</th>
                    <th class="header-attr currency-krw hide-krw">가격(₩)</th>
                    <th class="header-attr">유료돌</th>
                    <th class="header-attr">기타</th>
                    <th class="header-attr currency-jpy">엔/돌</th>
                    <th class="header-attr currency-krw hide-krw">원/돌</th>
                    <!-- Android -->
                    <th class="header-attr currency-jpy">가격(¥)</th>
                    <th class="header-attr currency-krw hide-krw">가격(₩)</th>
                    <th class="header-attr">유료돌</th>
                    <th class="header-attr">기타</th>
                    <th class="header-attr currency-jpy">엔/돌</th>
                    <th class="header-attr currency-krw hide-krw">원/돌</th>
                    <!-- iOS -->
                    <th class="header-attr currency-krw hide-krw">가격(₩)</th>
                    <th class="header-attr currency-jpy">가격(¥)</th>
                    <th class="header-attr">유료돌</th>
                    <th class="header-attr">기타</th>
                    <th class="header-attr currency-krw hide-krw">원/돌</th>
                    <th class="header-attr currency-jpy">엔/돌</th>
                </tr>
            </thead>
        `;
    }

    /**
     * 패키지 행 렌더링
     */
    _renderPackageRow(pkgId, category, packageData, exchangeRate) {
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
                    const priceKRW = pkg.price;
                    const priceJPY = Math.round((priceKRW / exchangeRate) * 100);
                    const krwPerGem = paidGems > 0 ? priceKRW / paidGems : 0;
                    const yenPerGem = paidGems > 0 ? priceJPY / paidGems : 0;

                    html += `<td class="cell-number currency-krw hide-krw">${priceKRW.toLocaleString()}</td>`;
                    html += `<td class="cell-number currency-jpy">${priceJPY.toLocaleString()}</td>`;
                    html += `<td class="cell-number">${paidGems.toLocaleString()}</td>`;
                    html += `<td class="cell-extras">${extras}</td>`;
                    html += `<td class="cell-efficiency currency-krw hide-krw">${krwPerGem.toFixed(2)}</td>`;
                    html += `<td class="cell-efficiency currency-jpy">${yenPerGem.toFixed(2)}</td>`;
                } else {
                    // ASOBI, Android: 엔화 기준 (¥ 먼저, ₩는 환산)
                    const priceJPY = pkg.price;
                    const priceKRW = Math.round((priceJPY / 100) * exchangeRate);
                    const yenPerGem = paidGems > 0 ? priceJPY / paidGems : 0;
                    const krwPerGem = paidGems > 0 ? priceKRW / paidGems : 0;

                    html += `<td class="cell-number currency-jpy">${priceJPY.toLocaleString()}</td>`;
                    html += `<td class="cell-number currency-krw hide-krw">${priceKRW.toLocaleString()}</td>`;
                    html += `<td class="cell-number">${paidGems.toLocaleString()}</td>`;
                    html += `<td class="cell-extras">${extras}</td>`;
                    html += `<td class="cell-efficiency currency-jpy">${yenPerGem.toFixed(2)}</td>`;
                    html += `<td class="cell-efficiency currency-krw hide-krw">${krwPerGem.toFixed(2)}</td>`;
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
