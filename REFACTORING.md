# REFACTORING.md

샤니송 가챠 확률 시뮬레이터의 추가 리팩토링 기회를 정리합니다.

> **참고**: 현재 코드베이스는 기능적으로 완전하며, 모든 기술 부채가 해결된 상태입니다.
> 이 문서의 리팩토링 항목들은 **선택적 최적화**이며, 필수는 아닙니다.

---

## 우선순위 분류

- 🔴 **High**: 새 기능 추가 또는 장기 운영 시 권장
- 🟡 **Medium**: 코드 품질 향상 및 유지보수성 개선
- 🟢 **Low**: 세부 최적화 및 코드 정리

---

## 🔴 High Priority

### 1. View/ViewModel 강결합 해소

**문제**: GachaResultView가 3개 가챠 타입별로 별도 렌더 메서드 보유

**현재 구조**:
```javascript
// GachaResultView.js
static render3Star(result, context, model, charts) { ... }
static render2Star(result, context, model, charts) { ... }
static renderBirthday(result, context, model, charts) { ... }
```

**문제점**:
- 새 가챠 타입 추가 시 GachaResultView 수정 필요
- Element ID가 하드코딩되어 있음 (`'resultChart'`, `'legendList'` 등)
- 렌더링 로직이 3번 중복 (구조는 동일, ID만 다름)

**제안 해결책**:

#### Step 1: 가챠 타입 설정 분리
```javascript
// 신규 파일: js/view/gacha/GachaTypeConfig.js
export const GACHA_TYPE_CONFIG = {
    star3: {
        mainTabId: 'tab-3star',
        subTabContainerId: 'sub-tab-system-3star',
        charts: {
            collection: { canvas: 'resultChart', legend: 'legendList' },
            total: { canvas: 'resultChartTotal3' },
            efficiency: { canvas: 'efficiencyChart' },
            cdf: { canvas: 'cdfChart' }
        },
        subTabs: {
            collection: 'res-3s-collection',
            total: 'res-3s-total',
            efficiency: 'res-3s-efficiency',
            cdf: 'res-3s-cdf'
        },
        summary: { element: 'globalSummary', logic: 'globalLogic' }
    },
    birthday: {
        mainTabId: 'tab-birthday',
        subTabContainerId: 'sub-tab-system-birthday',
        charts: {
            collection: { canvas: 'resultChartBirthday', legend: 'legendListBirthday' },
            total: { canvas: 'resultChartTotalBirthday' },
            efficiency: { canvas: 'efficiencyChartBirthday' }
        },
        subTabs: {
            collection: 'res-bd-collection',
            total: 'res-bd-total',
            efficiency: 'res-bd-efficiency'
        },
        summary: { element: 'globalSummary', logic: 'globalLogic' }
    },
    star2: { /* ... */ }
};
```

#### Step 2: 통합 렌더링 메서드
```javascript
// GachaResultView.js 개선
static render(gachaType, result, context, model, charts) {
    const config = GACHA_TYPE_CONFIG[gachaType];
    if (!config) {
        console.error(`Unknown gacha type: ${gachaType}`);
        return;
    }

    const mainTab = document.getElementById(config.mainTabId);
    if (!mainTab || mainTab.style.display === 'none') return;

    const activeSubTab = this._getActiveSubTab(config.subTabContainerId);

    // 렌더링 로직 통합 (기존 3개 메서드 병합)
    if (activeSubTab === config.subTabs.collection) {
        this.renderCollection(result, context, model, config, charts);
    } else if (activeSubTab === config.subTabs.total) {
        this.renderTotal(result, context, model, config, charts);
    } else if (activeSubTab === config.subTabs.efficiency) {
        this.renderEfficiency(result, context, model, config, charts);
    } else if (activeSubTab === config.subTabs.cdf) {
        this.renderCDF(result, context, model, config, charts);
    }
}

// 각 ViewModel에서 호출
// Star3GachaViewModel.js
GachaResultView.render('star3', result, context, this.model, this.chartRefs);
```

**효과**:
- 3개 렌더 메서드 → 1개로 통합
- 새 가챠 타입 추가 시 config만 추가하면 됨
- Element ID 하드코딩 제거
- 약 200줄 감소

**영향 파일**:
- `js/view/gacha/GachaTypeConfig.js` (신규)
- `js/view/gacha/GachaResultView.js`
- `js/viewmodel/gacha/Star3GachaViewModel.js`
- `js/viewmodel/gacha/Star2GachaViewModel.js`
- `js/viewmodel/gacha/BirthdayGachaViewModel.js`

---

### 2. Observable 메모리 누수 방지

**문제**: 구독 해제 메커니즘이 없어 리스너가 누적될 가능성

**현재 코드**:
```javascript
// BaseGachaViewModel.js
for (const key in this.model) {
    if (this.model[key].subscribe) {
        this.model[key].subscribe(() => {
            if (!this.isInitializing) {
                this.calculate();
                this.save();
            }
        });
    }
}
// ❌ 구독 해제 불가능
```

**문제점**:
- 페이지를 오래 사용하거나 ViewModel이 재생성되면 리스너 누적
- 현재는 SPA가 아니라 문제없지만, 향후 SPA 전환 시 메모리 누수 발생

**제안 해결책**:

#### Step 1: Observable에 unsubscribe 추가
```javascript
// js/core/Observable.js
export class Observable {
    constructor(value) {
        this._value = value;
        this._listeners = [];
    }

    subscribe(listener) {
        this._listeners.push(listener);

        // ✅ unsubscribe 함수 반환
        return () => {
            this._listeners = this._listeners.filter(l => l !== listener);
        };
    }

    // 기존 메서드들...
}
```

#### Step 2: BaseGachaViewModel에서 구독 관리
```javascript
// js/viewmodel/gacha/BaseGachaViewModel.js
export class BaseGachaViewModel {
    constructor(storageKey, config) {
        this.storageKey = storageKey;
        this.config = config;
        this.isInitializing = true;

        // ✅ 구독 해제 함수 저장
        this._subscriptions = [];
    }

    init() {
        this.loadFromStorage();

        // 모델 변경 구독
        for (const key in this.model) {
            if (this.model[key].subscribe) {
                const unsubscribe = this.model[key].subscribe(() => {
                    if (!this.isInitializing) {
                        this.calculate();
                        this.save();
                    }
                });
                this._subscriptions.push(unsubscribe);  // ✅ 저장
            }
        }

        this.bindInputs();
        this.isInitializing = false;
        this.calculate();
    }

    // ✅ 정리 메서드 추가
    destroy() {
        this._subscriptions.forEach(unsubscribe => unsubscribe());
        this._subscriptions = [];
    }
}
```

#### Step 3: 필요 시 destroy 호출
```javascript
// 향후 SPA 전환 시 또는 페이지 이탈 시
window.addEventListener('beforeunload', () => {
    vm3Star.destroy();
    vmBirthday.destroy();
    vm2Star.destroy();
});
```

**효과**:
- 메모리 누수 방지
- SPA 전환 대비
- Observable 패턴 완성도 향상

**영향 파일**:
- `js/core/Observable.js`
- `js/viewmodel/gacha/BaseGachaViewModel.js`
- `js/view/component/InputBinder.js` (Observable 구독 시 동일 패턴 적용)

---

### 3. Input 바인딩 설정 불일치 해소

**문제**: Input 타입 정보가 GachaConstants에 없어 InputBinder가 추론 로직 사용

**현재 코드**:
```javascript
// GachaConstants.js - 타입 정보 없음
{ id: 'pickupCount', min: 1, max: 100, def: 2 }

// InputBinder.js - 추론 로직
const isInt = options.type === 'int';
let binderOptions = {
    type: (el.step === '1' ||
           id.toLowerCase().includes('pulls') ||
           id.toLowerCase().includes('count')) ? 'int' : 'float',  // ❌ 문자열 매칭
    // ...
};
```

**문제점**:
- ID 이름에 의존하는 취약한 로직
- 타입 명시 없어 유지보수 어려움
- 새 입력 필드 추가 시 타입 추론 실패 가능

**제안 해결책**:

#### Step 1: CONFIG에 타입 정보 추가
```javascript
// GachaConstants.js
export const CONFIG = {
    STAR3: {
        KEY: 'shani_gacha_3star',
        INPUTS: [
            { id: 'pickupCount', min: 1, max: 100, def: 2, type: 'int', label: '픽업 개수' },
            { id: 'pickupRate', min: 0, max: 100, def: 1.0, type: 'float', label: '개별 픽업 확률 (%)' },
            { id: 'targetCount', min: 0, max: 100, def: 0, type: 'int', label: '저격 픽업 수' },
            { id: 'maxLoops', min: 0, max: 20, def: 0, type: 'int', label: '최대 주회 수' },
            { id: 'step4Rate', min: 0, max: 100, def: 1.5, type: 'float', label: 'Step4 픽업 확률 (%)' },
            { id: 'normalPulls', min: 0, max: 10000, def: 0, type: 'int', label: '일반 횟수' },
            { id: 'stepPulls', min: 0, max: 10000, def: 0, type: 'int', label: '스탭업 횟수' },
            { id: 'targetProbability3', min: 0, max: 100, def: 90, type: 'float', label: '목표 확률 (%)' }
        ],
        // ...
    },
    STAR2: { /* ... */ },
    BIRTHDAY: { /* ... */ }
};
```

#### Step 2: InputBinder에서 타입 정보 사용
```javascript
// InputBinder.js
bind(id, observable, options = {}) {
    const element = document.getElementById(id);
    if (!element) return;

    // ✅ CONFIG에서 타입 정보 가져오기
    const inputConfig = this.config.INPUTS?.find(inp => inp.id === id);
    const type = options.type || inputConfig?.type || 'float';  // 명시적 타입 우선

    let binderOptions = {
        type: type,  // ✅ 추론 로직 제거
        clampOnInput: options.clampOnInput !== false,
        maxObserver: options.maxObserver
    };

    this._applyBind(element, observable, binderOptions);
}
```

**효과**:
- 타입 추론 로직 제거
- 설정 중앙화로 유지보수성 향상
- 새 입력 필드 추가 시 안정성 보장

**영향 파일**:
- `js/core/GachaConstants.js`
- `js/view/component/InputBinder.js`

---

## 🟡 Medium Priority

### 4. Tab 관리 패턴 중복 제거

**문제**: 3개 ViewModel에서 `onTabChange()` 로직이 거의 동일

**현재 코드**:
```javascript
// Star3GachaViewModel.js
onTabChange(tabId) {
    this.calculate();
    const isEff = (tabId === 'res-3s-efficiency');
    const isCdf = (tabId === 'res-3s-cdf');
    const toggle = (id, show) => {
        const el = document.getElementById(id);
        if (el) el.style.display = show ? '' : 'none';
    };

    toggle('star3-efficiency-toggle', isEff);
    toggle('star3-toggle-view', !isEff && !isCdf);
}

// BirthdayGachaViewModel.js - 거의 동일
onTabChange(tabId) {
    this.calculate();
    const isEff = (tabId === 'res-bd-efficiency');
    const toggle = (id, show) => { /* ... */ };

    toggle('birthday-efficiency-toggle', isEff);
    toggle('birthday-toggle-view', !isEff);
}

// Star2GachaViewModel.js - 거의 동일
```

**제안 해결책**:
```javascript
// 신규 파일: js/view/component/TabViewManager.js
export class TabViewManager {
    static toggleVisibility(elementId, show) {
        const el = document.getElementById(elementId);
        if (el) el.style.display = show ? '' : 'none';
    }

    static applyTabVisibility(toggleSpecs) {
        toggleSpecs.forEach(spec => {
            this.toggleVisibility(spec.id, spec.show);
        });
    }
}

// ViewModel에서 사용
onTabChange(tabId) {
    this.calculate();
    const isEff = (tabId === this.config.subTabs.efficiency);
    const isCdf = (tabId === this.config.subTabs.cdf);  // Star3만

    TabViewManager.applyTabVisibility([
        { id: 'star3-efficiency-toggle', show: isEff },
        { id: 'star3-toggle-view', show: !isEff && !isCdf }
    ]);
}
```

**효과**:
- 3개 ViewModel에서 `toggle()` 함수 중복 제거
- 약 30줄 감소

**영향 파일**:
- `js/view/component/TabViewManager.js` (신규)
- 3개 ViewModel 파일

---

### 5. Observable 의존성 패턴 표준화

**문제**: 데이터 의존성 로직이 각 ViewModel의 `setupDataDependencies()`에 산재

**현재 코드**:
```javascript
// Star3GachaViewModel.js
setupDataDependencies() {
    this.model.maxLoops.subscribe((val) => {
        this.model.stepMax.value = val * GACHA_RULES.STAR3.STEPUP_CYCLE;
    });
}

// Star2GachaViewModel.js
setupDataDependencies() {
    ['A', 'B', 'C', 'D'].forEach(id => {
        this.model[`countStep${id}`].subscribe(() => {
            this.calculate();
        });
    });
}
```

**제안 해결책**:
```javascript
// GachaConstants.js에 의존성 정의
STAR3: {
    DEPENDENCIES: [
        {
            source: 'maxLoops',
            target: 'stepMax',
            compute: (maxLoops) => maxLoops * GACHA_RULES.STAR3.STEPUP_CYCLE
        }
    ]
}

// BaseGachaViewModel에 적용 메서드 추가
applyDependencies() {
    if (!this.config.DEPENDENCIES) return;

    this.config.DEPENDENCIES.forEach(dep => {
        this.model[dep.source].subscribe((value) => {
            if (dep.target) {
                this.model[dep.target].value = dep.compute(value);
            } else {
                dep.compute(value);  // 부수 효과만 있는 경우
            }
        });
    });
}
```

**효과**:
- 의존성 로직 선언적으로 정의
- 설정 변경 시 코드 수정 불필요

**영향 파일**:
- `js/core/GachaConstants.js`
- `js/viewmodel/gacha/BaseGachaViewModel.js`
- 3개 ViewModel 파일

---

### 6. EfficiencyCalculator 루프 패턴 추상화

**문제**: 시뮬레이션 루프가 3개 메서드에서 반복

**현재 코드**:
```javascript
// calculate3Star, calculate2Star 등에서 반복
for (let pulls = 0; pulls <= 200; pulls++) {
    labels.push(pulls);

    let dpN = new Array(M + 1).fill(0);
    dpN[0] = 1.0;
    for (let i = 0; i < pulls; i++) {
        dpN = ProbabilityEngine.runSinglePull(dpN, p_indiv);
    }
    if (ceilingMode === 'included') {
        // ... 천장 로직
    }
    normalData.push({ best: dpN[M] * 100, worst: dpN[0] * 100 });
}
```

**제안 해결책**:
```javascript
// EfficiencyCalculator.js
static simulatePullSequence({ pulls, M, pullType, prob, ceilingInterval, ceilingMode }) {
    let dp = new Array(M + 1).fill(0);
    dp[0] = 1.0;

    for (let i = 0; i < pulls; i++) {
        dp = ProbabilityEngine.runSinglePull(dp, prob);

        // 천장 처리
        if (ceilingMode === 'included' && (i + 1) % ceilingInterval === 0) {
            dp = ProbabilityEngine.runGuaranteedPull(dp);
        }
    }

    return { dp, best: dp[M] * 100, worst: dp[0] * 100 };
}

// 사용 예
static calculate3Star({ M, p_indiv, ... }) {
    const labels = [];
    const normalData = [];

    for (let pulls = 0; pulls <= 200; pulls++) {
        labels.push(pulls);
        const result = this.simulatePullSequence({
            pulls, M, pullType: 'normal', prob: p_indiv,
            ceilingInterval: GACHA_RULES.STAR3.CEILING_INTERVAL, ceilingMode
        });
        normalData.push(result);
    }
}
```

**효과**:
- 시뮬레이션 로직 재사용
- 약 50-80줄 감소

**영향 파일**:
- `js/core/EfficiencyCalculator.js`

---

## 🟢 Low Priority (세부 최적화)

### 7. Toggle Button 초기화 패턴 통합

**문제**: 각 ViewModel에서 toggle 버튼 생성 반복 (15+ 문장)

**제안**: `ToggleButtonBinder` 유틸리티 생성
- GachaConstants에 토글 버튼 설정 추가
- 설정 기반 자동 바인딩

**영향 파일**: 3개 ViewModel, GachaConstants

---

### 8. 매직 문자열 상수화

**문제**: 서브탭 ID, 모드 이름 등이 문자열로 하드코딩

**제안**: GachaConstants에 UI_IDS, GACHA_MODES 등 추가

**영향 파일**: 다수

---

### 9. DOM 쿼리 패턴 헬퍼

**문제**: `document.getElementById()` + null 체크 반복

**제안**: `DomHelper.bindClickHandler()` 등 유틸리티 생성

**영향 파일**: 3개 ViewModel

---

### 10. 차트 설정 템플릿 팩토리

**문제**: Chart.js 데이터셋 설정 중복

**제안**: `ChartTemplateFactory.createLineDataset()` 생성

**영향 파일**: GachaResultView, ChartAdapter

---

### 11. 입력 유효성 검사 추상화

**문제**: 값 정규화 로직 반복 (`if (M > N) M = N`)

**제안**: `ValueNormalizer.normalizeTargetCount()` 유틸리티

**영향 파일**: 2-3개 ViewModel

---

### 12. 로직 텍스트 생성 템플릿화

**문제**: `_generate3StarLogic()` 등 HTML 템플릿 중복

**제안**: `HtmlTemplateBuilder.buildLogicSection()` 생성

**영향 파일**: GachaResultView

---

### 13. 에러 처리 일관성

**문제**: `console.warn` vs `console.error` 혼용

**제안**: `ErrorHandler` 클래스로 통일

**영향 파일**: ProbabilityValidator, StorageManager, InputBinder

---

### 14. Preset 적용 로직 통합

**문제**: Star3만 프리셋 기능 있음, 수동으로 필드 설정

**제안**: `PresetApplier.apply()` 범용 유틸리티

**영향 파일**: Star3GachaViewModel, 추가로 Star2/Birthday에도 적용 가능

---

### 15. 차트 참조 관리 개선

**문제**: `{ current: null }` 패턴이 장황함

**제안**: `Map` 또는 `ChartRefManager` 클래스 사용

**영향 파일**: 3개 ViewModel

---

## 구현 우선순위 권장

현재 프로젝트가 안정적이고 기능 완성도가 높으므로, 다음 경우에만 리팩토링을 권장합니다:

### Phase 1 (High Impact) - 다음 경우 구현
- ✅ **새 가챠 타입 추가 예정** → #1 (View/ViewModel 결합도)
- ✅ **SPA 전환 또는 장시간 사용** → #2 (메모리 누수 방지)
- ✅ **입력 필드 추가/변경 예정** → #3 (Input 설정 명시화)

### Phase 2 (Medium Impact) - 코드 품질 향상
- #4-6 구현 시 약 150-200줄 감소 예상
- 유지보수성과 확장성이 크게 향상됨

### Phase 3 (Low Impact) - 선택적 최적화
- #7-15는 코드 정리 차원
- 각 항목당 10-30줄 감소
- 필요 시 개별적으로 구현 가능

---

## 리팩토링 시 주의사항

1. **기존 기능 보존**: 모든 리팩토링은 기능 변경 없이 구조만 개선
2. **테스트**: 리팩토링 후 3성/2성/생일 모든 가챠 타입 동작 확인
3. **단계적 적용**: 한 번에 모든 항목을 적용하지 말고 단계적으로 진행
4. **CLAUDE.md 필수 규칙 준수**:
   - ProbabilityValidator 필수 사용
   - `isInitializing` 플래그 유지
   - GACHA_RULES 상수 사용
   - Chart.js CDN 방식 유지

---

## 리팩토링 효과 예상

| Phase | 항목 수 | 예상 코드 감소 | 유지보수성 | 확장성 |
|-------|--------|---------------|-----------|--------|
| Phase 1 | 3개 | ~300줄 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Phase 2 | 3개 | ~150줄 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Phase 3 | 9개 | ~150줄 | ⭐⭐⭐ | ⭐⭐ |
| **합계** | **15개** | **~600줄** | **매우 높음** | **매우 높음** |

---

**최종 권장**: 현재 상태 유지 또는 Phase 1만 선택적 구현
