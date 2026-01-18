/**
 * js/utils/ChartUtils.js
 * 차트 관련 공통 유틸리티 함수
 */
export class ChartUtils {
    /**
     * 2성 가챠용 포인트 반경 계산
     * @param {number} idx - 데이터 인덱스
     * @returns {number} 포인트 반경
     */
    static getPointRadius2Star(idx) {
        if (idx === 0) return 4;
        if (idx % 50 === 0) return 7; // 천장(50, 100...) 강조 (가장 큼)
        if (idx % 10 === 0) return 4; // 10단위 기본 표시
        if (idx % 5 === 0) return 3;  // 5단위(확정 슬롯) 작게 표시
        return 0;
    }

    /**
     * 3성 가챠용 포인트 반경 계산
     * @param {number} idx - 데이터 인덱스
     * @returns {number} 포인트 반경
     */
    static getPointRadius3Star(idx) {
        if (idx === 0) return 4;
        if (idx % 40 === 0) return 7; // 주회(40) 강조
        if (idx % 10 === 0) return 4;
        return 0;
    }

    /**
     * Hit Radius 계산 (인터랙션 범위)
     * @param {number} idx - 데이터 인덱스
     * @param {boolean} isStar2 - 2성 가챠 여부
     * @returns {number} Hit 반경
     */
    static getHitRadius(idx, isStar2 = false) {
        if (isStar2) {
            return (idx % 5 === 0) ? 15 : 0;
        }
        return (idx % 10 === 0) ? 30 : 0;
    }

    /**
     * 포인트 배경색 계산 (강조 지점)
     * @param {number} idx - 데이터 인덱스
     * @param {string} mainColor - 메인 컬러
     * @param {boolean} isStar2 - 2성 가챠 여부
     * @returns {string} 색상 값
     */
    static getPointBackgroundColor(idx, mainColor, isStar2 = false) {
        const isHighlight = isStar2 ? (idx % 50 === 0) : (idx % 40 === 0);
        return isHighlight ? mainColor : '#fff';
    }
}