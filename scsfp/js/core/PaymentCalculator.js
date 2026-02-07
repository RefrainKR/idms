import { PACKAGES, BONUS_VALUES } from './PaymentConstants.js';

/**
 * PaymentCalculator.js
 * 과금 효율 계산 로직
 */
export class PaymentCalculator {

    /**
     * 패키지의 총 가치 계산 (유료돌 + 무료돌 + 보너스)
     * @param {object} pkg - 패키지 정보
     * @param {number} freeGemValue - 무료돌 1개당 가치 (엔)
     * @returns {number} 총 가치 (엔)
     */
    static calculatePackageValue(pkg, freeGemValue = 0) {
        let value = 0;

        // 유료돌 가치 (기본 가격 / 유료돌 개수로 역산)
        // 통상 패키지 기준으로 계산
        value += pkg.paidGems * (pkg.price / pkg.paidGems);

        // 무료돌 가치
        if (pkg.freeGems && freeGemValue > 0) {
            value += pkg.freeGems * freeGemValue;
        }

        // 보너스 재화 가치
        if (pkg.wings && BONUS_VALUES.WINGS_PER_YEN > 0) {
            value += pkg.wings * BONUS_VALUES.WINGS_PER_YEN;
        }
        if (pkg.pieces && BONUS_VALUES.PIECES_PER_YEN > 0) {
            value += pkg.pieces * BONUS_VALUES.PIECES_PER_YEN;
        }
        if (pkg.ourstream && BONUS_VALUES.OURSTREAM_PER_YEN > 0) {
            value += pkg.ourstream * BONUS_VALUES.OURSTREAM_PER_YEN;
        }

        return value;
    }

    /**
     * 패키지 효율 계산 (돌/엔)
     * @param {object} pkg - 패키지 정보
     * @param {number} actualPrice - 실제 지불 금액 (할인 적용 후)
     * @returns {number} 효율 (총 돌 개수 / 실제 가격)
     */
    static calculateEfficiency(pkg, actualPrice) {
        const totalGems = (pkg.paidGems || 0) + (pkg.freeGems || 0);
        if (actualPrice === 0) return 0;
        return totalGems / actualPrice;
    }

    /**
     * 무료돌 가치 역산
     * 예: 960엔에 유료돌 150개 + 무료돌 50개 패키지가 있다면
     * 통상 패키지(960엔 = 유료돌 250개)와 비교하여 무료돌 가치 계산
     *
     * @param {object} discountPkg - 할인 패키지 (유료돌 + 무료돌)
     * @param {object} normalPkg - 통상 패키지 (같은 가격대)
     * @returns {number} 무료돌 1개당 가치 (엔)
     */
    static calculateFreeGemValue(discountPkg, normalPkg) {
        // 예: 960엔 할인 패키지 = 유료돌 150개 + 무료돌 50개
        //     960엔 통상 패키지 = 유료돌 250개
        // 유료돌 1개당 가치 = 960 / 250 = 3.84엔
        // 할인 패키지의 유료돌 가치 = 150 * 3.84 = 576엔
        // 무료돌 총 가치 = 960 - 576 = 384엔
        // 무료돌 1개당 가치 = 384 / 50 = 7.68엔

        if (!discountPkg.freeGems || discountPkg.freeGems === 0) {
            return 0;
        }

        const paidGemValue = normalPkg.price / normalPkg.paidGems;
        const discountPkgPaidValue = discountPkg.paidGems * paidGemValue;
        const freeGemsTotalValue = discountPkg.price - discountPkgPaidValue;

        return freeGemsTotalValue / discountPkg.freeGems;
    }

    /**
     * 플랫폼별 패키지 비교
     * @param {object} model - PaymentModel 인스턴스
     * @returns {object} 비교 결과 데이터
     */
    static comparePackages(model) {
        const results = [];

        // 각 플랫폼의 통상 패키지 비교
        const platforms = ['ASOBI', 'ANDROID', 'IOS'];

        platforms.forEach(platform => {
            const normalPackages = PACKAGES[platform].NORMAL;

            Object.entries(normalPackages).forEach(([key, pkg]) => {
                const actualPrice = model.calculateActualPrice(pkg.price);
                const efficiency = PaymentCalculator.calculateEfficiency(pkg, actualPrice);
                const priceKRW = model.convertToKRW(actualPrice);

                results.push({
                    platform,
                    type: 'NORMAL',
                    packageId: key,
                    basePrice: pkg.price,
                    actualPrice,
                    priceKRW,
                    paidGems: pkg.paidGems,
                    freeGems: pkg.freeGems || 0,
                    totalGems: pkg.paidGems + (pkg.freeGems || 0),
                    efficiency,
                    gemPerYen: efficiency,
                    yenPerGem: efficiency > 0 ? 1 / efficiency : 0
                });
            });
        });

        // 효율 순으로 정렬
        results.sort((a, b) => b.efficiency - a.efficiency);

        return results;
    }

    /**
     * 손익분기점 계산
     * 특정 패키지가 다른 패키지보다 유리해지는 환율 또는 할인율 계산
     *
     * @param {object} pkgA - 비교 패키지 A
     * @param {object} pkgB - 비교 패키지 B
     * @returns {object} 손익분기점 정보
     */
    static calculateBreakEven(pkgA, pkgB) {
        // 간단한 예시: 동일 효율이 되는 할인율
        // 실제로는 더 복잡한 계산 필요

        const effA = pkgA.paidGems / pkgA.price;
        const effB = pkgB.paidGems / pkgB.price;

        return {
            packageA: pkgA,
            packageB: pkgB,
            baseEfficiencyA: effA,
            baseEfficiencyB: effB,
            betterPackage: effA > effB ? 'A' : 'B'
        };
    }
}
