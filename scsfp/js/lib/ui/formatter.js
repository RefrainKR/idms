export function formatProbability(probability) {
    if (probability === 0) return "0.000%";
    const percent = probability * 100;
    const text = percent.toFixed(3); 
    if (text === "0.000") {
        const denom = Math.round(1 / probability);
        return `1/${denom.toLocaleString()}`; 
    }
    return `${text}%`;
}