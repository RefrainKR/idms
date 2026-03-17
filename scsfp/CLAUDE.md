# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소의 코드를 다룰 때 참고하는 가이드입니다.

## 프로젝트 개요

**샤니송 유틸리티** - THE IDOLM@STER Shiny Colors Song for Prism을 위한 종합 도구 모음. 가챠 확률 계산기와 과금 효율 분석 기능을 제공합니다.

- **가챠 확률 계산기**: 동적 계획법(DP)과 쿠폰 컬렉터 알고리즘을 활용하여 3성/2성/생일/콜라보 가챠 시스템의 수집 확률을 시뮬레이션
- **과금 효율 분석**: 플랫폼별(ASOBI/Android/iOS) 패키지 비교, 효율 계산, 기준 패키지 선택 및 효율 배수 표시
- **SPA 아키텍처**: 사이드바 네비게이션을 통한 섹션 전환(가챠 ↔ 과금) 및 히스토리 관리 지원

**현재 버전**: v1.10.0.1 (2026-03-17)

**문서 참조**:
- **버전 히스토리**: [docs/UPDATE.md](docs/UPDATE.md)
- **게임 시스템 사양**: [docs/GAME_RULES.md](docs/GAME_RULES.md)
- **리팩토링 관리**: [REFACTORING.md](REFACTORING.md)
- **프로젝트 현황**: 이 파일(CLAUDE.md) 자체에 아키텍처, 알고리즘, 설계 철학 등 모든 상세 내용 포함

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

- **Models** ([js/model/gacha/](scsfp/js/model/gacha/)): Observable 기반 상태 컨테이너
  - [Star3GachaModel.js](scsfp/js/model/gacha/Star3GachaModel.js), [Star2GachaModel.js](scsfp/js/model/gacha/Star2GachaModel.js), [BirthdayGachaModel.js](scsfp/js/model/gacha/BirthdayGachaModel.js), [CollabGachaModel.js](scsfp/js/model/gacha/CollabGachaModel.js)
  - 도메인 엔티티의 데이터 구조 정의

- **ViewModels** ([js/viewmodel/gacha/](scsfp/js/viewmodel/gacha/)): 프레젠테이션 로직
  - 모두 [BaseGachaViewModel.js](scsfp/js/viewmodel/gacha/BaseGachaViewModel.js) 상속
  - 모델과 뷰를 연결, 사용자 상호작용 처리, core 서비스 오케스트레이션

- **Views** ([js/view/](scsfp/js/view/)): UI 렌더링
  - [GachaResultView.js](scsfp/js/view/gacha/GachaResultView.js): 가챠 결과 렌더링 (수집/총획득/효율 탭)
  - [RainbowTabView.js](scsfp/js/view/gacha/RainbowTabView.js): 무돌(虹の結晶) 탭 렌더링
  - DOM 조작 및 Chart.js 통합

- **Component** ([js/component/](scsfp/js/component/)): UI 컴포넌트
  - [SectionManager.js](scsfp/js/component/SectionManager.js): SPA 섹션 전환 및 히스토리 관리
  - [TabManager.js](scsfp/js/component/TabManager.js): 탭 네비게이션 관리
  - [InputBinder.js](scsfp/js/component/InputBinder.js): HTML input ↔ Observable 양방향 바인딩
  - [ToggleButton.js](scsfp/js/component/ToggleButton.js): 다중 상태 토글 버튼
  - [CollapsibleSection.js](scsfp/js/component/CollapsibleSection.js): 접힘/펼침 섹션

- **Core** ([js/core/](scsfp/js/core/)): 앱 특화 도메인 로직
  - [ProbabilityEngine.js](scsfp/js/core/ProbabilityEngine.js): DP 상태 전이, 컨벌루션
  - [Constants.js](scsfp/js/core/Constants.js): 불변 상수 (게임 규칙, 수학 상수, 앱 버전)
  - [EfficiencyCalculator.js](scsfp/js/core/EfficiencyCalculator.js): 효율 계산 서비스 클래스
  - [SharedSettings.js](scsfp/js/core/SharedSettings.js): 가챠 간 공유 설정 관리 (싱글톤)

- **Config** ([js/config/](scsfp/js/config/)): 변경 가능한 설정값
  - [GachaConfig.js](scsfp/js/config/GachaConfig.js): 가챠 입력 설정, 프리셋, 의존성
  - [PaymentConfig.js](scsfp/js/config/PaymentConfig.js): 플랫폼별 패키지 데이터
  - [UIConfig.js](scsfp/js/config/UIConfig.js): UI 포맷, 차트 스타일, Observable 기본값

- **Utils** ([js/utils/](scsfp/js/utils/)): 프로젝트 간 재사용 가능한 범용 컴포넌트
  - [Observable.js](scsfp/js/utils/Observable.js): 반응형 데이터 바인딩 패턴
  - [ProbabilityValidator.js](scsfp/js/utils/ProbabilityValidator.js): 확률 검증 및 클램핑
  - [ChartAdapter.js](scsfp/js/utils/ChartAdapter.js): Chart.js 래퍼
  - 도메인 특화 임포트 없이 독립적으로 동작

### 폴더 구조 기준

각 폴더는 명확한 책임과 재사용성 기준을 따릅니다:

#### `utils/` - 프로젝트 간 재사용 가능
```
✅ 범용 유틸리티 (Observable, 검증기, 포매터)
✅ 도메인 특화 임포트 없음
✅ 독립 npm 패키지로 배포 가능
✅ 다른 프로젝트에서도 그대로 사용 가능
```

#### `core/` - 앱 특화 도메인 로직
```
✅ 비즈니스 규칙 및 계산 (가챠 시스템 전용)
✅ 도메인 특화 서비스 및 엔진
✅ 설정 및 상수 (GACHA_RULES 등)
✅ "데이터를 어떻게 처리하는가" 표현
```

#### `model/` - 도메인 엔티티
```
✅ 상태 컨테이너 (Observable 기반)
✅ 데이터 구조 정의 및 직렬화 (toJSON/fromJSON)
✅ "어떤 데이터가 존재하는가" 표현
✅ 비즈니스 로직 없이 순수 데이터 저장
```

#### `viewmodel/` - 프레젠테이션 로직
```
✅ 모델과 뷰 연결
✅ 사용자 입력 처리 및 검증
✅ core 서비스 호출 및 결과 조합
```

#### `view/` - UI 렌더링
```
✅ DOM 조작 및 이벤트 바인딩
✅ Chart.js 등 UI 라이브러리 통합
✅ 시각적 표현만 담당
```

### 진입점

1. [index.html](scsfp/index.html) - 메인 UI (3성/생일/2성 탭)
2. [js/main.js](scsfp/js/main.js) - 앱 초기화, ViewModel 인스턴스 생성

### ViewModel 생명주기 관리

#### 현재 전략: Persistent ViewModels

모든 ViewModel은 앱 시작 시 1회 생성되며, 섹션 전환 시에도 유지됩니다.

```javascript
// main.js - 앱 시작 시 모든 ViewModel 생성
const star3VM = new Star3GachaViewModel(star3Model, star3View);
const star2VM = new Star2GachaViewModel(star2Model, star2View);
const bdVM = new BirthdayGachaViewModel(bdModel, bdView);
const collabVM = new CollabGachaViewModel(collabModel, collabView);
const paymentVM = new PaymentViewModel();

// SectionManager: CSS로만 섹션 숨김/표시
// ViewModel은 파괴하지 않고 계속 유지
```

**장점**:
- ✅ 사용자 입력 데이터 유지 (섹션 전환 후 돌아와도 입력값 보존)
- ✅ 섹션 전환 속도 빠름 (재생성 오버헤드 없음)
- ✅ 메모리 사용량 예측 가능 (~5MB)

#### destroy() 메서드

모든 ViewModel에 `destroy()` 메서드가 구현되어 있습니다.

```javascript
class BaseGachaViewModel {
    constructor() {
        this._subscriptions = [];    // Observable 구독
        this._inputBinders = [];      // InputBinder 인스턴스
    }

    destroy() {
        // Observable 구독 해제
        this._subscriptions.forEach(unsub => unsub());
        this._subscriptions = [];

        // InputBinder 해제
        this._inputBinders.forEach(binder => binder.destroy());
        this._inputBinders = [];
    }
}
```

**현재 상태**:
- ✅ 모든 ViewModel에 구현 완료
- ❌ **실제로 호출하지 않음** (브라우저가 페이지 종료 시 자동으로 메모리 정리)
- 📝 향후 필요 시 활성화 예정

#### destroy() 호출이 필요한 시점 (향후 고려사항)

**필요 없는 경우** (현재 상태):
- 섹션 5개 이하
- ViewModel당 메모리 < 1MB
- 사용자가 섹션 간 자주 이동
- 입력값 보존이 중요한 UX

**고려가 필요한 경우**:
- 섹션 10개 이상으로 확장
- 각 섹션이 Chart.js 인스턴스 10개 이상 사용
- 모바일 환경 지원 (메모리 제한)
- 장시간 사용 시 성능 저하 리포트 발생

**필수인 경우**:
- 동영상/3D 렌더링 섹션 추가
- WebWorker 사용
- IndexedDB 연결 관리
- WebSocket 연결 관리

#### InputBinder 설계

[InputBinder.js](scsfp/js/view/component/InputBinder.js)는 Instance 기반 클래스로 설계되어 있습니다.

```javascript
// ViewModel에서 사용
class BaseGachaViewModel {
    bindInputs() {
        const el = document.getElementById('someInput');
        const binder = new InputBinder(el, observable, options);
        this._inputBinders.push(binder); // 인스턴스 저장
    }

    destroy() {
        // InputBinder가 자체적으로 리소스 정리
        this._inputBinders.forEach(binder => binder.destroy());
    }
}
```

**설계 이유**:
- ✅ 책임의 명확한 분리 (InputBinder가 자신의 생명주기 관리)
- ✅ 메모리 누수 방지 (Observable 구독 + DOM 이벤트 리스너 모두 정리)
- ✅ 디버깅 용이 (인스턴스 추적 가능)

### 핵심 알고리즘

**동적 계획법 상태**: `dp[k]` = 정확히 k개를 수집한 확률

**핵심 연산** ([ProbabilityEngine.js](scsfp/js/core/ProbabilityEngine.js)):
- `runSinglePull(dp, prob)`: 개별 확률로 단일 가챠 수행
- `runGuaranteedPull(dp)`: 천장/확정 메커니즘 (100% 획득)
- `runRandomTicket(dp, poolSize)`: 랜덤 티켓 보상 (각 아이템당 1/poolSize)
- `convolve(dpA, dpB)`: 독립 확률 분포 합성 (2성 그룹 분석용)

**가챠 규칙** ([Constants.js](scsfp/js/core/Constants.js)):
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
  },
  COLLAB: {
    STEPUP_LIMIT: 9999,         // 사실상 무제한
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

### 콜라보 가챠 ([CollabGachaViewModel.js](scsfp/js/viewmodel/gacha/CollabGachaViewModel.js))

**기능**:
- 생일 가챠와 유사하지만 스탭업 횟수 제한 없음 (9999회)
- Step3 확정 기능 없음 (확률만 증가)
- 프리셋 지원 (본가 2탄 등)
- 일반 확률: 0.75% (본가 기준)
- 스탭업 확률: 1.0% (본가 기준)

## 상태 관리

**Observable 패턴** ([Observable.js](scsfp/js/core/Observable.js)):
- 모든 모델 속성이 Observable 인스턴스
- 변경 시 구독을 통해 `calculate()` 및 `save()` 트리거
- `isInitializing` 플래그로 로드 중 연쇄 재계산 방지

**LocalStorage** ([StorageManager.js](scsfp/js/utils/StorageManager.js)):
- 가챠: `shani_gacha_3star`, `shani_gacha_2star`, `shani_gacha_birthday`, `shani_gacha_collab`
- 과금: `shani_payment_config`
- 저장 내용:
  - 가챠: 픽업 수, 확률, 주회 설정, 보상 선택 (뽑기 횟수 제외 - 의도된 설계)
  - 과금: 환율, 할인율, 기준 패키지

**입력 바인딩** ([InputBinder.js](scsfp/js/view/component/InputBinder.js)):
- HTML 입력과 Observable 속성 간 양방향 바인딩
- `ProbabilityValidator.clamp()`를 통한 자동 검증
- 타입 변환: 'int' 또는 'float'

## 과금 효율 분석 시스템 (v1.9.2~1.9.3)

### 주요 기능

**1. 플랫폼별 패키지 비교**
- ASOBI/Android/iOS 3개 플랫폼 통합 비교
- 카테고리: 상시/월 주기/한정
- 통화 자동 변환 (엔화 ↔ 원화)
- 할인 적용 (ASOBI/Android: 엔화%, iOS: 원화% + 상한)

**2. 뷰 모드**
- **All 모드**: 가격, 유료돌, 기타, 효율, 효율배수 전체 표시
- **Simple 모드**: 기타, ¥/돌, 효율(x배) 3개 열만 표시

**3. 기준 패키지 선택**
- 패키지 클릭 시 기준 패키지로 설정
- 초기 기준: ASOBI F팩
- 효율 배수 계산: 항상 돌/100엔 기준
- 기준 패키지는 1.000배로 표시

**4. 시각 효과**
- Hover: 플랫폼별 5개(Simple: 3개) 셀 동시 강조
- Selected: 외곽선으로 그룹화 (내부 border 유지)

**5. 무돌(Rainbow Crystal) 가치 분석**
- 동일 패키지의 플랫폼 간 가격 차이(ASOBI vs iOS)를 이용해 무돌 1개의 내재 가치 역산
- 정규화된 유료돌 차이를 기반으로 순수 무돌 가격 추출
- 권장 구매처(ASOBI/복합적) 자동 판별

### 아키텍처

**Model** ([PaymentModel.js](scsfp/js/model/payment/PaymentModel.js)):
```javascript
- exchangeRate: Observable(950)           // 100엔당 원화
- jpyDiscountRate: Observable(0)          // 엔화 할인율 (%)
- krwDiscountRate: Observable(0)          // 원화 할인율 (%)
- baselinePackage: Observable({...})      // 기준 패키지
```

**View** ([PaymentView.js](scsfp/js/view/payment/PaymentView.js)):
- 단일 통합 테이블 렌더링 (카테고리 구분 행)
- 뷰 모드에 따른 colspan 동적 조정
- 소수점 3자리 표시 (효율, 효율배수)
- `renderRainbowCrystalAnalysis()`: 무돌 가치 역산 테이블 렌더링

**ViewModel** ([PaymentViewModel.js](scsfp/js/viewmodel/payment/PaymentViewModel.js)):
- 뷰 모드/통화/효율 토글 바인딩
- 패키지 클릭/Hover 이벤트 (이벤트 위임)
- 스크롤 위치 저장/복원

**Constants** ([PaymentConstants.js](scsfp/js/core/PaymentConstants.js)):
- 플랫폼별 패키지 데이터 (ASOBI, ANDROID, IOS)
- 카테고리: NORMAL, MONTHLY, LIMITED

### 설계 철학

**플랫폼 간 가격 차이 기반 분석**:
- ❌ 사용자가 무돌/OurSTREAM 가치를 임의 설정
- ✅ 플랫폼 간 가격 차이로 자동 계산
- **이유**: 특정 패키지를 살 때 어느 플랫폼이 유리한지 비교하는 것이 실용적

**예시**:
- ASOBI D팩: ¥3,200, 유료돌 2,700개, 무돌 15개
- iOS D팩: ₩29,000, 유료돌 2,570개, 무돌 0개
- 가격 차이 = 무돌 15개의 가치로 해석 가능

## Constants vs Config 설계 철학 (v1.9.5)

**원칙**: 하드코딩을 최대한 자제하고, 변경 가능한 설정은 Config 파일로 분리하여 유연하게 구성

### js/core/Constants.js (불변 상수)
절대 변경되지 않는 값들만 포함:
- `APP_VERSION`: 앱 버전 관리
- `GACHA_RULES`: 게임 시스템 규칙 (Step 주기, 천장, 확정 시스템)
- `PROBABILITY_MODE`: 확률 표시 모드 (개별/누적)
- `MATH_CONSTANTS`: 수학 상수 (EPSILON, PERCENTAGE_MULTIPLIER)
- ~~`FORMATTING_RULES`~~: v1.9.5에서 제거됨 → `UIConfig.js`의 `FORMAT` 사용

**사용 예시**:
```javascript
import { GACHA_RULES, MATH_CONSTANTS } from '../core/Constants.js';

// 하드코딩 금지
model.stepMax.value = value * 40; // ❌

// Constants 사용
model.stepMax.value = value * GACHA_RULES.STAR3.STEPUP_CYCLE; // ✅
```

### js/config/GachaConfig.js (가챠 설정)
사용자가 변경 가능한 가챠 설정:
- `INPUTS`: 입력 필드 설정 (min, max, step, 기본값, 레이블)
- `PRESETS`: 가챠 타입별 프리셋 (본가 2탄, 생일 등)
- `DEPENDENCIES`: 입력 간 의존성 처리
- `TOGGLE_STATES`: UI 토글 상태 관리

**특징**:
- `GACHA_RULES`와 `PROBABILITY_MODE`을 Constants.js에서 re-export
- 설정 변경 시 UI에 즉시 반영
- InputBinder가 이 설정을 참조하여 입력 범위 제한

### js/config/PaymentConfig.js (과금 설정)
플랫폼별 패키지 데이터:
- `PACKAGES`: ASOBI/ANDROID/iOS 패키지 정보
- `PAYMENT_CONFIG`: 입력 필드 설정 (환율, 할인율)

### js/config/UIConfig.js (UI 설정)
UI 표시 및 차트 스타일:
- `FORMAT`: 소수점 자릿수 규칙 (단일 정의, Constants.js에서 제거됨)
- `CHART`: 차트 패딩, 폰트 크기, 투명도, 라인 스타일
- `CHART_POINT`: 포인트 반지름, 강조 간격
- `CHART_RANGE`: 차트 X축 제한, 최대 가챠 횟수
- `OBSERVABLE_DEFAULTS`: Model 초기값 (가챠/과금 모든 타입)

**하드코딩 제거 예시**:
```javascript
// 하드코딩 (❌)
const data = RainbowCrystalCalculator.star3Cumulative(200);
pointRadius: idx === 0 ? 4 : (idx % 40 === 0 ? 3 : 1)

// UIConfig 사용 (✅)
import { CHART_RANGE, CHART_POINT } from '../../config/UIConfig.js';
const data = RainbowCrystalCalculator.star3Cumulative(CHART_RANGE.RAINBOW_MAX_PULLS);
pointRadius: idx === 0 ? CHART_POINT.RADIUS.ORIGIN :
             (idx % CHART_POINT.EMPHASIS_INTERVAL.STAR3_CYCLE === 0
              ? CHART_POINT.RADIUS.CEILING_EMPHASIS
              : CHART_POINT.RADIUS.DEFAULT)
```

### Observable과 InputBinder의 역할 분리

**Observable** (Model 계층):
- 반응형 데이터 상태 관리
- 값 변경 시 구독자에게 알림
- Model의 모든 속성은 Observable 인스턴스

**InputBinder** (View 계층):
- HTML input ↔ Observable 양방향 동기화
- 입력 검증 (ProbabilityValidator 사용)
- 타입 변환 (int/float)
- Config의 min/max/step 적용

**둘 다 필수인 이유**:
- Observable만: View 동기화 불가, 수동 DOM 조작 필요
- InputBinder만: 상태 변경 알림 불가, 의존성 체인 처리 불가
- 둘 다: MVVM 패턴 완성, 책임 분리, 재사용성 향상

## 주요 파일

**Constants & Config**:
- [Constants.js](scsfp/js/core/Constants.js): 불변 상수 (게임 규칙, 수학 상수, **APP_VERSION**)
- [GachaConfig.js](scsfp/js/config/GachaConfig.js): 가챠 입력 설정, 프리셋, 의존성
- [PaymentConfig.js](scsfp/js/config/PaymentConfig.js): 플랫폼별 패키지 데이터
- [UIConfig.js](scsfp/js/config/UIConfig.js): UI 포맷, 차트 스타일, Observable 기본값

**가챠 시스템**:
- [ProbabilityEngine.js](scsfp/js/core/ProbabilityEngine.js): DP 알고리즘, `ProbabilityValidator` 필수
- [EfficiencyCalculator.js](scsfp/js/core/EfficiencyCalculator.js): 가챠 효율 계산 서비스
- [ProbabilityValidator.js](scsfp/js/utils/ProbabilityValidator.js): 확률 검증 및 클램핑

**과금 시스템**:
- [PaymentModel.js](scsfp/js/model/payment/PaymentModel.js): 환율, 할인, 기준 패키지
- [PaymentView.js](scsfp/js/view/payment/PaymentView.js): 테이블 렌더링
- [PaymentViewModel.js](scsfp/js/viewmodel/payment/PaymentViewModel.js): 프레젠테이션 로직

**문서**:
- [docs/UPDATE.md](docs/UPDATE.md): 버전 히스토리
- [docs/GAME_RULES.md](docs/GAME_RULES.md): 게임 기본 정보 및 시스템 사양
- [REFACTORING.md](REFACTORING.md): 리팩토링 필요 항목 관리

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

1. [Constants.js](scsfp/js/core/Constants.js)에 `GACHA_RULES.NEW_TYPE` 추가 (천장, 확정 규칙)
2. [GachaConfig.js](scsfp/js/config/GachaConfig.js)에 `CONFIG.NEW_TYPE` 추가 (입력 설정, 프리셋)
3. [UIConfig.js](scsfp/js/config/UIConfig.js)에 `OBSERVABLE_DEFAULTS.NEW_TYPE` 추가 (초기값)
4. [js/model/gacha/](scsfp/js/model/gacha/)에 `NewTypeGachaModel.js` 생성
5. [BaseGachaViewModel](scsfp/js/viewmodel/gacha/BaseGachaViewModel.js) 상속하여 `NewTypeGachaViewModel.js` 생성
6. [GachaResultView.js](scsfp/js/view/gacha/GachaResultView.js)에 렌더링 로직 추가
7. [index.html](scsfp/index.html)에 탭 추가
8. [main.js](scsfp/js/main.js)에 인스턴스 추가

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

## 버전 관리

**현재 버전**: v1.10.0.1 (2026-03-17)

**버전 관리 위치**:
1. `Constants.js` - `APP_VERSION` 상수 (런타임 버전 체크)
2. `index.html` - CSS/JS 캐시 버스팅 (`?v=1.9.5`)
3. `docs/UPDATE.md` - 버전 히스토리 문서화
4. `CLAUDE.md` - 현재 버전 명시

**버전 업데이트 체크리스트**:
- [ ] `Constants.js`: `APP_VERSION` 수정
- [ ] `index.html`: CSS/JS 버전 태그 수정 (총 4곳)
- [ ] `docs/UPDATE.md`: 새 버전 섹션 추가
- [ ] `CLAUDE.md`: 현재 버전 업데이트

**캐시 버스팅**:
```html
<link rel="stylesheet" href="css/common.css?v=1.9.5">
<link rel="stylesheet" href="css/gacha.css?v=1.9.5">
<link rel="stylesheet" href="css/payment.css?v=1.9.5">
<script type="module" src="js/main.js?v=1.9.5"></script>
```

**버전 마이그레이션**:
- `StorageManager.js`가 `APP_VERSION` 체크
- 버전 변경 시 `VERSION_CONFIG`에 따라 자동 마이그레이션
- 사용자 데이터 보존하면서 설정 업데이트

## Git 커밋 금지

**Claude Code는 git 커밋을 절대 생성하지 않는다.**

- 사용자가 버전 관리 브랜치(`1.9.x`등)와 `main` 브랜치 간 커밋을 수동으로 직접 관리함
- 커밋 메시지 제안, 커밋 실행, PR 생성 등 모든 git 커밋 관련 작업 금지
- 파일 수정 후 "커밋할까요?" 같은 질문도 하지 말 것
- 버전 체크리스트 안내 시에도 실제 커밋 동작은 수행하지 않음

---

## 필수 규칙

**가챠 시스템**:
1. **모든 확률 계산은 반드시 ProbabilityValidator 사용** - 안전성
2. **`isInitializing = true` 동안 Observable 값 수정 금지** - 연쇄 방지
3. **Chart.js는 CDN의 전역 변수** - import 문 없음
4. **천장 카운트는 `Math.floor()` 사용** - 소수점 천장은 버림
5. **뽑기 횟수는 LocalStorage에 저장 안 함** - 의도된 설계
6. **DP 배열은 0-인덱스** - 수집 개수 표현 (0부터 M개)
7. **GACHA_RULES 상수 사용** - 하드코딩된 마법 숫자 (40, 200, 50 등) 대신
8. **EfficiencyCalculator 사용** - ViewModel에 효율 계산 로직 중복 대신

**과금 시스템**:
1. **효율 계산 정확도**: 반올림 전 원본 값 사용, 표시 시점에만 `.toFixed(3)`
2. **효율 배수**: 항상 돌/100엔 기준으로 계산
3. **플랫폼 간 가격 차이 기반 분석**: 재화 가치 임의 설정 금지

**공통**:
1. **하드코딩 금지** - 숫자, 문자열 리터럴 대신 Constants/Config 사용
   - ❌ `value * 40`, `pulls < 200`, `epsilon = 1e-9`
   - ✅ `value * GACHA_RULES.STAR3.STEPUP_CYCLE`, `pulls < GACHA_RULES.STAR3.CEILING_INTERVAL`, `MATH_CONSTANTS.EPSILON`
   - 예외: 0, 1, 100 등 수학적 의미가 명확한 값

2. **Config 기반 초기화** - Model 기본값과 InputBinder 범위는 Config에서 일괄 관리
   - Model: `OBSERVABLE_DEFAULTS`에서 초기값 로드
   - InputBinder: `CONFIG.INPUTS`에서 min/max/step 로드
   - 장점: 설정 변경 시 한 곳만 수정, 일관성 유지

3. **HTML input 요소는 최소한의 속성만** - `type`과 `id`만 지정, `min`/`max`/`value`/`step` 등은 Config로 관리
   ```html
   <!-- ✅ 올바른 예 -->
   <input type="number" id="pickupCount">

   <!-- ❌ 잘못된 예 -->
   <input type="number" id="pickupCount" min="1" max="10" value="3" step="1">
   ```
   - 이유: Config가 단일 진실 공급원(Single Source of Truth), HTML 속성과 Config 값 불일치 방지
   - 기본값: `OBSERVABLE_DEFAULTS`에서 설정
   - 범위 제한: `CONFIG.INPUTS`에서 설정

## CSS 애니메이션 최소화 원칙

**목표**: UI 반응 속도 최적화를 위해 **모든** CSS transition/animation 제거

### 기본 원칙

1. **transition 속성 완전 금지**
   - 버튼, 입력 요소, 테이블 행 등 모든 인터랙티브 요소에서 transition 제거
   - 사용자 입력에 대한 즉각적인 시각 피드백 제공
   - **예외 없음**: 탭 전환 포함 모든 애니메이션 제거

2. **animation 속성 완전 금지**
   - `@keyframes` 선언 모두 제거
   - `animation` 속성 사용 금지
   - 탭 콘텐츠 전환도 애니메이션 없이 즉시 표시

3. **금지되는 패턴**
   ```css
   /* ❌ 버튼 transition */
   .btn {
       transition: all 0.2s;
   }

   /* ❌ 입력 요소 transition */
   input {
       transition: border-color 0.3s;
   }

   /* ❌ Hover transition */
   .sidebar-item {
       transition: background 0.2s ease;
   }

   /* ❌ 테이블 행 transition */
   .data-table tbody tr {
       transition: background 0.2s;
   }

   /* ❌ 탭 콘텐츠 애니메이션 */
   .tab-content {
       animation: fadeIn 0.3s ease-in-out;
   }
   ```

4. **Hover 효과 구현**
   - transition 없이 즉시 변경되는 hover 스타일 사용
   ```css
   /* ✅ 올바른 hover 구현 */
   .btn:hover {
       background: var(--primary-dark);
   }

   /* ❌ 잘못된 hover 구현 */
   .btn {
       transition: background 0.2s;
   }
   .btn:hover {
       background: var(--primary-dark);
   }
   ```

### 설계 철학

**빠른 피드백 = 최우선**
- 사용자가 버튼을 클릭하면 즉시 반응해야 함
- 0.2초의 transition도 체감 지연으로 느껴질 수 있음
- 0.3초의 fadeIn 애니메이션은 탭 전환을 느리게 만드는 주 원인
- **예외 없음**: 모든 transition/animation 제거

**성능 고려**:
- transition/animation은 브라우저의 reflow/repaint 트리거
- 대량의 DOM 요소에 transition이 있으면 성능 저하
- 테이블의 모든 행에 transition이 있으면 스크롤 성능 저하
- 애니메이션 제거로 렌더링 성능 향상

## 관련 문서

프로젝트 관련 문서는 `docs/` 폴더와 루트에서 관리됩니다:

- **[docs/UPDATE.md](docs/UPDATE.md)**: 모든 버전 업데이트 내역 (기능 추가, 버그 수정, 개선 사항)
- **[docs/GAME_RULES.md](docs/GAME_RULES.md)**: 게임 기본 정보 및 시스템 사양 (가챠 규칙, 확률 등)
- **[REFACTORING.md](REFACTORING.md)**: 리팩토링 필요 항목 관리 (리팩토링 완료 후 유저가 직접 비움)
- **CLAUDE.md (이 파일)**: 프로젝트 현황, 아키텍처, 알고리즘, 설계 철학 등 Claude가 항시 참조하는 모든 상세 내용