/**
 * js/utils/ProbabilityValidator.js
 * 확률 값 검증 및 보정을 위한 유틸리티
 */
export class ProbabilityValidator {
    /**
     * 확률 값을 0~1 범위로 제한
     * @param {number} prob - 검증할 확률 값
     * @returns {number} 보정된 확률 (0 ≤ prob ≤ 1)
     */
    static clamp(prob) {
        if (typeof prob !== 'number' || isNaN(prob)) {
            console.warn('Invalid probability value:', prob, '- defaulting to 0');
            return 0;
        }
        return Math.min(Math.max(prob, 0), 1.0);
    }

    /**
     * 개별 확률에 개수를 곱한 "전체 확률"을 안전하게 계산
     * 예: p=0.01, count=150 -> 1.5가 아닌 1.0 반환
     * @param {number} individualProb - 개별 확률
     * @param {number} count - 대상 개수
     * @returns {number} 보정된 전체 확률 (최대 1.0)
     */
    static getTotalProb(individualProb, count) {
        const individual = this.clamp(individualProb);
        if (count <= 0) return 0;
        return Math.min(individual * count, 1.0);
    }

    /**
     * 확률 배열의 합이 1.0을 초과하는지 검증
     * @param {number[]} probArray - 확률 배열
     * @param {number} tolerance - 허용 오차 (기본 0.0001)
     * @returns {boolean} 유효하면 true
     */
    static validateProbabilitySum(probArray, tolerance = 0.0001) {
        const sum = probArray.reduce((acc, p) => acc + p, 0);
        if (sum > 1.0 + tolerance) {
            console.warn('Probability sum exceeds 1.0:', sum);
            return false;
        }
        return true;
    }

    /**
     * 확률 배열을 정규화 (합이 1.0이 되도록)
     * @param {number[]} probArray - 확률 배열
     * @returns {number[]} 정규화된 배열
     */
    static normalize(probArray) {
        const sum = probArray.reduce((acc, p) => acc + p, 0);
        if (sum === 0) return probArray;
        if (Math.abs(sum - 1.0) < 0.0001) return probArray; // 이미 정규화됨
        
        return probArray.map(p => p / sum);
    }

    /**
     * 누적 확률 배열의 마지막 값을 정확히 1.0으로 보정
     * 부동소수점 오차로 0.9999...가 되는 것을 방지
     * @param {number[]} cumulativeArray - 누적 확률 배열
     * @returns {number[]} 보정된 배열
     */
    static fixCumulativeEnd(cumulativeArray) {
        if (cumulativeArray.length === 0) return cumulativeArray;
        const result = [...cumulativeArray];
        const lastIdx = result.length - 1;
        
        // 마지막 값이 0.99 이상이면 1.0으로 보정
        if (result[lastIdx] > 0.99) {
            result[lastIdx] = 1.0;
        }
        return result;
    }

    /**
     * 개별 확률이 유효한 범위인지 체크 (0~100%)
     * @param {number} prob - 확률 값 (0~1)
     * @param {string} context - 에러 메시지용 컨텍스트
     * @returns {boolean} 유효하면 true
     */
    static isValid(prob, context = '') {
        if (typeof prob !== 'number' || isNaN(prob)) {
            console.error(`Invalid probability${context ? ' (' + context + ')' : ''}:`, prob);
            return false;
        }
        if (prob < 0 || prob > 1.0) {
            console.error(`Probability out of range${context ? ' (' + context + ')' : ''}:`, prob);
            return false;
        }
        return true;
    }

    /**
     * 여집합 확률 계산 (1 - p)
     * @param {number} prob - 확률
     * @returns {number} 여집합 확률
     */
    static complement(prob) {
        const clamped = this.clamp(prob);
        return 1.0 - clamped;
    }
}