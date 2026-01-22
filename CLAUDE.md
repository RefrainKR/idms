# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소의 코드를 다룰 때 참고하는 가이드입니다.

## 프로젝트 개요

**샤니송 가챠 확률 시뮬레이터** - THE IDOLM@STER Shiny Colors Song for Prism의 가챠(뽑기) 확률 계산기. 동적 계획법(DP)과 쿠폰 컬렉터 알고리즘을 활용하여 3성/2성/생일 가챠 시스템의 수집 확률을 시뮬레이션합니다.

**버전**: 1.7.2
**언어**: Vanilla JavaScript (ES6 modules)
**기술 스택**: HTML5, CSS3, Chart.js 4.4.1

## 게임 시스템 이해

### 카드 종류
- **프로듀스 카드 (P카드)**: 1성 ~ 3성 등급
- **서포트 카드 (S카드)**: U → UR → SSR 등급
- **리뉴얼 이후**: 가챠에서 P카드와 S카드가 동시 배출
  - 3성 가챠: 픽업 획득 시 P카드(3성) + S카드(SSR) 동시 획득
  - 2성/생일 가챠: S카드 없음 (P카드만 배출)

### 재화 종류
- **무료돌**: 일반 가챠에만 사용 가능
- **유료돌**: 일반 가챠 + 스탭업 가챠 모두 사용 가능

### 가챠 공통 개념
- **픽업**: 해당 가챠의 특정 목표 카드들
  - 3성 가챠: 최고 등급(3성)이 나와도 픽업이 아닐 수 있음 (픽뚫 발생)
  - 2성 가챠: 2성이 나오면 100% 픽업 (픽뚫 없음)
  - 생일 가챠: 픽업 1개 고정
- **천장 (셀렉 티켓)**: 일정 횟수 도달 시 원하는 픽업 카드 선택 가능
- **랜덤 티켓 (픽업 티켓)**: 픽업 중 랜덤으로 1개 획득 (천장의 너프 버전)
- **주(周)**: 스탭업 가챠의 특정 단위 (3성: Step1~4 = 40회)

### 3성 가챠 시스템

#### 일반 가챠
- 확률 조정 없는 기본 가챠
- 픽업 확률: 사용자 설정 (일반적으로 1.0% 내외)

#### 스탭업 가챠 (유료돌 전용)
- **Step 구조**: Step1 ~ Step4, 각 Step은 10회
  - Step1: 기본 확률
  - Step2: 10회째에 3성+SSR 확률 2배 (픽업 확률은 불변)
  - Step3: 1~10회 전부 3성+SSR 확률 2배 (픽업 확률은 불변)
  - Step4: 10회째에 3성(60%) + SSR(40%) 확정, 픽업 확률은 사용자 설정
- **주(周) 개념**: Step1~4 (40회) = 1주
- **횟수 제한**: 최대 주회 수가 정해져 있음 (가챠마다 다름, 사용자 설정)
  - 예: 최대 3주 = 120회까지만 가능
  - UI: "최대 주회(周回) 수" 입력 필드
- **주회 보상**: 각 주 완료 시 보상 1개 (사전 설정)
  - 없음: 보상 없음
  - random: 랜덤 티켓 (픽업 중 랜덤 1개)
  - select: 셀렉 티켓 (원하는 픽업 1개)

#### 천장 시스템
- 일반 + 스탭업 합산 200회마다 천장 1회 (셀렉 티켓)
- 횟수는 가챠 간 공유됨

#### 시뮬레이터 단순화
- Step2/Step3의 확률 증가는 **픽업 확률과 무관**하므로 시뮬레이션에서 무시
- 오직 **픽업 획득 확률**에만 집중

### 2성 가챠 시스템

#### 일반 가챠
- **픽뚫 없음**: 2성이 나오면 100% 픽업
- **확률 계산**: `개별 픽업 확률 = 전체 2성 확률 / 픽업 개수`
- **10회 보정**: 10회째에 2성 확률 95%
- **천장**: 100회마다 1회 (일반 가챠 전용)

#### 스탭업 가챠 (유료돌 전용, 그룹별)
- **그룹 구성**: 보통 4개 그룹 (A, B, C, D)으로 분할
- **확률 계산**: `개별 픽업 확률 = 전체 2성 확률 / 그룹별 픽업 개수`
- **Step 구조**:
  - Step1: 5회 (1번만 가능), 5회째 2성 100% 확정
  - Step2: 10회 (무한 반복), 10회째 2성 100% 확정
- **천장**: 그룹별 합산 50회마다 1회 (스탭업 가챠 전용)
- **독립성**: 일반 가챠와 천장 횟수 공유 안 함

### 생일 가챠 시스템

#### 일반 가챠
- 픽업 1개 고정
- 픽업 확률: 1.5% (고정)
- 천장: 200회마다 1회

#### 스탭업 가챠 (유료돌 전용)
- 픽업 확률: 2.0% (고정, 일반보다 높음)
- **Step 구조**: Step1~3, 각 10회 (총 30회)
  - Step1 (1~10회): 2.0% 확률
  - Step2 (11~20회): 2.0% 확률
  - Step3 (21~30회): 2.0% 확률
  - **30회째**: 픽업 100% 확정
- **횟수 제한**: 30회까지만 가능 (1번 한정)
- **천장**: 일반 가챠와 합산 200회마다 1회

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

## 업데이트 및 리팩토링 문서

프로젝트의 업데이트 히스토리와 향후 리팩토링 기회는 별도 문서로 관리됩니다:

- **[UPDATE.md](UPDATE.md)**: 모든 업데이트 내역 (기능 추가, 버그 수정, 개선 사항)
- **[REFACTORING.md](REFACTORING.md)**: 향후 리팩토링 기회 및 권장사항

### 최근 주요 업데이트 요약

**v1.7.2 (2026-01-21)**: HTML/CSS 리팩토링
- ID 네이밍 통일화 (`{type}-{element}` 패턴)
- Div Depth 축소 (11단계 → 8단계)
- 시멘틱 HTML 적용

**v1.7.1 (2026-01-20)**: 코드 품질 개선
- 마법 숫자 상수화, EfficiencyCalculator 분리
- Chart.js 성능 최적화

**v1.7.0 (2026-01-19)**: CDF 역추적 기능 추가

> 상세 내용은 [UPDATE.md](UPDATE.md) 참조

## 프로젝트 상태

### ✅ 완료된 개선 사항
모든 기술 부채가 해결되었습니다:
- **안정성**: 마법 숫자 상수화, DOM 조작 제거
- **성능**: Chart.js 재렌더링 최적화
- **확장성**: EfficiencyCalculator 분리, ProbabilityEngine 중앙화
- **HTML/CSS**: ID 네이밍 통일화, 시멘틱 HTML, Div Depth 축소

### 📋 향후 리팩토링 기회
추가 리팩토링이 가능한 영역이 15개 식별되었습니다:
- **High Priority** (3개): View/ViewModel 결합도, 메모리 누수 방지, Input 설정 명시화
- **Medium Priority** (3개): Tab 관리 중복, Observable 의존성, 루프 패턴 추상화
- **Low Priority** (9개): Toggle 패턴, 매직 문자열, DOM 헬퍼 등

> 상세 내용은 [REFACTORING.md](REFACTORING.md) 참조

**권장**: 현재 상태 유지 또는 High Priority 항목만 선택적 구현
