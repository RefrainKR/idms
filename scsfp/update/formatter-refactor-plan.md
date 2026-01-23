# Formatter.js 리팩토링 계획 (v1.8.0)

## 현재 상태 분석

### 기존 메서드: `formatProbability(probability)`

**위치**: [js/utils/Formatter.js:6-17](js/utils/Formatter.js#L6-L17)

**현재 동작**:
```javascript
static formatProbability(probability) {
    if (probability === 0) return "0.000%";
    const percent = probability * 100;
    const text = percent.toFixed(3);  // 소숫점 3자리 고정

    // 매우 낮은 확률은 분수 표기
    if (text === "0.000" && probability > 0) {
        const denom = Math.round(1 / probability);
        return `1/${denom.toLocaleString()}`;
    }
    return `${text}%`;
}
```

**사용처**:
1. **legend-container** (범례): [ResultView.js:89-90](js/view/ResultView.js#L89-L90)
   - `listData.push(Formatter.formatProbability(listDP[k]))`
   - 분수 표기가 정확한 확률 전달

2. **tooltip** (차트 툴팁): [ResultView.js:163](js/view/ResultView.js#L163)
   - `tooltipVals.push(Formatter.formatProbability(val))`
   - 분수 표기가 정확한 확률 전달

3. **summary** (요약 텍스트): [GachaResultView.js:140, 148, 155](js/view/gacha/GachaResultView.js#L140)
   - `Formatter.formatProbability(dp[M])`
   - 분수 표기가 정확한 확률 전달

**문제점**:
- ❌ 소숫점 자리수가 고정 (3자리)
- ❌ 경계값 처리 없음: `0.0003%` → `0.000%` (실제 0이 아닌데 0으로 표시)
- ✅ 분수 표기는 좋음 (legend/tooltip/summary에 적합)

---

## 새로운 설계

### 1. `formatProbabilityFraction(probability, decimals = 3)`

**목적**: 범례/툴팁/요약에서 정확한 확률 표시 (기존 `formatProbability` 개선)

**동작**:
- 기본: 백분율 표시 (소숫점 자리수 가변)
- 0에 가까운 값: 분수 표기 (`1/10,000`)
- 정확히 0: `0.000%`
- 100%: `100.000%`

```javascript
static formatProbabilityFraction(probability, decimals = 3) {
    if (probability === 0) return `0.${'0'.repeat(decimals)}%`;
    if (probability >= 1) return "100" + "." + "0".repeat(decimals) + "%";

    const percent = probability * 100;
    const text = percent.toFixed(decimals);
    const threshold = `0.${'0'.repeat(decimals)}`;

    // 매우 낮은 확률은 분수 표기
    if (text === threshold && probability > 0) {
        const denom = Math.round(1 / probability);
        return `1/${denom.toLocaleString()}`;
    }

    return `${text}%`;
}
```

**예시**:
```
확률값       decimals=3    decimals=2
0            → 0.000%      → 0.00%
0.0003%      → 1/333,333   → 1/333,333
0.0012%      → 0.001%      → 0.00%
1.234%       → 1.234%      → 1.23%
99.9999%     → 100.000%    → 100.00%
100%         → 100.000%    → 100.00%
```

**사용처**:
- Legend (범례)
- Tooltip (툴팁)
- Summary (요약)

---

### 2. `formatProbabilityBounded(probability, decimals = 3)`

**목적**: 차트 내부 레이블에서 경계값 명시 (새로운 메서드)

**동작**:
- 기본: 백분율 표시
- 경계값 처리: 화살표 사용 (숫자 뒤에 배치)
  - `0 < prob < threshold` → `0.001%↓`
  - `1 - threshold < prob < 1` → `99.999%↑`
- 정확히 0: `0.000%`
- 정확히 100%: `100.000%`

```javascript
static formatProbabilityBounded(probability, decimals = 3) {
    const percent = probability * 100;
    const threshold = 1 / Math.pow(10, decimals);

    // 정확히 0
    if (percent === 0) {
        return `0.${'0'.repeat(decimals)}%`;
    }

    // 정확히 100
    if (percent >= 100) {
        return "100" + "." + "0".repeat(decimals) + "%";
    }

    // 경계값: 0에 가까움
    if (percent < threshold) {
        return `${threshold.toFixed(decimals)}%↓`;
    }

    // 경계값: 100에 가까움
    if (percent > 100 - threshold) {
        return `${(100 - threshold).toFixed(decimals)}%↑`;
    }

    // 일반 값
    return `${percent.toFixed(decimals)}%`;
}
```

**예시**:
```
확률값       decimals=3    decimals=2
0            → 0.000%      → 0.00%
0.0003%      → 0.001%↓     → 0.01%↓
0.0012%      → 0.001%      → 0.01%↓  (여전히 경계값)
1.234%       → 1.234%      → 1.23%
99.9985%     → 99.999%     → 99.99%↑
99.9997%     → 99.999%↑    → 99.99%↑
100%         → 100.000%    → 100.00%
```

**장점**:
- ✅ 숫자 정렬이 깔끔 (시작 위치 일정)
- ✅ 시각적으로 직관적 (↓ = "더 작음", ↑ = "더 큼")
- ✅ 차트에서 가독성 우수

**사용처**:
- Chart 내부 레이블 (datalabels plugin)

---

## 메서드 네이밍 정리

| 메서드 | 용도 | 특징 |
|--------|------|------|
| `formatProbabilityFraction` | 범례/툴팁/요약 | 분수 표기 (정확한 값) |
| `formatProbabilityBounded` | 차트 내부 레이블 | 부등호 표기 (경계값 명시) |

**네이밍 근거**:
- `Fraction`: 분수 변환 기능 강조
- `Bounded`: 경계값(boundary) 처리 강조

---

## 마이그레이션 계획

### Step 1: 새 메서드 추가

**파일**: `js/utils/Formatter.js`

```javascript
export class Formatter {
    // 기존 메서드 (호환성 유지)
    static formatProbability(probability) {
        return this.formatProbabilityFraction(probability, 3);
    }

    // 새 메서드 1: 분수 표기 (범례/툴팁/요약용)
    static formatProbabilityFraction(probability, decimals = 3) {
        // 구현 (위 참조)
    }

    // 새 메서드 2: 부등호 표기 (차트 레이블용)
    static formatProbabilityBounded(probability, decimals = 3) {
        // 구현 (위 참조)
    }
}
```

### Step 2: 호출 코드 업데이트

#### 변경 불필요 (기존 동작 유지)
```javascript
// ResultView.js:89-90 - 범례
listData.push(Formatter.formatProbability(listDP[k]));

// ResultView.js:163 - 툴팁
tooltipVals.push(Formatter.formatProbability(val));

// GachaResultView.js:140, 148, 155 - 요약
Formatter.formatProbability(dp[M])
```

**이유**: 기존 `formatProbability`가 내부에서 `formatProbabilityFraction`을 호출하므로 동작 변경 없음

#### 새로 추가 (차트 레이블)

**위치**: Chart.js datalabels 설정

```javascript
// 현재 (예상 위치: ChartAdapter.js 또는 ResultView.js)
datalabels: {
    formatter: (value) => `${value.toFixed(2)}%`
}

// 변경 후
datalabels: {
    formatter: (value) => Formatter.formatProbabilityBounded(value / 100, 2)
}
```

**주의**: 차트 레이블은 이미 백분율(`value`)로 전달되므로 `/100` 필요

---

## 확장 가능성

### 향후 옵션: 부등호 모드 (선택사항)

현재는 화살표 방식이 기본이지만, 향후 사용자 설정에서 부등호 모드 선택 가능하게 할 수 있음:

```javascript
static formatProbabilityBounded(probability, decimals = 3, style = 'arrow') {
    // ... (동일)

    if (style === 'arrow') {
        if (percent < threshold) return `${threshold.toFixed(decimals)}%↓`;
        if (percent > 100 - threshold) return `${(100 - threshold).toFixed(decimals)}%↑`;
    } else if (style === 'inequality') {
        if (percent < threshold) return `< ${threshold.toFixed(decimals)}%`;
        if (percent > 100 - threshold) return `> ${(100 - threshold).toFixed(decimals)}%`;
    }

    // ... (동일)
}
```

**현재 v1.8.0**: 화살표 방식만 구현 (style 파라미터 없음)
**향후 v1.9.0**: 설정 UI에서 스타일 선택 가능

---

## 테스트 케이스

### formatProbabilityFraction 테스트

```javascript
// decimals = 3
formatProbabilityFraction(0) → "0.000%"
formatProbabilityFraction(0.000003) → "1/333,333"
formatProbabilityFraction(0.00001) → "1/100,000"
formatProbabilityFraction(0.00123) → "0.001%"
formatProbabilityFraction(0.5) → "50.000%"
formatProbabilityFraction(0.999997) → "100.000%"
formatProbabilityFraction(1) → "100.000%"

// decimals = 2
formatProbabilityFraction(0.000003, 2) → "1/333,333"
formatProbabilityFraction(0.00123, 2) → "0.00%"
formatProbabilityFraction(0.5, 2) → "50.00%"
```

### formatProbabilityBounded 테스트

```javascript
// decimals = 3
formatProbabilityBounded(0) → "0.000%"
formatProbabilityBounded(0.000003) → "0.001%↓"
formatProbabilityBounded(0.00001) → "0.001%↓"
formatProbabilityBounded(0.00123) → "0.001%"
formatProbabilityBounded(0.5) → "50.000%"
formatProbabilityBounded(0.999985) → "99.999%"
formatProbabilityBounded(0.999997) → "99.999%↑"
formatProbabilityBounded(1) → "100.000%"

// decimals = 2
formatProbabilityBounded(0.000003, 2) → "0.01%↓"
formatProbabilityBounded(0.00123, 2) → "0.01%↓"  ← 주의!
formatProbabilityBounded(0.5, 2) → "50.00%"
```

---

## 구현 순서 (v1.8.0)

1. ✅ **분석 완료**: 현재 사용처 파악
2. ⏳ **메서드 추가**: `formatProbabilityFraction`, `formatProbabilityBounded`
3. ⏳ **테스트 작성**: test-formatter.html 생성
4. ⏳ **차트 레이블 적용**: ChartAdapter.js 또는 ResultView.js 수정
5. ⏳ **검증**: 모든 가챠 타입에서 테스트
6. ⏳ **문서 업데이트**: UPDATE.md에 v1.8.0 추가

---

## 주의 사항

### 경계값 판정 로직

**현재 로직** (`formatProbabilityBounded`):
```javascript
const threshold = 1 / Math.pow(10, decimals);  // 0.001 (decimals=3)
if (percent < threshold) return `< ${threshold.toFixed(decimals)}%`;
```

**문제**: `percent = 0.0005%`일 때
- `0.0005 < 0.001` → `< 0.001%` ✅ 정확
- `percent.toFixed(3)` → `"0.001%"` ← 반올림으로 `0.001%` 표시
- 혼란 가능: "왜 `0.001%`와 `< 0.001%`가 다른가?"

**해결책**: threshold를 약간 높게 설정
```javascript
const threshold = 1 / Math.pow(10, decimals);
const displayThreshold = threshold;
const judgeThreshold = threshold * 1.0001;  // 약간의 여유

if (percent < judgeThreshold && percent.toFixed(decimals) === displayThreshold.toFixed(decimals)) {
    return `< ${displayThreshold.toFixed(decimals)}%`;
}
```

**또는 더 간단한 방법**:
```javascript
const text = percent.toFixed(decimals);
const threshold = `0.${'0'.repeat(decimals)}`;

if (text === threshold && percent > 0) {
    return `< ${text}%`;
}
```

---

## 대안: 화살표 표기 (옵션)

**사용자 제안**: `0.001▼%`, `99.999▲%`

**장점**:
- 시각적으로 매우 직관적
- 게임 UI에 적합
- 짧고 명확

**단점**:
- 비표준 표기법
- 일부 사용자는 의미를 즉시 이해 못할 수 있음

**권장**:
- v1.8.0: 부등호 기본 사용 (표준적)
- v1.8.1: 설정에서 화살표 모드 선택 가능

---

## 최종 권장

**v1.8.0 구현**:
1. `formatProbabilityFraction` - 분수 표기 (범례/툴팁/요약)
2. `formatProbabilityBounded` - 부등호 표기 (차트 레이블)
3. 기존 `formatProbability`는 호환성 유지 (내부에서 `formatProbabilityFraction` 호출)

**확장 계획**:
- v1.8.1: 화살표 모드 옵션 추가
- v1.9.0: 사용자 설정 UI (표기법 선택)
