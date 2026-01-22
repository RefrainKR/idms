# UPDATE.md

샤니송 가챠 확률 시뮬레이터의 업데이트 히스토리를 기록합니다.

---

## 2026-01-21: HTML/CSS 리팩토링 완료

### ID 네이밍 통일화
**문제**: 3성(`resetBtn3`), 생일(`resetBtnBirthday`), 2성(`resetBtn2`) 간 네이밍 규칙 불일치

**해결**: 모든 ID를 `{type}-{element}` 패턴으로 통일

| 요소 | 이전 (3성 / 생일 / 2성) | 현재 |
|------|----------------------|------|
| 리셋 버튼 | `resetBtn3` / `resetBtnBirthday` / `resetBtn2` | `star3-reset-btn` / `birthday-reset-btn` / `star2-reset-btn` |
| 천장 토글 | `toggleCeilingBtn3` / `toggleCeilingBtnBirthday` / `toggleCeilingBtn2` | `star3-toggle-ceiling` / `birthday-toggle-ceiling` / `star2-toggle-ceiling` |
| 뷰 토글 | `toggleViewBtn3` / `toggleViewBtnBirthday` / `toggleViewBtn2` | `star3-toggle-view` / `birthday-toggle-view` / `star2-toggle-view` |
| 효율 토글 | `btnEfficiencyToggle3` / `btnEfficiencyToggleBirthday` / `btnEfficiencyToggle2` | `star3-efficiency-toggle` / `birthday-efficiency-toggle` / `star2-efficiency-toggle` |
| 효율 모드 토글 | `btnEfficiencyModeToggle3` | `star3-efficiency-mode-toggle` |
| 프리셋 컨테이너 | `star3PresetContainer` | `star3-preset-container` |
| 2성 그룹 뷰 모드 | `btnGroupViewMode` | `star2-group-view-mode` |
| 2성 그룹 효율 모드 | `btnGroupEfficiencyMode` | `star2-group-efficiency-mode` |

**영향 파일**:
- [index.html](scsfp/index.html)
- [Star3GachaViewModel.js](scsfp/js/viewmodel/gacha/Star3GachaViewModel.js)
- [BirthdayGachaViewModel.js](scsfp/js/viewmodel/gacha/BirthdayGachaViewModel.js)
- [Star2GachaViewModel.js](scsfp/js/viewmodel/gacha/Star2GachaViewModel.js)

### Div Depth 축소 (11단계 → 8단계)
**문제**: 과도한 중첩 구조 (`container` → ... → `canvas` 11단계)

**해결**:
- 시멘틱 HTML 태그 적용 (`<header>`, `<main>`, `<section>`, `<aside>`, `<footer>`)
- 서브탭에서 불필요한 `tab-content-wrapper` 제거
- `result-area` 래퍼 제거

**이전 구조** (11단계):
```
container (1) → main-tab-system (2) → tab-content-wrapper (3) → tab-3star (4)
→ sub-tab-container (5) → tab-content-wrapper (6) → res-3s-collection (7)
→ result-area (8) → chart-row (9) → chart-container (10) → canvas (11)
```

**최종 구조** (8단계):
```
container (1) → main (2) → section[tab-3star] (3)
→ sub-tab-container (4) → div[res-3s-collection] (5)
→ chart-row (6) → chart-container (7) → canvas (8)
```

**영향 파일**:
- [index.html](scsfp/index.html)
- [TabManager.js](scsfp/js/view/component/TabManager.js) - `tab-content-wrapper` 없이도 동작하도록 개선

### 인라인 스타일 정리
**해결**: 반복되는 인라인 스타일을 CSS 클래스로 추출

추가된 CSS 클래스:
- `.chart-full`: `width: 100%; flex: none;` - 전체 너비 차트용
- `.input-hint`: 입력 힌트 텍스트 스타일
- `.input-row-half`: 반너비 입력 행
- `.cdf-input-area`: CDF 입력 영역 스타일

**예외**: JavaScript로 동적 제어하는 `style="display:none;"` 유지 (의도된 설계)

**영향 파일**:
- [index.html](scsfp/index.html)
- [style.css](scsfp/css/style.css)

### CSS 개선
**개선 사항**:
- **중복 규칙 제거**: `.view-toggle-btn[data-state="worst"]` 2회 선언 통합
- **!important 제거**: specificity 개선으로 4곳 모두 제거
- **미사용 클래스 제거**: `.cdf-input-section` 제거
- **색상 변수화**: `:root`에 `--surface-light`, `--surface-medium`, `--surface-blue` 변수 추가
- **11개 섹션으로 구조화**: 주석으로 명확히 구분
  1. Base Layout
  2. Tab System
  3. Inputs
  4. Collapsible Sections
  5. Reset & Preset Controls
  6. Loop Rewards UI
  7. Result Options Header
  8. Sub Tab Navigation
  9. Charts & Results
  10. Shared Summary
  11. Responsive Design

**영향 파일**:
- [style.css](scsfp/css/style.css)

### 시멘틱 HTML 적용
**구조**:
- `<header>`: 타이틀 영역 (h1 포함)
- `<main>`: 메인 탭 시스템 전체
- `<section>`: 각 가챠 타입 탭
  - `#tab-3star` (3성 가챠)
  - `#tab-birthday` (생일 가챠)
  - `#tab-2star` (2성 가챠)
- `<aside>`: 공유 결과 요약 영역 (`#shared-result-area`)
- `<footer>`: 향후 저작권, 링크 등 추가 예정 (현재 더미)

**미사용 태그**:
- `<nav>`: 향후 다른 게임 기능 추가 시 사용 예정 (예: 다른 게임 모드, 설정 페이지 등)

**영향 파일**:
- [index.html](scsfp/index.html)

---

## 2026-01-20: 코드 품질 개선

### Phase 1: 안정성 강화

#### 마법 숫자 상수화
**문제**: 하드코딩된 가챠 규칙 숫자 (40, 200, 50, 10 등)가 코드 전반에 산재

**해결**: [GachaConstants.js](scsfp/js/core/GachaConstants.js)에 `GACHA_RULES` 객체 추가

```javascript
export const GACHA_RULES = {
    STAR3: {
        STEPUP_CYCLE: 40,           // 40회마다 Step4 확률 부스트
        CEILING_INTERVAL: 200       // 200회마다 천장 티켓
    },
    STAR2: {
        HIGH_RATE_INTERVAL: 10,     // 일반 가챠 10회마다 95% 보정
        STEPUP_GUARANTEE_FIRST: 5,  // 첫 확정 5회
        STEPUP_GUARANTEE_INTERVAL: 10, // 이후 10회마다
        NORMAL_CEILING_INTERVAL: 100,
        STEPUP_CEILING_INTERVAL: 50
    },
    BIRTHDAY: {
        STEPUP_MAX: 30,
        STEPUP_GUARANTEE: 30,       // 30회째 100% 확정
        CEILING_INTERVAL: 200
    }
};
```

**영향 파일**:
- [GachaConstants.js](scsfp/js/core/GachaConstants.js) - 상수 정의
- [Star3GachaViewModel.js](scsfp/js/viewmodel/gacha/Star3GachaViewModel.js) - `GACHA_RULES.STAR3` 사용
- [Star2GachaViewModel.js](scsfp/js/viewmodel/gacha/Star2GachaViewModel.js) - `GACHA_RULES.STAR2` 사용
- [BirthdayGachaViewModel.js](scsfp/js/viewmodel/gacha/BirthdayGachaViewModel.js) - `GACHA_RULES.BIRTHDAY` 사용
- [ProbabilityEngine.js](scsfp/js/core/ProbabilityEngine.js) - 2성 보정 계산에 사용

#### DOM 조작 제거
**문제**: ViewModel에서 DOM 요소를 직접 조작 (`document.getElementById('targetCount')`)

**해결**: InputBinder의 `maxObserver` 옵션 사용으로 대체

**이전 코드** (Star3GachaViewModel.js):
```javascript
setupDataDependencies() {
    this.model.pickupCount.subscribe((N) => {
        const targetInput = document.getElementById('targetCount');  // ❌ DOM 직접 접근
        if (targetInput) targetInput.max = N;
    });
}
```

**개선 코드**:
```javascript
bindInputs() {
    super.bindInputs();
    this.inputBinder.bind('targetCount', this.model.targetCount, {
        maxObserver: this.model.pickupCount  // ✅ InputBinder가 처리
    });
}
```

**영향 파일**:
- [Star3GachaViewModel.js](scsfp/js/viewmodel/gacha/Star3GachaViewModel.js)
- [InputBinder.js](scsfp/js/view/component/InputBinder.js) - `maxObserver` 기능 활용

#### Chart.js import 명시화
**문제**: CDN으로 로드하는 Chart.js의 사용 방식이 명확하지 않음

**해결**: 주석 추가 및 문서화

[index.html](scsfp/index.html):
```html
<!-- Chart.js Libraries -->
<!-- CDN으로 로드하여 전역 변수로 사용 (import 문 불필요) -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0"></script>
```

[main.js](scsfp/js/main.js):
```javascript
// Chart.js 전역 변수 등록 (CDN 로드)
Chart.register(ChartDataLabels);
```

**영향 파일**:
- [index.html](scsfp/index.html) - 주석 추가
- [main.js](scsfp/js/main.js) - 주석 추가

### Phase 2: 성능 최적화

#### Chart.js 재렌더링 최적화
**문제**: 차트 업데이트 시 `destroy()` 후 재생성하여 성능 저하 및 깜빡임 발생

**이전 코드** (ChartAdapter.js):
```javascript
static renderChart(ctx, config, chartRef) {
    if (chartRef.current) {
        chartRef.current.destroy();  // ❌ 매번 파괴 후 재생성
    }
    chartRef.current = new Chart(ctx, config);
}
```

**개선 코드**:
```javascript
static renderChart(ctx, config, chartRef) {
    if (chartRef.current) {
        chartRef.current.data = config.data;
        chartRef.current.options = config.options;
        chartRef.current.update('none');  // ✅ 기존 차트 재활용, 애니메이션 없이 즉시 업데이트
    } else {
        chartRef.current = new Chart(ctx, config);
    }
}
```

**효과**:
- 차트 업데이트 성능 향상
- 깜빡임 제거
- 메모리 사용량 감소

**영향 파일**:
- [ChartAdapter.js](scsfp/js/utils/ChartAdapter.js)

### Phase 3: 확장성 개선

#### EfficiencyCalculator 서비스 클래스 분리
**문제**: 3개 ViewModel에서 효율 계산 로직 중복 (~135줄)

**해결**: [EfficiencyCalculator.js](scsfp/js/core/EfficiencyCalculator.js) 신규 생성

**제공 메서드**:
```javascript
// 3성 가챠 효율 계산
static calculate3Star({ M, p_indiv, p_step4, loopRewards, ... })

// 3성 가챠 CDF 역추적
static calculate3StarCDF({ M, p_indiv, p_step4, targetProb, ... })

// 2성 가챠 효율 계산
static calculate2Star({ groupConfigs, ceilingMode, ... })

// 생일 가챠 효율 계산
static calculateBirthday({ normalRate, stepRate, ceilingMode })
```

**효과**:
- 3개 ViewModel에서 `_calculateEfficiencyData()` 메서드 제거
- Star3GachaViewModel의 `_calculateCDFData()` 메서드 제거
- 총 ~135줄 중복 코드 제거
- 효율 계산 로직 중앙화로 유지보수성 향상

**영향 파일**:
- [EfficiencyCalculator.js](scsfp/js/core/EfficiencyCalculator.js) - 신규 생성
- [Star3GachaViewModel.js](scsfp/js/viewmodel/gacha/Star3GachaViewModel.js) - 효율/CDF 계산 위임
- [Star2GachaViewModel.js](scsfp/js/viewmodel/gacha/Star2GachaViewModel.js) - 효율 계산 위임
- [BirthdayGachaViewModel.js](scsfp/js/viewmodel/gacha/BirthdayGachaViewModel.js) - 효율 계산 위임

#### ProbabilityEngine 그룹 계산 중앙화
**문제**: Star2GachaViewModel에서 그룹별 스탭업 계산 로직(`_calcGroup`)이 ViewModel에 존재

**해결**: [ProbabilityEngine.js](scsfp/js/core/ProbabilityEngine.js)에 `calcStepupGroup()` 메서드 추가

**이전 코드** (Star2GachaViewModel.js):
```javascript
_calcGroup(countStep, pullsStep, ceilingMode) {
    // ... 40줄 이상의 복잡한 스탭업 계산 로직
}
```

**개선 코드** (ProbabilityEngine.js):
```javascript
static calcStepupGroup(N, pulls, p_each, ceilingMode) {
    // 2성 그룹별 스탭업 가챠 계산 (확정 5회, 15회, 25회...)
    // 천장: 50회마다
    // ...
}
```

**효과**:
- ViewModel에서 40줄 이상의 계산 로직 제거
- ProbabilityEngine으로 확률 계산 로직 중앙화
- 2성 그룹 계산 로직 재사용 가능

**영향 파일**:
- [ProbabilityEngine.js](scsfp/js/core/ProbabilityEngine.js) - `calcStepupGroup()` 추가
- [Star2GachaViewModel.js](scsfp/js/viewmodel/gacha/Star2GachaViewModel.js) - `_calcGroup()` 제거, `calcStepupGroup()` 사용

---

## 2026-01-19: 기능 추가

### CDF 역추적 기능
**기능**: 목표 확률 달성에 필요한 가챠 횟수 계산

**구현 위치**: 3성 가챠 - 역추적 서브탭 (`res-3s-cdf`)

**UI**:
- 목표 확률 입력 필드 (`targetProbability3`)
- CDF 차트: 누적 확률 곡선 + 목표 달성 지점 표시
- 결과 요약: 필요한 일반/스탭업 가챠 횟수

**계산 로직**:
```javascript
EfficiencyCalculator.calculate3StarCDF({
    M, p_indiv, p_step4, targetProb, randomMode, step4Mode, loopRewards, ...
})
```

**영향 파일**:
- [index.html](scsfp/index.html) - CDF 서브탭 추가
- [Star3GachaModel.js](scsfp/js/model/gacha/Star3GachaModel.js) - `targetProbability` Observable 추가
- [Star3GachaViewModel.js](scsfp/js/viewmodel/gacha/Star3GachaViewModel.js) - CDF 탭 처리 로직
- [EfficiencyCalculator.js](scsfp/js/core/EfficiencyCalculator.js) - `calculate3StarCDF()` 메서드
- [GachaResultView.js](scsfp/js/view/gacha/GachaResultView.js) - `renderCDFChart()` 메서드

---

## v1.7.3 (2026-01-22) - 아키텍처 리팩토링

### 개요
코드베이스 전반에 걸친 대규모 리팩토링으로 유지보수성, 확장성, 안정성을 대폭 향상시켰습니다. 5개의 우선순위 리팩토링 항목을 모두 완료했으며, 기능적 변화는 없고 내부 구조만 개선되었습니다.

### 주요 변경사항

#### 1. View/ViewModel 강결합 해소 (High Priority)

**문제**: 가챠 타입별로 별도 렌더 메서드가 존재하고 element ID가 하드코딩됨

**해결**:
```javascript
// 신규 파일: js/view/gacha/GachaTypeConfig.js
export const GACHA_TYPE_CONFIG = {
    star3: {
        mainTabId: 'tab-3star',
        charts: { collection: { canvas: 'resultChart', legend: 'legendList' } },
        subTabs: { collection: 'res-3s-collection', ... },
        hasRandomMode: true,
        hasCdfTab: true,
        buttonVisibility: { efficiency: ['star3-efficiency-toggle'], ... }
    },
    // birthday, star2 설정...
};

// GachaResultView.js - 통합 렌더링
static render(gachaType, result, context, model, charts) {
    const config = getGachaConfig(gachaType);
    // 설정 기반 렌더링...
}
```

**효과**:
- 새 가챠 타입 추가 시 설정 파일만 수정
- 렌더링 로직 중복 제거
- Element ID 하드코딩 제거

**영향 파일**:
- `js/view/gacha/GachaTypeConfig.js` (NEW)
- [js/view/gacha/GachaResultView.js](scsfp/js/view/gacha/GachaResultView.js)

---

#### 2. Observable 메모리 누수 방지 (High Priority)

**문제**: Observable 구독이 해제되지 않아 장기 사용 시 메모리 누수 가능성

**해결**:
```javascript
// Observable.js - unsubscribe 함수 반환
subscribe(listener) {
    this._listeners.push(listener);
    return () => {
        this._listeners = this._listeners.filter(l => l !== listener);
    };
}

// BaseGachaViewModel.js - 구독 관리
constructor() {
    this._subscriptions = [];
}

init() {
    const unsubscribe = observable.subscribe(...);
    this._subscriptions.push(unsubscribe);
}

destroy() {
    this._subscriptions.forEach(unsub => unsub());
    this._subscriptions = [];
}
```

**효과**:
- SPA 전환 시 메모리 누수 방지
- 명시적인 리소스 정리 패턴

**영향 파일**:
- [js/core/Observable.js](scsfp/js/core/Observable.js)
- [js/viewmodel/gacha/BaseGachaViewModel.js](scsfp/js/viewmodel/gacha/BaseGachaViewModel.js)
- [js/view/component/InputBinder.js](scsfp/js/view/component/InputBinder.js)

---

#### 3. Input 바인딩 설정 불일치 해소 (High Priority)

**문제**: 입력 필드 타입(int/float)을 런타임에 추론하여 예측하기 어려움

**해결**:
```javascript
// GachaConstants.js - 명시적 타입 선언
STAR3: {
    INPUTS: [
        { id: 'pickupCount', min: 1, max: 100, def: 2, type: 'int' },
        { id: 'pickupRate', min: 0, max: 100, def: 1, type: 'float' },
        // ...
    ]
}

// BaseGachaViewModel.js - 타입 추론 제거
bindInputs() {
    const setting = configMap.get(id) || {};
    let binderOptions = {
        type: setting.type || 'float',  // 명시적 타입 사용
        // ...
    };
}
```

**효과**:
- 타입 정보가 설정에 집중
- 런타임 추론 로직 제거로 예측 가능성 향상

**영향 파일**:
- [js/core/GachaConstants.js](scsfp/js/core/GachaConstants.js)
- [js/viewmodel/gacha/BaseGachaViewModel.js](scsfp/js/viewmodel/gacha/BaseGachaViewModel.js)

---

#### 4. Tab 관리 패턴 중복 제거 (Medium Priority)

**문제**: 3개 ViewModel에서 `onTabChange()` 로직이 거의 동일 (각 ~15줄)

**해결**:
```javascript
// GachaTypeConfig.js - 버튼 visibility 설정
buttonVisibility: {
    efficiency: ['star3-efficiency-toggle', 'star3-efficiency-mode-toggle'],
    collection: ['star3-toggle-view'],
    cdf: []  // CDF 탭에서는 버튼 숨김
}

// applyTabVisibility() 함수로 자동 관리
export function applyTabVisibility(config, activeSubTab) {
    // 설정 기반으로 버튼 visibility 자동 처리
}

// ViewModel - 단순화됨
onTabChange(tabId) {
    this.calculate();
    const config = getGachaConfig('star3');
    applyTabVisibility(config, tabId);
}
```

**효과**:
- 3개 ViewModel에서 중복 코드 제거 (각 15줄 → 4줄)
- 탭별 버튼 표시 규칙이 설정으로 관리

**영향 파일**:
- [js/view/gacha/GachaTypeConfig.js](scsfp/js/view/gacha/GachaTypeConfig.js)
- [js/viewmodel/gacha/Star3GachaViewModel.js](scsfp/js/viewmodel/gacha/Star3GachaViewModel.js)
- [js/viewmodel/gacha/BirthdayGachaViewModel.js](scsfp/js/viewmodel/gacha/BirthdayGachaViewModel.js)
- [js/viewmodel/gacha/Star2GachaViewModel.js](scsfp/js/viewmodel/gacha/Star2GachaViewModel.js)

---

#### 5. Observable 의존성 패턴 표준화 (Medium Priority)

**문제**: 데이터 의존성 로직이 각 ViewModel의 `setupDataDependencies()`에 산재

**해결**:
```javascript
// GachaConstants.js - 선언적 의존성 정의
STAR3: {
    DEPENDENCIES: [
        {
            source: 'maxLoops',
            handler: (value, model, viewModel) => {
                model.stepMax.value = value * 40;
                if (viewModel && viewModel.updateLoopUI) {
                    viewModel.updateLoopUI();
                }
            }
        },
        {
            source: 'pickupCount',
            handler: (value, model) => {
                if (model.targetCount.value > value) {
                    model.targetCount.value = value;
                }
            }
        }
    ]
}

// BaseGachaViewModel.js - 자동 적용
applyDependencies() {
    if (!this.config || !this.config.DEPENDENCIES) return;

    this.config.DEPENDENCIES.forEach(dep => {
        const unsubscribe = this.model[dep.source].subscribe((value) => {
            if (!this.isInitializing) {
                dep.handler(value, this.model, this);
            }
        });
        this._subscriptions.push(unsubscribe);
    });
}

// ViewModel - setupDataDependencies() 제거
init() {
    this.applyDependencies();  // 자동 적용
    super.init();
}
```

**효과**:
- 의존성 로직이 설정 파일에 집중
- 각 ViewModel의 `setupDataDependencies()` 제거
- 새 의존성 추가 시 코드 수정 불필요

**영향 파일**:
- [js/core/GachaConstants.js](scsfp/js/core/GachaConstants.js)
- [js/viewmodel/gacha/BaseGachaViewModel.js](scsfp/js/viewmodel/gacha/BaseGachaViewModel.js)
- [js/viewmodel/gacha/Star3GachaViewModel.js](scsfp/js/viewmodel/gacha/Star3GachaViewModel.js)
- [js/viewmodel/gacha/Star2GachaViewModel.js](scsfp/js/viewmodel/gacha/Star2GachaViewModel.js)

---

### 리팩토링 통계

- **해결된 항목**: 5개 (High: 3, Medium: 2)
- **제거된 중복 코드**: 약 80줄
- **신규 파일**: 1개 (GachaTypeConfig.js)
- **개선된 파일**: 8개
- **개선된 패턴**:
  - Observable 구독 생명주기 관리
  - 설정 중앙화 (UI 설정, 의존성 정의)
  - 선언적 프로그래밍 (버튼 visibility, 의존성)

### 하위 호환성

모든 변경사항은 내부 구조 개선이며, 기존 API와 기능은 완전히 유지됩니다:
- `GachaResultView.render3Star()` 등 기존 메서드는 래퍼로 유지
- 사용자 대면 기능 및 UI는 변화 없음
- LocalStorage 키 및 데이터 구조 호환

### 추가 문서

이번 리팩토링의 상세 내역은 [REFACTORING.md](REFACTORING.md)를 참조하세요.

---

## v1.7.4 (2026-01-22) - 저장 동작 개선

### 변경 사항

**가챠 횟수 저장 제외**

**문제**: 2성 가챠의 스탭업 횟수(`pullsStepA`, `pullsStepB`, `pullsStepC`, `pullsStepD`)가 LocalStorage에 저장되어 페이지 새로고침 시에도 유지됨

**해결**: 가챠 횟수는 세션마다 초기화되도록 저장 대상에서 제외
```javascript
// Star2GachaModel.js - toJSON()
toJSON() {
    return {
        countNormal: this.countNormal.value,
        rateTotal: this.rateTotal.value,
        // 그룹별 픽업 수와 목표만 저장
        countStepA: this.countStepA.value,
        targetCountA: this.targetCountA.value,
        // pullsStepA 제외 (항상 0으로 시작)
        // ...
    };
}
```

**효과**:
- 사용자가 새로고침 시 가챠 횟수가 0으로 초기화됨
- 픽업 설정(countStep*, targetCount*)은 여전히 저장되어 편의성 유지
- 3성, 생일 가챠는 이미 횟수를 저장하지 않았으므로 변경 없음

**영향 파일**:
- [js/model/gacha/Star2GachaModel.js](scsfp/js/model/gacha/Star2GachaModel.js)

---

## 버전 히스토리

- **v1.7.4** (2026-01-22): 2성 가챠 횟수 저장 제외 - 세션마다 초기화
- **v1.7.3** (2026-01-22): 아키텍처 리팩토링 - 설정 중앙화, 메모리 관리, 패턴 표준화
- **v1.7.2** (2026-01-21): HTML/CSS 리팩토링, ID 네이밍 통일화, 시멘틱 HTML, 게임 시스템 문서화
- **v1.7.1** (2026-01-20): 코드 품질 개선, 서비스 클래스 분리, 성능 최적화
- **v1.7.0** (2026-01-19): CDF 역추적 기능 추가
- **v1.6.x** 이전: 기존 기능 구현 (3성/2성/생일 가챠 시뮬레이터)
