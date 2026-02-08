import { Observable } from '../../utils/Observable.js';

/**
 * PaymentModel.js
 * 과금 효율 계산을 위한 데이터 모델
 */
export class PaymentModel {
    constructor() {
        // 환율 설정 (100엔당 원화)
        this.exchangeRate = new Observable(950); // KRW per 100 JPY

        // 엔화 결제 할인 설정 (ASOBI/Android 전용)
        this.jpyDiscountRate = new Observable(0);      // 할인율 (%)

        // 원화 결제 할인 설정 (iOS 전용)
        this.krwDiscountRate = new Observable(0);      // 할인율 (%)
        this.krwDiscountCap = new Observable(10000);   // 할인 상한 (원) - 숨김

        // 기준 패키지 설정 (효율 배수 계산용)
        // 형식: { platform: 'ASOBI', category: 'NORMAL', id: 'F' }
        this.baselinePackage = new Observable({ platform: 'ASOBI', category: 'NORMAL', id: 'F' });
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

        const discountAmount = Math.min(
            basePrice * (this.krwDiscountRate.value / 100),
            this.krwDiscountCap.value
        );

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

    toJSON() {
        return {
            exchangeRate: this.exchangeRate.value,
            jpyDiscountRate: this.jpyDiscountRate.value,
            krwDiscountRate: this.krwDiscountRate.value,
            krwDiscountCap: this.krwDiscountCap.value,
            baselinePackage: this.baselinePackage.value
        };
    }

    fromJSON(data) {
        if (!data) return;
        if (data.exchangeRate !== undefined) this.exchangeRate.value = data.exchangeRate;
        if (data.jpyDiscountRate !== undefined) this.jpyDiscountRate.value = data.jpyDiscountRate;
        if (data.krwDiscountRate !== undefined) this.krwDiscountRate.value = data.krwDiscountRate;
        if (data.krwDiscountCap !== undefined) this.krwDiscountCap.value = data.krwDiscountCap;
        if (data.baselinePackage !== undefined) this.baselinePackage.value = data.baselinePackage;
    }
}
