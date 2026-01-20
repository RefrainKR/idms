# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소의 코드를 다룰 때 참고하는 가이드입니다.

## 프로젝트 개요

**샤니송 가챠 확률 시뮬레이터** - THE IDOLM@STER Shiny Colors Song for Prism의 가챠(뽑기) 확률 계산기. 동적 계획법(DP)과 쿠폰 컬렉터 알고리즘을 활용하여 3성/2성/생일 가챠 시스템의 수집 확률을 시뮬레이션합니다.

**버전**: 1.7.1
**언어**: Vanilla JavaScript (ES6 modules)
**기술 스택**: HTML5, CSS3, Chart.js 4.4.1

## 개발 명령어

빌드 과정 없는 클라이언트 사이드 웹 애플리케이션입니다. 개발 시:

```bash
# scsfp/ 디렉토리를 정적 파일 서버로 실행
cd scsfp
python -m http.server 8000
# 또는
npx serve
```

브라우저에서 `http://localhost:8000/index.html` 접속

## 아키텍처

### MVVM 패턴

코드베이스는 Model-View-ViewModel 아키텍처를 따릅니다:

- **Models** ([js/model/gacha/](scsfp/js/model/gacha/)): Observable 패턴으로 상태 저장
  - [Star3GachaModel.js](scsfp/js/model/gacha/Star3GachaModel.js), [Star2GachaModel.js](scsfp/js/model/gacha/Star2GachaModel.js), [BirthdayGachaModel.js](scsfp/js/model/gacha/BirthdayGachaModel.js)

- **ViewModels** ([js/viewmodel/gacha/](scsfp/js/viewmodel/gacha/)): 비즈니스 로직, DP 계산
  - 모두 [BaseGachaViewModel.js](scsfp/js/viewmodel/gacha/BaseGachaViewModel.js) 상속
  - 저장, 입력 바인딩, 재계산 트리거 처리

- **Views** ([js/view/](scsfp/js/view/)): UI 렌더링 및 Chart.js 연동
  - [GachaResultView.js](scsfp/js/view/gacha/GachaResultView.js)가 모든 가챠 타입의 결과 렌더링

- **Core** ([js/core/](scsfp/js/core/)): 공유 알고리즘
  - [ProbabilityEngine.js](scsfp/js/core/ProbabilityEngine.js): DP 상태 전이, 컨벌루션
  - [Observable.js](scsfp/js/core/Observable.js): 반응형 데이터 바인딩
  - [GachaConstants.js](scsfp/js/core/GachaConstants.js): 모든 설정 상수 및 가챠 규칙
  - [EfficiencyCalculator.js](scsfp/js/core/EfficiencyCalculator.js): 효율 계산 서비스 클래스

### 진입점

1. [index.html](scsfp/index.html) - 메인 UI (3성/생일/2성 탭)
2. [js/main.js](scsfp/js/main.js) - 앱 초기화, ViewModel 인스턴스 생성

### 핵심 알고리즘

**동적 계획법 상태**: `dp[k]` = 정확히 k개를 수집한 확률

**핵심 연산** ([ProbabilityEngine.js](scsfp/js/core/ProbabilityEngine.js)):
- `runSinglePull(dp, prob)`: 개별 확률로 단일 가챠 수행
- `runGuaranteedPull(dp)`: 천장/확정 메커니즘 (100% 획득)
- `runRandomTicket(dp, poolSize)`: 랜덤 티켓 보상 (각 아이템당 1/poolSize)
- `convolve(dpA, dpB)`: 독립 확률 분포 합성 (2성 그룹 분석용)

**가챠 규칙** ([GachaConstants.js:59-78](scsfp/js/core/GachaConstants.js#L59-L78)):
```javascript
GACHA_RULES = {
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
}
```

## 가챠 타입별 구현

### 3성 가챠 ([Star3GachaViewModel.js](scsfp/js/viewmodel/gacha/Star3GachaViewModel.js))

**기능**:
- 일반 가챠: 개별 픽업 확률
- 스탭업 가챠: 40회 주기, Step4 확률 부스트
- 주회 보상: 랜덤 티켓 (1/N) 또는 셀렉 티켓 (천장)
- 천장: 200회마다 (일반+스탭업 합산)
- CDF 역추적: 목표 확률 달성에 필요한 가챠 횟수 계산

**계산 흐름** (161-243줄):
1. 기본 확률로 일반 가챠 수행
2. 스탭업 가챠 수행, Step4 체크 (i % 40 === 0) 및 주회 보상 적용
3. 천장 티켓 적용 (셀렉 보상 + floor(totalPulls/200))

**주회 보상 시스템** ([Star3GachaViewModel.js:195-207](scsfp/js/viewmodel/gacha/Star3GachaViewModel.js#L195-L207)):
- `loopRewards` 객체가 루프 번호 (1, 2, 3...)를 'random' 또는 'select'에 매핑
- Random: `runRandomTicket(dp, N)` 호출 - 모든 아이템 동일 확률
- Select: 천장 카운터 증가

### 2성 가챠 ([Star2GachaViewModel.js](scsfp/js/viewmodel/gacha/Star2GachaViewModel.js))

**기능**:
- 4개 독립 그룹 (A, B, C, D), 각각 별도 스탭업 풀
- 컨벌루션으로 그룹 결과 합성
- 스탭업 확정: 5회, 15회, 25회...
- 일반 가챠: 10회마다 95% 보정
- 천장: 일반 100회, 스탭업 50회

**그룹 타겟팅** (142-154줄):
- `viewTargetGroup`: 'ALL' 또는 특정 그룹 ('A', 'B', 'C', 'D')
- 미선택 그룹의 targetCount는 0으로 강제
- 모든 타겟이 0이면 전체 수집 모드 (M=N)

### 생일 가챠 ([BirthdayGachaViewModel.js](scsfp/js/viewmodel/gacha/BirthdayGachaViewModel.js))

**기능**:
- 일반 가챠: 1.5% 확률
- 스탭업 가챠: 2.0% 확률, 최대 30회
- 30회째 스탭업: 100% 확정 획득
- 천장: 200회마다 (합산)

## 상태 관리

**Observable 패턴** ([Observable.js](scsfp/js/core/Observable.js)):
- 모든 모델 속성이 Observable 인스턴스
- 변경 시 구독을 통해 `calculate()` 및 `save()` 트리거
- `isInitializing` 플래그로 로드 중 연쇄 재계산 방지

**LocalStorage** ([StorageManager.js](scsfp/js/utils/StorageManager.js)):
- 키: `shani_gacha_3star`, `shani_gacha_2star`, `shani_gacha_birthday`
- 저장: 픽업 수, 확률, 주회 설정, 보상 선택
- 미저장: 뽑기 횟수 (`normalPulls`, `stepPulls`) - 의도된 설계

**입력 바인딩** ([InputBinder.js](scsfp/js/view/component/InputBinder.js)):
- HTML 입력과 Observable 속성 간 양방향 바인딩
- `ProbabilityValidator.clamp()`를 통한 자동 검증
- 타입 변환: 'int' 또는 'float'

## 주요 파일

- [GachaConstants.js](scsfp/js/core/GachaConstants.js): 모든 설정, 입력 정의, 프리셋, 가챠 규칙 (`GACHA_RULES`)
- [ProbabilityEngine.js](scsfp/js/core/ProbabilityEngine.js): DP 알고리즘, 모든 확률 계산에 `ProbabilityValidator` 필수
- [EfficiencyCalculator.js](scsfp/js/core/EfficiencyCalculator.js): 모든 가챠 타입의 효율 계산 서비스
- [ProbabilityValidator.js](scsfp/js/utils/ProbabilityValidator.js): 확률 클램핑, 총 확률 계산 (`getTotalProb`), 누적 분포 보정
- [PROJECT_STATUS.md](scsfp/PROJECT_STATUS.md): 코드베이스 구조, 기술 부채, 알고리즘 설명 상세 분석 (한글)

## Chart.js 연동

**라이브러리 로딩** ([index.html](scsfp/index.html)):
```html
<!-- Chart.js와 ChartDataLabels CDN으로 로드 -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0"></script>
```

**등록** ([main.js:10](scsfp/js/main.js#L10)):
```javascript
Chart.register(ChartDataLabels); // CDN의 전역 변수
```

**차트 렌더링** ([ChartAdapter.js](scsfp/js/utils/ChartAdapter.js)):
- 일관된 스타일링을 위한 Chart.js 래퍼
- `chart.update('none')` 사용으로 기존 차트 재활용 (성능 최적화)

## 공통 패턴

### 새 가챠 타입 추가

1. [GachaConstants.js](scsfp/js/core/GachaConstants.js)에 `CONFIG.NEW_TYPE` 추가
2. [js/model/gacha/](scsfp/js/model/gacha/)에 `NewTypeGachaModel.js` 생성
3. [BaseGachaViewModel](scsfp/js/viewmodel/gacha/BaseGachaViewModel.js) 상속하여 `NewTypeGachaViewModel.js` 생성
4. [GachaResultView.js](scsfp/js/view/gacha/GachaResultView.js)에 렌더링 로직 추가
5. [index.html](scsfp/index.html)에 탭 추가
6. [main.js](scsfp/js/main.js)에 인스턴스 추가

### 확률 계산 안전성

**반드시 ProbabilityValidator 사용**:
```javascript
// 개별 확률을 [0, 1]로 클램핑
const validProb = ProbabilityValidator.clamp(prob);

// M개 아이템에 대한 총 확률 계산
// 엣지 케이스 처리: p × M > 1.0
const p_any = ProbabilityValidator.getTotalProb(p_indiv, M);
```

### ViewModel 라이프사이클

```javascript
constructor() {
  this.isInitializing = true; // 연쇄 업데이트 방지
}

init() {
  // 1. 스토리지에서 로드
  // 2. Observable 변경 구독
  // 3. 입력 바인딩
  this.isInitializing = false;
  this.calculate(); // 초기 계산
}

calculate() {
  // 1. 모델 값 읽기
  // 2. DP 시뮬레이션 수행
  // 3. View를 통해 결과 렌더링
}
```

## 기술 부채

### 해결됨 (2026-01-20)
1. ~~**효율 계산 코드 중복**~~: [EfficiencyCalculator.js](scsfp/js/core/EfficiencyCalculator.js)로 추출
2. ~~**ViewModel에서 DOM 조작**~~: [Star3GachaViewModel.js](scsfp/js/viewmodel/gacha/Star3GachaViewModel.js)에서 제거, InputBinder의 `maxObserver` 사용
3. ~~**마법 숫자**~~: 모든 가챠 규칙이 [GachaConstants.js](scsfp/js/core/GachaConstants.js)의 `GACHA_RULES` 상수 사용
4. ~~**CDF 계산 중복**~~: `_calculateCDFData`를 [EfficiencyCalculator.js](scsfp/js/core/EfficiencyCalculator.js)의 `calculate3StarCDF`로 위임
5. ~~**ViewModel 내 그룹 계산**~~: `_calcGroup` 로직을 [ProbabilityEngine.js](scsfp/js/core/ProbabilityEngine.js)의 `calcStepupGroup`으로 이동
6. ~~**차트 재렌더링**~~: [ChartAdapter.js](scsfp/js/utils/ChartAdapter.js)에서 `chart.update('none')` 사용으로 최적화

### 남은 항목
- 현재 없음 (모든 기술 부채 해결 완료)

## 필수 규칙

1. **모든 확률 계산은 반드시 ProbabilityValidator 사용** - 안전성
2. **`isInitializing = true` 동안 Observable 값 수정 금지** - 연쇄 방지
3. **Chart.js는 CDN의 전역 변수** - import 문 없음
4. **천장 카운트는 `Math.floor()` 사용** - 소수점 천장은 버림
5. **뽑기 횟수는 LocalStorage에 저장 안 함** - 의도된 설계
6. **DP 배열은 0-인덱스** - 수집 개수 표현 (0부터 M개)
7. **GACHA_RULES 상수 사용** - 하드코딩된 마법 숫자 (40, 200, 50 등) 대신
8. **EfficiencyCalculator 사용** - ViewModel에 효율 계산 로직 중복 대신

## 최근 업데이트 (2026-01-20)

### 코드 품질 개선 (Phase 1 완료)
- **마법 숫자 상수화**: 모든 가챠 규칙이 `GACHA_RULES` 객체 사용
- **DOM 조작 제거**: ViewModel에서 DOM 요소 직접 접근 제거
- **Chart.js import 명시화**: CDN 기반 전역 변수 설명 주석 추가

### 서비스 클래스 분리 (Phase 3.1 완료)
- **EfficiencyCalculator**: [js/core/EfficiencyCalculator.js](scsfp/js/core/EfficiencyCalculator.js) 신규 서비스 클래스
  - `calculate3Star(params)`: 3성 가챠 효율 계산
  - `calculate2Star(params)`: 2성 가챠 효율 계산
  - `calculateBirthday(params)`: 생일 가챠 효율 계산
  - 3개 ViewModel에서 ~135줄 중복 코드 제거

### 기능 추가 (2026-01-19)
- **CDF 역추적**: 3성 가챠에 목표 확률 달성 필요 횟수 계산 서브탭 추가

## 개선 로드맵

### Phase 1: 안정성 ✅ 완료
- [x] 마법 숫자 상수화 (`GACHA_RULES`)
  - `setupDataDependencies()`에서 `document.getElementById('targetCount')` 제거
  - InputBinder의 `maxObserver` 옵션으로 대체
- [x] DOM 조작 제거
  - CDN 로드 방식에 대한 주석 추가
- [x] Chart.js import 명시화
  - `GACHA_RULES` 상수 객체 추가 (STAR3, STAR2, BIRTHDAY)
  - 모든 ViewModel에서 하드코딩된 숫자를 상수로 교체

### Phase 2: 성능 ✅ 완료
- [x] Chart.js 재렌더링 최적화 (`destroy/recreate` 대신 `update()` 사용)

### Phase 3: 확장성 ✅ 완료
- [x] EfficiencyCalculator 서비스 클래스 분리
  - [EfficiencyCalculator.js](scsfp/js/core/EfficiencyCalculator.js) 생성
  - `calculate3Star()`, `calculate2Star()`, `calculateBirthday()`, `calculate3StarCDF()` 메서드
  - 3개 ViewModel의 `_calculateEfficiencyData()` 및 `_calculateCDFData()` 메서드 간소화
- [x] ProbabilityEngine에 `calcStepupGroup()` 메서드 추가
  - Star2GachaViewModel의 `_calcGroup` 로직 중앙화

### 미래 검토 사항
- [ ] ProbabilityEngine 단위 테스트 작성 (빌드 시스템 도입 시 검토)

## HTML/CSS 기술 부채

### ID 네이밍 불일치
| 요소 | 3성 | 생일 | 2성 | 문제 |
|------|-----|------|-----|------|
| 리셋 버튼 | `resetBtn3` | `resetBtnBirthday` | `resetBtn2` | 숫자 vs 문자열 혼용 |
| 천장 토글 | `toggleCeilingBtn3` | `toggleCeilingBtnBirthday` | `toggleCeilingBtn2` | 동일 |
| 뷰 토글 | `toggleViewBtn3` | `toggleViewBtnBirthday` | `toggleViewBtn2` | 동일 |
| 효율 토글 | `btnEfficiencyToggle3` | `btnEfficiencyToggleBirthday` | `btnEfficiencyToggle2` | 동일 |
| 수집 차트 | `resultChart` | `resultChartBirthday` | `resultChart2` | 3성만 접미사 없음 |
| 서브탭 ID | `res-3s-*` | `res-bd-*` | `res-2s-*` | 접두사 불일치 |

**권장**: 통일된 규칙 적용 (예: `star3-*`, `birthday-*`, `star2-*`)

### Div Depth 과다
```
container (1) → main-tab-system (2) → tab-content-wrapper (3) → tab-3star (4)
→ sub-tab-container (5) → tab-content-wrapper (6) → res-3s-collection (7)
→ result-area (8) → chart-row (9) → chart-container (10) → canvas (11)
```
- **최대 11단계** - 목표 7단계 이하로 축소
- `tab-content-wrapper` 클래스명이 메인/서브 탭에서 중복 사용
- `result-area > chart-row > chart-container` 3단계가 단순 레이아웃에 과함

### 인라인 스타일 남용
```html
<div class="chart-container" style="width: 100%; flex: none;">  <!-- 3곳 반복 -->
<div style="display: grid; grid-template-columns: 1fr 1fr; ...">
```
**권장**: CSS 클래스로 분리

### CSS 문제점
1. **중복 규칙**: `.view-toggle-btn[data-state="worst"]` 2회 선언 (302줄, 325줄)
2. **!important 남용**: 4곳 - specificity 개선으로 제거 필요
3. **미사용 클래스**: `.cdf-input-section` (HTML에서 미사용)
4. **유사 색상 반복**: `#f0f4f8`, `#fafafa`, `#f8f9fa` 등 변수화 필요

### 기타
- 프리셋 없는 탭에서 정렬용 빈 `<div></div>` 사용 → flexbox로 대체 가능
