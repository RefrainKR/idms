/**
 * js/lib/Formatter.js
 * 숫자 및 확률 포맷팅 유틸리티
 */
export class Formatter {
    /**
     * 확률을 백분율로 포맷팅 (분수 표기 지원)
     * 범례, 툴팁, 요약에 사용 - 정확한 확률 전달 목적
     *
     * @param {number} probability - 확률 (0~1)
     * @param {number} decimals - 소숫점 자리수 (기본 3)
     * @returns {string} 포맷된 확률 문자열
     *
     * @example
     * probabilityFraction(0) → "0.000%"
     * probabilityFraction(0.000003) → "1/333,333"
     * probabilityFraction(0.00123) → "0.123%"
     * probabilityFraction(0.5) → "50.000%"
     */
    static probabilityFraction(probability, decimals = 3) {
        // 정확히 0
        if (probability === 0) {
            return `0.${'0'.repeat(decimals)}%`;
        }

        // 정확히 1 (100%)
        if (probability >= 1) {
            return `100.${'0'.repeat(decimals)}%`;
        }

        const percent = probability * 100;
        const text = percent.toFixed(decimals);
        const threshold = `0.${'0'.repeat(decimals)}`;

        // 매우 낮은 확률은 분수 표기
        // threshold보다 작으면 분수로 표기
        if (text === threshold && probability > 0) {
            const denom = Math.round(1 / probability);
            return `1/${denom.toLocaleString()}`;
        }

        return `${text}%`;
    }

    /**
     * 확률을 백분율로 포맷팅 (경계값 명시)
     * 차트 내부 레이블에 사용 - 가독성 목적
     *
     * @param {number} probability - 확률 (0~1)
     * @param {number} decimals - 소숫점 자리수 (기본 3)
     * @returns {string} 포맷된 확률 문자열
     *
     * @example
     * probabilityBounded(0) → "0.000%"
     * probabilityBounded(0.000003) → "0.001%↓"
     * probabilityBounded(0.00123) → "0.123%"
     * probabilityBounded(0.999997) → "99.999%↑"
     * probabilityBounded(1) → "100.000%"
     */
    static probabilityBounded(probability, decimals = 3) {
        // 정확히 0
        if (probability === 0) {
            return `0.${'0'.repeat(decimals)}%`;
        }

        // 정확히 1 (100%)
        if (probability >= 1) {
            return `100.${'0'.repeat(decimals)}%`;
        }

        const percent = probability * 100;
        const threshold = 1 / Math.pow(10, decimals);

        // 경계값: 0에 가까움 (표시 한계보다 작음)
        if (percent < threshold) {
            return `${threshold.toFixed(decimals)}%↓`;
        }

        // 경계값: 100에 가까움 (표시 한계보다 큼)
        if (percent > 100 - threshold) {
            return `${(100 - threshold).toFixed(decimals)}%↑`;
        }

        // 일반 값
        return `${percent.toFixed(decimals)}%`;
    }

    /**
     * 기존 메서드 (호환성 유지)
     * @deprecated 대신 probabilityFraction 사용 권장
     */
    static formatProbability(probability) {
        return this.probabilityFraction(probability, 3);
    }
}