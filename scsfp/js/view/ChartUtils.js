import { CHART_POINT } from '../config/UIConfig.js';

/**
 * js/view/ChartUtils.js
 * 차트 관련 공통 유틸리티 함수
 */
export class ChartUtils {
    /**
     * 2성 가챠용 포인트 반경 계산
     * @param {number} idx - 데이터 인덱스
     * @returns {number} 포인트 반경
     */
    static getPointRadius2Star(idx) {
        if (idx === 0) return CHART_POINT.RADIUS.ORIGIN;
        if (idx % CHART_POINT.EMPHASIS_INTERVAL.STAR2_CEILING === 0) return CHART_POINT.RADIUS.CEILING_EMPHASIS;
        if (idx % CHART_POINT.EMPHASIS_INTERVAL.STAR2_GUARANTEED === 0) return CHART_POINT.RADIUS.GUARANTEED;
        if (idx % CHART_POINT.EMPHASIS_INTERVAL.STAR2_MINOR === 0) return CHART_POINT.RADIUS.MINOR;
        return CHART_POINT.RADIUS.HIDDEN;
    }

    /**
     * 3성 가챠용 포인트 반경 계산
     * @param {number} idx - 데이터 인덱스
     * @returns {number} 포인트 반경
     */
    static getPointRadius3Star(idx) {
        if (idx === 0) return CHART_POINT.RADIUS.ORIGIN;
        if (idx % CHART_POINT.EMPHASIS_INTERVAL.STAR3_CYCLE === 0) return CHART_POINT.RADIUS.GUARANTEED;
        if (idx % CHART_POINT.EMPHASIS_INTERVAL.STAR3_GUARANTEED === 0) return CHART_POINT.RADIUS.GUARANTEED;
        return CHART_POINT.RADIUS.HIDDEN;
    }

    /**
     * Hit Radius 계산 (인터랙션 범위)
     * @param {number} idx - 데이터 인덱스
     * @param {boolean} isStar2 - 2성 가챠 여부
     * @returns {number} Hit 반경
     */
    static getHitRadius(idx, isStar2 = false) {
        if (isStar2) {
            return (idx % CHART_POINT.EMPHASIS_INTERVAL.STAR2_MINOR === 0) ? CHART_POINT.HIT_RADIUS.STAR2 : 0;
        }
        return (idx % CHART_POINT.EMPHASIS_INTERVAL.STAR3_GUARANTEED === 0) ? CHART_POINT.HIT_RADIUS.STAR3 : 0;
    }

    /**
     * 포인트 배경색 계산 (강조 지점)
     * @param {number} idx - 데이터 인덱스
     * @param {string} mainColor - 메인 컬러
     * @param {boolean} isStar2 - 2성 가챠 여부
     * @returns {string} 색상 값
     */
    static getPointBackgroundColor(idx, mainColor, isStar2 = false) {
        const isHighlight = isStar2
            ? (idx % CHART_POINT.EMPHASIS_INTERVAL.STAR2_CEILING === 0)
            : (idx % CHART_POINT.EMPHASIS_INTERVAL.STAR3_CYCLE === 0);
        return isHighlight ? mainColor : '#fff';
    }
}
