/**
 * js/lib/Formatter.js
 * 숫자 및 확률 포맷팅 유틸리티
 */
export class Formatter {
    static formatProbability(probability) {
        if (probability === 0) return "0.000%";
        const percent = probability * 100;
        const text = percent.toFixed(3);
        
        // 매우 낮은 확률은 분수 표기
        if (text === "0.000" && probability > 0) {
            const denom = Math.round(1 / probability);
            return `1/${denom.toLocaleString()}`;
        }
        return `${text}%`;
    }
}