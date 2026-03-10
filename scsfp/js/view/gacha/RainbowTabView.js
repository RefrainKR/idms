/**
 * js/view/gacha/RainbowTabView.js
 * 무돌(虹の結晶) 탭 렌더링 전담 View
 */
import { RainbowCrystalCalculator } from '../../core/RainbowCrystalCalculator.js';
import { CollapsibleSection } from '../../component/CollapsibleSection.js';

export class RainbowTabView {

    /**
     * 무돌 탭 렌더링
     * @param {Object} context - { rates, normalPulls, stepPulls, include10th, total, stepTotal, grandTotal }
     */
    static render(context) {
        const { rates, normalPulls, stepPulls, include10th, total, stepTotal, grandTotal } = context;

        const pTotal = rates.p3star + rates.p2star + rates.p1star;
        const sTotal = rates.pSSR + rates.pSR + rates.pR;
        const sumWarning = Math.abs(pTotal + sTotal - 1.0) > 0.001
            ? `<p class="reference-caution">※ 확률 합계 ${((pTotal + sTotal) * 100).toFixed(3)}% (100%와 다름)</p>` : '';

        const hasAnyPulls = normalPulls > 0 || stepPulls > 0;

        // result-area: 비워둠 (결과 요약은 gachaSummary로 이동)
        const resultArea = document.getElementById('rainbow-result-area');
        if (resultArea) resultArea.innerHTML = '';

        // gachaSummary: 횟수 결과 + 확률 참조표
        const summaryEl = document.getElementById('gachaSummary');
        if (summaryEl) {
            const countsHtml = hasAnyPulls
                ? this._buildResultCounts(normalPulls, total, stepPulls, stepTotal, grandTotal) : '';
            summaryEl.innerHTML = sumWarning + countsHtml + this._buildProbTable(rates, include10th, stepPulls);
            summaryEl.style.display = 'block';
        }

        // gachaLogic: 알고리즘 메타 정보
        const logicEl = document.getElementById('gachaLogic');
        if (logicEl) {
            const wasCollapsed = logicEl.dataset.collapsed !== 'false';
            logicEl.innerHTML = this._buildLogicDetail(rates, include10th, normalPulls, stepPulls);
            logicEl.style.display = 'block';
            CollapsibleSection.initSection(logicEl);
            if (wasCollapsed) {
                logicEl.dataset.collapsed = 'true';
                const content = logicEl.querySelector('.section-content');
                const btn = logicEl.querySelector('[data-toggle-section]');
                if (content) content.style.display = 'none';
                if (btn) btn.textContent = '▲';
            }
        }
    }

    static _buildResultCounts(normalPulls, total, stepPulls, stepTotal, grandTotal) {
        const items = [];
        if (normalPulls > 0) {
            items.push(`<span class="result-counts-item">일반 <strong>${normalPulls}</strong>회 → <strong>${total.toFixed(2)}</strong>개</span>`);
        }
        if (stepPulls > 0) {
            items.push(`<span class="result-counts-item">스탭업 <strong>${stepPulls}</strong>회 → <strong>${stepTotal.toFixed(2)}</strong>개</span>`);
        }
        const totalHtml = (normalPulls > 0 && stepPulls > 0)
            ? `<span class="result-counts-total">합계 <strong>${normalPulls + stepPulls}</strong>회 → <strong>${grandTotal.toFixed(2)}</strong>개</span>`
            : '';
        return `<div class="result-counts">${items.join('')}${totalHtml}</div>`;
    }

    static _buildProbTable(rates, include10th, stepPulls) {
        const fmt = (v) => (v * 100).toFixed(3);
        const dash = '-';

        const s3 = RainbowCrystalCalculator.step3Rates(rates);
        const r10 = { p3star: rates.p3star, p2star: rates.p2star + rates.p1star, p1star: 0, pSSR: rates.pSSR, pSR: rates.pSR + rates.pR, pR: 0 };
        const step23_10th = RainbowCrystalCalculator.step2_10thRates(rates);

        const expBase = RainbowCrystalCalculator.singleExpected(rates, false);
        const expS3   = RainbowCrystalCalculator.singleExpected(s3, false);
        const exp10th = RainbowCrystalCalculator.singleExpected(r10, false);
        const expS23  = RainbowCrystalCalculator.singleExpected(step23_10th, false);

        // PJ 가챠: ★★★ 7.5% 이상이면 Step4 확정枠 = ★★★ 100% (SSR 없음)
        // 정규 가챠: Step4 확정枠 = ★★★ 60% + SSR 40%
        const isPJ = rates.p3star >= 0.075;

        const normal10thRow = include10th ? `
                        <tr class="logic-table-confirm">
                            <td>통상 10회째 확정</td>
                            <td>${fmt(r10.p3star)}%</td>
                            <td>${fmt(r10.p2star)}%</td>
                            <td>0%</td>
                            <td>${fmt(r10.pSSR)}%</td>
                            <td>${fmt(r10.pSR)}%</td>
                            <td>0%</td>
                            <td>${exp10th.toFixed(2)}개</td>
                        </tr>` : '';

        const stepupRows = `
                        <tr>
                            <td>Step3 1~9회</td>
                            <td>${fmt(s3.p3star)}%</td>
                            <td>${fmt(s3.p2star)}%</td>
                            <td>${fmt(s3.p1star)}%</td>
                            <td>${fmt(s3.pSSR)}%</td>
                            <td>${fmt(s3.pSR)}%</td>
                            <td>${fmt(s3.pR)}%</td>
                            <td>${expS3.toFixed(2)}개</td>
                        </tr>
                        <tr class="logic-table-confirm">
                            <td>Step2/3 10회째 확정</td>
                            <td>${fmt(step23_10th.p3star)}%</td>
                            <td>${fmt(step23_10th.p2star)}%</td>
                            <td>0%</td>
                            <td>${fmt(step23_10th.pSSR)}%</td>
                            <td>${fmt(step23_10th.pSR)}%</td>
                            <td>0%</td>
                            <td>${expS23.toFixed(2)}개</td>
                        </tr>
                        <tr class="logic-table-confirm">
                            <td>Step4 40회째 확정</td>
                            <td>${isPJ ? '100%' : '60%'}</td>
                            <td>${dash}</td>
                            <td>${dash}</td>
                            <td>${isPJ ? dash : '40%'}</td>
                            <td>${dash}</td>
                            <td>${dash}</td>
                            <td>25.00개</td>
                        </tr>`;

        return `
            <div class="table-scroll">
                <table class="data-table" style="font-size:0.82rem;">
                    <thead>
                        <tr>
                            <th>구간</th>
                            <th>3성(P)</th>
                            <th>2성(P)</th>
                            <th>1성(P)</th>
                            <th>SSR(S)</th>
                            <th>SR(S)</th>
                            <th>R(S)</th>
                            <th>기대 무돌</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>통상 1~9회</td>
                            <td>${fmt(rates.p3star)}%</td>
                            <td>${fmt(rates.p2star)}%</td>
                            <td>${fmt(rates.p1star)}%</td>
                            <td>${fmt(rates.pSSR)}%</td>
                            <td>${fmt(rates.pSR)}%</td>
                            <td>${fmt(rates.pR)}%</td>
                            <td>${expBase.toFixed(2)}개</td>
                        </tr>
                        ${normal10thRow}
                        ${stepupRows}
                    </tbody>
                </table>
            </div>
            <p class="reference-caution">※ 처음 New인 경우 무돌을 주지 않으며, 일반 한정/통상 가챠(3성+SSR세트)의 경우 중복 시 실제 50무돌이나, 본 계산은 New를 배제 + 25무돌로만 산정합니다.</p>`;
    }

    static _buildLogicDetail(rates, include10th, normalPulls, stepPulls) {
        return `
            <div class="section-header">
                <span class="logic-title">상세 계산 근거</span>
                <button class="toggle-btn" data-toggle-section>▼</button>
            </div>
            <div class="section-content logic-view">
                <ul class="logic-list">
                    <li>일반 가챠: ${normalPulls}회 / 스탭업 가챠: ${stepPulls}회</li>
                    <li>2/SR확정 보정 (일반): ${include10th ? '포함 (10연 단위)' : '미포함 (단차 기준)'}</li>
                    <li>알고리즘: 기대값 선형 합산</li>
                </ul>
            </div>`;
    }
}
