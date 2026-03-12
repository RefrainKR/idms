import { Observable } from '../../utils/Observable.js';
import { PAYMENT_CONFIG } from '../../config/PaymentConfig.js';

/**
 * PaymentModel.js
 * 과금 효율 계산을 위한 데이터 모델
 */
export class PaymentModel {
    constructor() {
        const inputs = PAYMENT_CONFIG.INPUTS;

        // 환율 설정 (100엔당 원화)
        this.exchangeRate = new Observable(inputs.EXCHANGE_RATE.value);

        // 엔화 결제 할인 설정 (ASOBI/Android 전용)
        this.jpyDiscountRate = new Observable(inputs.JPY_DISCOUNT_RATE.value);

        // 원화 결제 할인 설정 (iOS 전용)
        this.krwDiscountRate = new Observable(inputs.KRW_DISCOUNT_RATE.value);

        // 기준 패키지 설정 (효율 배수 계산용)
        // 형식: { platform: 'ASOBI', category: 'NORMAL', id: 'F' }
        this.baselinePackage = new Observable({ platform: 'ASOBI', category: 'NORMAL', id: 'F' });

        // 무료돌 가치 설정 (유료돌 100당 기준, 기본 100 = 1:1)
        this.freeGemValue = new Observable(inputs.FREE_GEM_VALUE.value);

        // 티켓 가치 설정 (무료돌 250당 기준, 1장 = 250돌 = 가챠 1회)
        this.ticketValue = new Observable(inputs.TICKET_VALUE.value);
    }

    /**
     * 엔화 할인 적용 (ASOBI/Android 전용)
     * @param {number} basePrice - 기본 가격 (엔)
     * @returns {number} 할인 적용 후 가격 (엔)
     */
    applyJPYDiscount(basePrice) {
        if (this.jpyDiscountRate.value === 0) {
            return basePrice;
        }

        const discountAmount = basePrice * (this.jpyDiscountRate.value / 100);
        return Math.max(0, basePrice - discountAmount);
    }

    /**
     * 원화 할인 적용 (iOS 전용)
     * @param {number} basePrice - 기본 가격 (원)
     * @returns {number} 할인 적용 후 가격 (원)
     */
    applyKRWDiscount(basePrice) {
        if (this.krwDiscountRate.value === 0) {
            return basePrice;
        }

        const discountAmount = basePrice * (this.krwDiscountRate.value / 100);
        return Math.max(0, basePrice - discountAmount);
    }

    /**
     * 엔화를 원화로 변환
     * @param {number} jpy - 엔화 금액
     * @returns {number} 원화 금액
     */
    convertToKRW(jpy) {
        // exchangeRate는 100엔당 원화이므로 jpy를 100으로 나눈 후 곱함
        return (jpy / 100) * this.exchangeRate.value;
    }

    /**
     * 무돌(虹の結晶) 가격 계산
     * ASOBI와 iOS 패키지 비교를 통해 무돌의 암묵적 가치를 역산
     *
     * @param {object} packageData - 전체 패키지 데이터 (PACKAGES 객체)
     * @returns {Array} 무돌 가격 분석 결과 배열
     *
     * 각 항목 형식:
     * {
     *   packageId: 'D',
     *   asobiPrice: { jpy: 3200, krw: 30400 },
     *   iosPrice: { jpy: 305, krw: 29000 },
     *   gemDiff: 130,
     *   normalizedPriceDiff: { jpy: 15, krw: 1468 },
     *   rainbowCrystals: 15,
     *   pricePerCrystal: { jpy: 1.0, krw: 97.87 },
     *   isNegative: false,
     *   fallbackPrice: { jpy: 1.2, krw: 114.0 } // 음수일 경우만
     * }
     */
    calculateRainbowCrystalPrices(packageData) {
        const results = [];
        const targetPackages = ['D', 'E', 'F']; // D, E, F팩만 비교 (무돌 있음)

        targetPackages.forEach(pkgId => {
            const asobiPkg = packageData.ASOBI?.NORMAL?.[pkgId];
            const iosPkg = packageData.IOS?.NORMAL?.[pkgId];

            if (!asobiPkg || !iosPkg) return;

            // ASOBI에 무돌이 없으면 스킵
            if (!asobiPkg.rainbow || asobiPkg.rainbow === 0) return;

            // Step 1: iOS 유료돌 단가 계산 (무돌 없으므로 순수)
            const iosPriceKRW = iosPkg.price; // 원화 기준
            const iosDiscountedKRW = this.applyKRWDiscount(iosPriceKRW);
            const iosGemPriceKRW = iosDiscountedKRW / iosPkg.paidGems;

            // Step 2: ASOBI 가격을 원화로 환산 (할인 적용 후)
            const asobiPriceJPY = asobiPkg.price;
            const asobiDiscountedJPY = this.applyJPYDiscount(asobiPriceJPY);
            const asobiDiscountedKRW = this.convertToKRW(asobiDiscountedJPY);

            // Step 3: ASOBI 실질 돌 수 계산 (무료돌 가치 반영)
            // freeGems는 별도 컬럼에 표시되며, freeGemValue 설정으로 유료돌 환산 비율 조정
            const freeGemValue = this.freeGemValue?.value ?? 100;
            const totalAsobiGems = asobiPkg.paidGems + (asobiPkg.freeGems || 0) * (freeGemValue / 100);

            // Step 3: ASOBI 실질 돌을 iOS 기준 가격으로 정규화
            const asobiNormalizedGemValueKRW = totalAsobiGems * iosGemPriceKRW;

            // Step 4: 차액 = 무돌의 총 가치
            const rainbowCrystalTotalValueKRW = asobiDiscountedKRW - asobiNormalizedGemValueKRW;

            // Step 5: 무돌 1개 가격
            const pricePerCrystalKRW = rainbowCrystalTotalValueKRW / asobiPkg.rainbow;

            // 엔화로도 계산
            const pricePerCrystalJPY = (pricePerCrystalKRW / this.exchangeRate.value) * 100;

            // 음수 체크
            const isNegative = rainbowCrystalTotalValueKRW < 0;

            // 음수일 경우 할인 전 가격으로 재계산 (옵션 C)
            let fallbackPrice = null;
            if (isNegative) {
                const asobiBasePriceKRW = this.convertToKRW(asobiPriceJPY);
                const fallbackTotalValueKRW = asobiBasePriceKRW - asobiNormalizedGemValueKRW;
                const fallbackPricePerCrystalKRW = fallbackTotalValueKRW / asobiPkg.rainbow;
                const fallbackPricePerCrystalJPY = (fallbackPricePerCrystalKRW / this.exchangeRate.value) * 100;

                fallbackPrice = {
                    jpy: fallbackPricePerCrystalJPY,
                    krw: fallbackPricePerCrystalKRW,
                    total: {
                        jpy: fallbackPricePerCrystalJPY * asobiPkg.rainbow,
                        krw: fallbackPricePerCrystalKRW * asobiPkg.rainbow
                    }
                };
            }

            results.push({
                packageId: pkgId,
                asobiPrice: {
                    jpy: asobiDiscountedJPY,
                    krw: Math.round(asobiDiscountedKRW)
                },
                iosPrice: {
                    jpy: Math.round((iosDiscountedKRW / this.exchangeRate.value) * 100),
                    krw: iosDiscountedKRW
                },
                gemDiff: asobiPkg.freeGems || 0,  // ASOBI 전용 무료돌 수
                normalizedPriceDiff: {
                    jpy: Math.round((rainbowCrystalTotalValueKRW / this.exchangeRate.value) * 100),
                    krw: Math.round(rainbowCrystalTotalValueKRW)
                },
                rainbowCrystals: asobiPkg.rainbow,
                pricePerCrystal: {
                    jpy: pricePerCrystalJPY,
                    krw: pricePerCrystalKRW,
                    total: {
                        jpy: pricePerCrystalJPY * asobiPkg.rainbow,
                        krw: pricePerCrystalKRW * asobiPkg.rainbow
                    }
                },
                isNegative,
                fallbackPrice
            });
        });

        return results;
    }

    /**
     * 시즌 페스 무돌 가격 계산
     * ASOBI(2,250돌 + 165무돌) vs iOS(2,000돌 + 150무돌) 차이로 15개 무돌 가치 역산
     *
     * 정규화 가정: iOS 가격을 2,000 freeGems 기준으로 보고 gem 단가를 구한 뒤
     * ASOBI의 2,250 gems 가치를 빼서 15개 무돌의 가치를 추출
     *
     * @param {object} fesData - FES_PACKAGES 데이터
     * @returns {object|null} { rainbowCrystals, pricePerCrystal: {jpy, krw, total}, isNegative }
     */
    calculateSeasonFesRainbowPrice(fesData) {
        const season = fesData?.SEASON;
        if (!season) return null;

        const asobi = season.platforms.ASOBI;
        const ios = season.platforms.IOS;
        if (!asobi || !ios) return null;

        const rainbowDiff = asobi.rainbow - ios.rainbow; // 165 - 150 = 15

        // iOS 가격 (KRW, 할인 적용)
        const iosDiscountedKRW = this.applyKRWDiscount(ios.price);

        // ASOBI 가격 (JPY → KRW, 할인 적용)
        const asobiDiscountedJPY = this.applyJPYDiscount(asobi.price);
        const asobiDiscountedKRW = this.convertToKRW(asobiDiscountedJPY);

        // 정규화: iOS gem 단가 (무료돌 기준)
        const iosGemPriceKRW = iosDiscountedKRW / ios.freeGems;

        // ASOBI gem 정규화 가치
        const asobiNormalizedGemValueKRW = asobi.freeGems * iosGemPriceKRW;

        // 15개 무돌 총 가치
        const rainbowTotalValueKRW = asobiDiscountedKRW - asobiNormalizedGemValueKRW;
        const pricePerCrystalKRW = rainbowTotalValueKRW / rainbowDiff;
        const pricePerCrystalJPY = (pricePerCrystalKRW / this.exchangeRate.value) * 100;

        return {
            rainbowCrystals: rainbowDiff,
            pricePerCrystal: {
                jpy: pricePerCrystalJPY,
                krw: pricePerCrystalKRW,
                total: {
                    jpy: pricePerCrystalJPY * rainbowDiff,
                    krw: pricePerCrystalKRW * rainbowDiff
                }
            },
            isNegative: rainbowTotalValueKRW < 0
        };
    }

    toJSON() {
        return {
            exchangeRate: this.exchangeRate.value,
            jpyDiscountRate: this.jpyDiscountRate.value,
            krwDiscountRate: this.krwDiscountRate.value,
            baselinePackage: this.baselinePackage.value,
            freeGemValue: this.freeGemValue.value,
            ticketValue: this.ticketValue.value
        };
    }

    fromJSON(data) {
        if (!data) return;
        if (data.exchangeRate !== undefined) this.exchangeRate.value = data.exchangeRate;
        if (data.jpyDiscountRate !== undefined) this.jpyDiscountRate.value = data.jpyDiscountRate;
        if (data.krwDiscountRate !== undefined) this.krwDiscountRate.value = data.krwDiscountRate;
        if (data.baselinePackage !== undefined) this.baselinePackage.value = data.baselinePackage;
        if (data.freeGemValue !== undefined) this.freeGemValue.value = data.freeGemValue;
        if (data.ticketValue !== undefined) this.ticketValue.value = data.ticketValue;
    }
}
