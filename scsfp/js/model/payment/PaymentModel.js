import { Observable } from '../../utils/Observable.js';

/**
 * PaymentModel.js
 * 과금 효율 계산을 위한 데이터 모델
 */
export class PaymentModel {
    constructor() {
        // 환율 설정 (100엔당 원화)
        this.exchangeRate = new Observable(950); // KRW per 100 JPY
        this.carrierDiscount = new Observable(0); // 통신사 할인 (%)
        this.cardDiscount = new Observable(0); // 카드 할인 (%)
        this.cardDiscountCap = new Observable(5000); // 카드 할인 상한 (엔)

        // 무료돌 가치 (역산 결과)
        this.freeGemValue = new Observable(0); // 엔/개
    }

    /**
     * 실제 지불 금액 계산 (할인 적용)
     * @param {number} basePrice - 기본 가격 (엔)
     * @returns {number} 할인 적용 후 가격 (엔)
     */
    calculateActualPrice(basePrice) {
        let price = basePrice;

        // 1. 통신사 할인 적용
        if (this.carrierDiscount.value > 0) {
            price = price * (1 - this.carrierDiscount.value / 100);
        }

        // 2. 카드 할인 적용 (상한 있음)
        if (this.cardDiscount.value > 0) {
            const cardDiscountAmount = Math.min(
                basePrice * (this.cardDiscount.value / 100),
                this.cardDiscountCap.value
            );
            price = price - cardDiscountAmount;
        }

        return Math.max(0, price);
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
            carrierDiscount: this.carrierDiscount.value,
            cardDiscount: this.cardDiscount.value,
            cardDiscountCap: this.cardDiscountCap.value
        };
    }

    fromJSON(data) {
        if (!data) return;
        if (data.exchangeRate !== undefined) this.exchangeRate.value = data.exchangeRate;
        if (data.carrierDiscount !== undefined) this.carrierDiscount.value = data.carrierDiscount;
        if (data.cardDiscount !== undefined) this.cardDiscount.value = data.cardDiscount;
        if (data.cardDiscountCap !== undefined) this.cardDiscountCap.value = data.cardDiscountCap;
    }
}
