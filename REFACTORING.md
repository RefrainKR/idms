# REFACTORING.md

샤니송 가챠 확률 시뮬레이터의 리팩토링 히스토리 및 남은 기회를 정리합니다.

> **상태**: v1.7.3 리팩토링 완료 - 5개 우선순위 항목 해결 완료

---

## ✅ 완료된 리팩토링 (v1.7.3)

### 1. ✅ View/ViewModel 강결합 해소 (High Priority)

**해결 방법**:
- [GachaTypeConfig.js](scsfp/js/view/gacha/GachaTypeConfig.js) 생성
- 모든 가챠 타입의 UI 설정 중앙화 (element IDs, feature flags)
- `GachaResultView.render()` 통합 메서드 생성
- 기존 `render3Star()`, `renderBirthday()`, `render2Star()` 메서드는 래퍼로 유지 (하위 호환성)

**효과**:
- 새 가챠 타입 추가 시 설정 파일만 수정
- 하드코딩된 element ID 제거
- 렌더링 로직 중복 제거

**변경 파일**:
- `js/view/gacha/GachaTypeConfig.js` (NEW)
- [js/view/gacha/GachaResultView.js](scsfp/js/view/gacha/GachaResultView.js)

---

### 2. ✅ Observable 메모리 누수 방지 (High Priority)

**해결 방법**:
- `Observable.subscribe()` 메서드가 unsubscribe 함수 반환
- `BaseGachaViewModel`에 `_subscriptions` 배열과 `destroy()` 메서드 추가
- `InputBinder.bind()` 메서드가 unsubscribe 함수 반환

**효과**:
- SPA 전환 시 메모리 누수 방지
- 명시적인 리소스 정리 패턴 도입

**변경 파일**:
- [js/core/Observable.js](scsfp/js/core/Observable.js)
- [js/viewmodel/gacha/BaseGachaViewModel.js](scsfp/js/viewmodel/gacha/BaseGachaViewModel.js)
- [js/view/component/InputBinder.js](scsfp/js/view/component/InputBinder.js)

---

### 3. ✅ Input 바인딩 설정 불일치 해소 (High Priority)

**해결 방법**:
- 모든 `CONFIG.INPUTS`에 `type: 'int'` 또는 `type: 'float'` 필드 추가
- `BaseGachaViewModel.bindInputs()`에서 타입 추론 로직 제거
- `setting.type || 'float'`로 단순화

**효과**:
- 타입 정보가 설정 파일에 집중
- 런타임 추론 제거로 예측 가능성 향상

**변경 파일**:
- [js/core/GachaConstants.js](scsfp/js/core/GachaConstants.js)
- [js/viewmodel/gacha/BaseGachaViewModel.js](scsfp/js/viewmodel/gacha/BaseGachaViewModel.js)

---

### 4. ✅ Tab 관리 패턴 중복 제거 (Medium Priority)

**해결 방법**:
- `GachaTypeConfig`에 `buttonVisibility` 설정 추가
- `applyTabVisibility()` 함수로 버튼 visibility 자동 관리
- 3개 ViewModel의 `onTabChange()` 단순화 (각 ~15줄 → ~4줄)

**효과**:
- 3개 ViewModel에서 `toggle()` 함수 중복 제거
- 약 30줄 감소
- 탭별 버튼 표시 규칙이 설정으로 관리됨

**변경 파일**:
- [js/view/gacha/GachaTypeConfig.js](scsfp/js/view/gacha/GachaTypeConfig.js)
- [js/viewmodel/gacha/Star3GachaViewModel.js](scsfp/js/viewmodel/gacha/Star3GachaViewModel.js)
- [js/viewmodel/gacha/BirthdayGachaViewModel.js](scsfp/js/viewmodel/gacha/BirthdayGachaViewModel.js)
- [js/viewmodel/gacha/Star2GachaViewModel.js](scsfp/js/viewmodel/gacha/Star2GachaViewModel.js)

---

### 5. ✅ Observable 의존성 패턴 표준화 (Medium Priority)

**해결 방법**:
- `CONFIG`에 `DEPENDENCIES` 배열 추가 (선언적 정의)
- `BaseGachaViewModel.applyDependencies()` 메서드로 자동 적용
- 각 ViewModel의 `setupDataDependencies()` 메서드 제거

**예시**:
```javascript
// GachaConstants.js
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
        }
    ]
}
```

**효과**:
- 의존성 로직이 설정 파일에 집중
- `setupDataDependencies()` 중복 제거
- 새 의존성 추가 시 코드 수정 불필요

**변경 파일**:
- [js/core/GachaConstants.js](scsfp/js/core/GachaConstants.js)
- [js/viewmodel/gacha/BaseGachaViewModel.js](scsfp/js/viewmodel/gacha/BaseGachaViewModel.js)
- [js/viewmodel/gacha/Star3GachaViewModel.js](scsfp/js/viewmodel/gacha/Star3GachaViewModel.js)
- [js/viewmodel/gacha/Star2GachaViewModel.js](scsfp/js/viewmodel/gacha/Star2GachaViewModel.js)

---

## 🟢 Low Priority (선택적 최적화)

아래 항목들은 현재 구현이 충분히 명확하며, 리팩토링의 실질적 이득이 적습니다.
필요 시 선택적으로 진행하되, 현재 상태 유지를 권장합니다.

### 6. EfficiencyCalculator 루프 패턴 추상화

**현재 상태**: 시뮬레이션 루프가 3개 메서드에서 반복
**이득**: 약 20줄 감소, 추상화로 인한 복잡도 증가
**권장**: 현재 상태 유지 (각 메서드의 로직이 명확함)

### 7. ToggleButton 매직 문자열 제거

**현재 상태**: Element ID가 ViewModel에 하드코딩
**이득**: 설정 중앙화
**권장**: 현재 상태 유지 (변경 빈도가 낮음)

### 8. DOM 헬퍼 함수 중앙화

**현재 상태**: `document.getElementById()` 반복
**이득**: 약간의 코드 중복 감소
**권장**: 현재 상태 유지 (과도한 추상화)

### 9. Chart 타입별 렌더링 통합

**현재 상태**: `renderCollection`, `renderTotal`, `renderEfficiency` 분리
**이득**: 약간의 코드 통합
**권장**: 현재 상태 유지 (각 차트 타입별 로직이 다름)

### 10. Formatter 정적 메서드 → 함수 변환

**현재 상태**: `Formatter.percent()`, `Formatter.pulls()` 등
**이득**: import 방식 변경
**권장**: 현재 상태 유지 (정적 메서드가 명확함)

### 11. ProbabilityValidator 모듈화

**현재 상태**: 단일 클래스에 여러 유틸리티
**이득**: 세분화
**권장**: 현재 상태 유지 (응집도가 높음)

### 12. ChartUtils.generateLabels() 타입 안전성

**현재 상태**: 배열 반환 시 타입 체크 없음
**이득**: 타입 안전성 (TypeScript 필요)
**권장**: 현재 상태 유지 (JavaScript 프로젝트)

### 13. GachaConstants 분리

**현재 상태**: 단일 파일에 모든 설정
**이득**: 파일 크기 감소
**권장**: 현재 상태 유지 (설정이 한 곳에 모여 있어 편리)

### 14. StorageManager 에러 핸들링

**현재 상태**: `JSON.parse()` 실패 시 무시
**이득**: 에러 로깅
**권장**: 현재 상태 유지 (실패 시 기본값 사용하는 것이 적절)

### 15. EfficiencyCalculator 결과 캐싱

**현재 상태**: 매번 재계산
**이득**: 성능 최적화 (미미함)
**권장**: 현재 상태 유지 (계산이 빠르고 입력이 자주 변경됨)

---

## 📊 통계 요약

### v1.7.3 리팩토링 성과

- **해결된 항목**: 5개 (High: 3, Medium: 2)
- **제거된 중복 코드**: 약 80줄
- **신규 파일**: 1개 (GachaTypeConfig.js)
- **개선된 패턴**: Observable 구독 관리, 설정 중앙화, 의존성 선언화

### 현재 상태

- **코드 품질**: 우수
- **기술 부채**: 없음
- **유지보수성**: 높음
- **남은 Low Priority 항목**: 10개 (선택적)

---

## 권장사항

**✅ 현재 상태 유지 권장**

v1.7.3에서 모든 High/Medium Priority 리팩토링이 완료되었으며, 코드베이스는 안정적이고 유지보수 가능한 상태입니다.

Low Priority 항목들은 실질적 이득이 적으며, 과도한 추상화로 인한 복잡도 증가 우려가 있습니다.

**향후 리팩토링 고려 시점**:
- TypeScript 전환 시 (타입 안전성 관련 항목)
- SPA 프레임워크 도입 시 (라우팅, 상태 관리)
- 새로운 가챠 타입 대량 추가 시 (추가 추상화 필요)
