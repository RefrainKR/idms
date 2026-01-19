# 샤니송 가챠 확률 시뮬레이터 - 프로젝트 현황 분석

**최종 업데이트**: 2026-01-19
**버전**: 1.7.0
**분석 목적**: Gemini 3.0과의 협업을 위한 코드베이스 전체 맵핑 및 기술부채 식별

## 📋 최근 업데이트 (2026-01-19)
- ✅ **3성 가챠 CDF 역추적 기능 추가**
  - 서브탭 형태로 구현 (`res-3s-cdf`)
  - 목표 확률 입력 필드 (`targetProbability3`, 0~100%, 기본값 90%)
  - 스탭업/일반 가챠 비교 차트 (0~200회)
  - 참조선 및 목표 지점 마커 표시
  - InputBinder 통합 ([GachaConstants.js:12](js/core/GachaConstants.js#L12))

---

## 1. 프로젝트 개요

샤니송(THE IDOLM@STER Shiny Colors Song for Prism) 가챠 시스템의 확률 시뮬레이터.
동적 계획법(DP)과 쿠폰 컬렉터 알고리즘을 활용하여 3성/2성/생일 가챠의 수집 확률 및 효율성을 계산.

### 핵심 기능
- **3성 가챠**: 일반/스탭업 가챠, 주회 보상(랜덤/셀렉 티켓), Step4 확률 부스트, **CDF 역추적 분석**
- **2성 가챠**: 그룹별(A/B/C/D) 스탭업 가챠, 일반 가챠
- **생일 가챠**: 일반(1.5%) + 스탭업(2.0%) + 30회 확정 획득 메커니즘
- **공통 기능**: 천장 시스템(일반 100회/스탭업 50회당), 확률 모드(개별/누적), 효율 비교 차트

---

## 2. 현재 구조 분석

### 2.1 파일 시스템 구조
```
scsfp/
├── index.html                          # 메인 UI (3성/생일/2성 탭)
├── css/style.css                       # 스타일 (버전 1.6.0)
└── js/
    ├── main.js                         # 앱 진입점 (ViewModel 초기화, 탭 연결)
    │
    ├── core/                           # 핵심 로직
    │   ├── Observable.js               # 반응형 데이터 바인딩
    │   ├── ProbabilityEngine.js        # DP 확률 계산 엔진
    │   └── GachaConstants.js           # 설정 상수 (CONFIG, TOGGLE_STATES)
    │
    ├── model/gacha/                    # 데이터 모델
    │   ├── Star3GachaModel.js          # 3성 가챠 상태 (픽업수, 주회, Step4 등)
    │   ├── Star2GachaModel.js          # 2성 가챠 상태 (그룹별 픽업수, 타겟)
    │   └── BirthdayGachaModel.js       # 생일 가챠 상태
    │
    ├── viewmodel/gacha/                # 비즈니스 로직
    │   ├── BaseGachaViewModel.js       # 공통 기능 (저장/로드, 입력 바인딩)
    │   ├── Star3GachaViewModel.js      # 3성 계산 로직 + 효율 비교
    │   ├── Star2GachaViewModel.js      # 2성 계산 + 그룹별 컨벌루션
    │   └── BirthdayGachaViewModel.js   # 생일 가챠 계산
    │
    ├── view/                           # UI 렌더링
    │   ├── ResultView.js               # 추상 부모 클래스 (차트/요약 렌더링)
    │   ├── gacha/GachaResultView.js    # 가챠별 결과 화면 (3성/2성/생일)
    │   └── component/                  # UI 컴포넌트
    │       ├── InputBinder.js          # 입력 필드 양방향 바인딩
    │       ├── ToggleButton.js         # 버튼 토글 (천장/랜덤/확률모드)
    │       ├── TabManager.js           # 탭 전환 관리
    │       └── CollapsibleSection.js   # 섹션 접기/펼치기
    │
    └── utils/                          # 유틸리티
        ├── ProbabilityValidator.js     # 확률 검증 (clamp, 정규화, 오차 보정)
        ├── StorageManager.js           # LocalStorage 저장/로드
        ├── Formatter.js                # 숫자/확률 포맷팅
        ├── ChartAdapter.js             # Chart.js 래퍼
        └── ChartUtils.js               # 차트 스타일링 (포인트 반경, 색상)
```

---

## 3. 가챠별 로직 매핑

### 3.1 3성 가챠 (Star3)
**파일**: [Star3GachaViewModel.js](js/viewmodel/gacha/Star3GachaViewModel.js)

#### 핵심 로직
1. **일반 가챠**
   - 확률: `pickupRate%` (개별 1명)
   - 천장: 200회당 1개 (일반+스탭업 합산)

2. **스탭업 가챠**
   - 40회 주기 루프 (`maxLoops`)
   - Step4 (40회째): `step4Rate%` 확률 부스트
   - 주회 보상 (`loopRewards`):
     - `random`: 랜덤 티켓 (N명 중 1명, `randomMode` 토글)
     - `select`: 셀렉 티켓 (천장 카운트에 포함)

3. **계산 흐름** ([Star3GachaViewModel.js:161-243](js/viewmodel/gacha/Star3GachaViewModel.js#L161-L243))
   ```javascript
   // 1. 일반 가챠 (normalPulls회)
   for (i=0; i<normalPulls; i++) {
       dp = ProbabilityEngine.runSinglePull(dp, p_indiv);
   }

   // 2. 스탭업 가챠 (stepPulls회)
   for (i=1; i<=stepPulls; i++) {
       isStep4 = (i % 40 === 0);
       p = isStep4 ? p_step4_indiv : p_indiv;
       dp = ProbabilityEngine.runSinglePull(dp, p);

       // 주회 보상 처리
       if (isStep4) {
           reward = loopRewards[Math.ceil(i/40)];
           if (reward === 'random') dp = runRandomTicket(dp, N);
           if (reward === 'select') selectCnt++;
       }
   }

   // 3. 천장 (통합 200회당 + 셀렉 보상)
   totalCeil = selectCnt + floor((normalPulls+stepPulls)/200);
   for (i=0; i<totalCeil; i++) {
       dp = ProbabilityEngine.runGuaranteedPull(dp);
   }
   ```

4. **CDF 역추적 분석** ([Star3GachaViewModel.js:288-361](js/viewmodel/gacha/Star3GachaViewModel.js#L288-L361))
   - **목적**: 목표 확률(예: 90%)에 도달하는 데 필요한 가챠 횟수 계산
   - **구현**: 0~200회 범위에서 스탭업/일반 가챠 각각 시뮬레이션
   - **차트**:
     - 스탭업 가챠 곡선 (초록색 실선)
     - 일반 가챠 곡선 (파란색 점선)
     - 목표 지점 마커 (각 곡선에 점 표시)
     - 참조선 (가로: 목표 확률, 세로: 필요 횟수)
   - **입력**: `targetProbability3` (0~100%, 기본값 90%)

   ```javascript
   // 스탭업 가챠 시뮬레이션
   for (pulls = 0; pulls <= 200; pulls++) {
       dpS = 초기화;
       for (i=1; i<=min(pulls, stepupLimit); i++) {
           if (i % 40 === 0 && Step4모드) {
               dpS = runSinglePull(dpS, p_step4);
               // 주회 보상 처리
           } else {
               dpS = runSinglePull(dpS, p_indiv);
           }
       }
       if (pulls > stepupLimit) {
           // 초과분은 일반 가챠로
       }
       cdfDataStepup[pulls] = dpS[M] * 100;
   }
   ```

#### 중복 코드 위험
- `_calculateEfficiencyData`와 `_calculateCDFData`가 거의 동일한 시뮬레이션 로직 반복 ([Star3GachaViewModel.js:247-361](js/viewmodel/gacha/Star3GachaViewModel.js#L247-L361))

---

### 3.2 2성 가챠 (Star2)
**파일**: [Star2GachaViewModel.js](js/viewmodel/gacha/Star2GachaViewModel.js)

#### 핵심 로직
1. **그룹별 독립 계산** (A/B/C/D)
   - 각 그룹별로 DP 계산 후 **컨벌루션** 합성
   - 스탭업 확정 타이밍: 5회, 15회, 25회, ...

2. **계산 흐름** ([Star2GachaViewModel.js:126-214](js/viewmodel/gacha/Star2GachaViewModel.js#L126-L214))
   ```javascript
   // 1. 그룹별 DP 계산
   groups.forEach(g => {
       res = _calcGroup(g.N, g.M, g.pulls, rateTotal);
       dp = ProbabilityEngine.convolve(dp, res.dp);  // 합성
   });

   // 2. 일반 가챠 (10회마다 95% 보정)
   for (i=1; i<=normalPulls; i++) {
       isHigh = (i % 10 === 0);
       p = isHigh ? (0.95/N_total) : (rateTotal/N_total);
       dp = runSinglePull(dp, p);
   }

   // 3. 천장 (일반 100회당 + 스탭업 50회당)
   totalCeil = floor(normalPulls/100) + floor(totalStepPulls/50);
   ```

3. **그룹 타겟팅** ([Star2GachaViewModel.js:142-154](js/viewmodel/gacha/Star2GachaViewModel.js#L142-L154))
   - `viewTargetGroup`: 'ALL' 또는 특정 그룹(A/B/C/D)
   - 선택되지 않은 그룹의 타겟 수를 0으로 강제 설정
   - 모든 타겟이 0이면 전체 수집(M=N) 모드로 동작

#### 문제점
- `_calcGroup` 로직이 ViewModel에 하드코딩됨 ([Star2GachaViewModel.js:103-124](js/viewmodel/gacha/Star2GachaViewModel.js#L103-L124))
- 그룹별 확률 계산 로직이 ProbabilityEngine으로 추상화되지 않음

---

### 3.3 생일 가챠 (Birthday)
**파일**: [BirthdayGachaViewModel.js](js/viewmodel/gacha/BirthdayGachaViewModel.js)

#### 핵심 로직
1. **일반 가챠**: 1.5% 확률
2. **스탭업 가챠**: 2.0% 확률 (최대 30회)
3. **30회 확정**: 스탭업 30회째는 100% 획득

#### 계산 흐름 ([BirthdayGachaViewModel.js:67-112](js/viewmodel/gacha/BirthdayGachaViewModel.js#L67-L112))
```javascript
// 1. 일반 가챠
for (i=0; i<normalPulls; i++) {
    dp = runSinglePull(dp, normalRate);
}

// 2. 스탭업 가챠
for (i=1; i<=stepPulls; i++) {
    if (i === 30) {
        dp = runGuaranteedPull(dp);  // 확정 획득
    } else {
        dp = runSinglePull(dp, stepRate);
    }
}

// 3. 천장 (200회당, 일반+스탭업 합산)
ceilingCount = floor(totalPulls / 200);
```

---

## 4. 기술 부채 및 리스크 분석

### 4.1 중복 코드
| 위치 | 내용 | 영향도 |
|------|------|--------|
| [Star3GachaViewModel.js:245-344](js/viewmodel/gacha/Star3GachaViewModel.js#L245-L344) | `_calculateEfficiencyData`와 `_calculateCDFData`가 동일한 시뮬레이션 로직 반복 | 높음 |
| 각 ViewModel의 `calculate()` | 천장 처리 로직이 3번 중복 | 중간 |
| [GachaResultView.js:68-276](js/view/gacha/GachaResultView.js#L68-L276) | `_generate3StarLogic`, `_generateBirthdayLogic`, `_generate2StarLogic`의 HTML 생성 패턴 유사 | 낮음 |

### 4.2 디자인 패턴 위반
1. **ViewModel에 UI 로직 침투**
   - [Star3GachaViewModel.js:89-97](js/viewmodel/gacha/Star3GachaViewModel.js#L89-L97): DOM 직접 조작 (`targetInput.max`)
   - 권장: Observable을 통한 반응형 바인딩으로 대체

2. **책임 분리 미흡**
   - [Star2GachaViewModel.js:103-124](js/viewmodel/gacha/Star2GachaViewModel.js#L103-L124): `_calcGroup` 로직이 ViewModel에 존재
   - 권장: ProbabilityEngine으로 이동

3. **하드코딩된 마법 숫자**
   - 스탭업 주기: 40회 (3성), 10회 (2성 확정 간격)
   - 천장 주기: 100회, 200회, 50회
   - 권장: GachaConstants.js로 이동

### 4.3 Import 오류 위험
| 파일 | 위험 요소 | 확인 필요 |
|------|-----------|----------|
| [main.js:7](js/main.js#L7) | `Chart.register(ChartDataLabels)` - 전역 변수 의존 | Chart.js CDN 로드 순서 확인 |
| [GachaResultView.js:406](js/view/gacha/GachaResultView.js#L406) | `new Chart(...)` - 전역 Chart 객체 사용 | import 문 누락 (CDN 의존) |
| 모든 ViewModel | `GachaResultView` import 시 순환 참조 가능성 | 현재는 안전하나 확장 시 주의 |

### 4.4 성능 이슈
1. **대규모 DP 배열 연산**
   - 200회 이상 시뮬레이션 시 배열 크기 증가 (O(n²) 복잡도)
   - 해결책: Web Worker 활용 또는 증분 계산 캐싱

2. **차트 재렌더링**
   - 입력값 변경마다 차트 재생성 ([GachaResultView.js:401-404](js/view/gacha/GachaResultView.js#L401-L404))
   - 해결책: `chart.update()` 활용

3. **효율 차트 데이터 생성**
   - 매번 0~200회 전체 시뮬레이션 ([Star3GachaViewModel.js:252-285](js/viewmodel/gacha/Star3GachaViewModel.js#L252-L285))
   - 해결책: 결과 캐싱 또는 점진적 계산

### 4.5 데이터 일관성
1. **저장 제외 필드** ([BaseGachaViewModel.js:74-77](js/viewmodel/gacha/BaseGachaViewModel.js#L74-L77))
   - `normalPulls`, `stepPulls` 등은 저장되지 않음 (의도된 설계)
   - 문제: 사용자가 "왜 횟수가 초기화되지?"라고 혼란 가능

2. **프리셋 적용 시점** ([Star3GachaViewModel.js:142-159](js/viewmodel/gacha/Star3GachaViewModel.js#L142-L159))
   - `applyPreset()` 호출 시 `isInitializing` 체크 누락 가능성
   - 잠재적 버그: 초기화 중 프리셋 적용 시 이벤트 중복 발생

---

## 5. Gemini를 위한 질문 리스트

### 5.1 알고리즘 최적화
1. **쿠폰 컬렉터 가중치 최적화**
   - 현재 구현: 매 뽑기마다 `(M-k) × p_indiv` 계산 ([ProbabilityEngine.js:10-31](js/core/ProbabilityEngine.js#L10-L31))
   - 질문: "확률이 동적으로 변하는 경우 (Step4, 확정 타이밍) 더 효율적인 DP 갱신 방법은?"
   - 예상 답변 방향: 희소 행렬, 상태 압축, FFT 기반 컨벌루션

2. **컨벌루션 성능 개선**
   - 현재 O(n²) naive 컨벌루션 ([ProbabilityEngine.js:98-111](js/core/ProbabilityEngine.js#L98-L111))
   - 질문: "4개 그룹 합성 시 FFT 적용이 유의미한가? 배열 크기 임계값은?"

3. **확률 오차 누적 보정**
   - 현재: 누적 확률 끝값만 1.0 보정 ([ProbabilityValidator.js:66-76](js/utils/ProbabilityValidator.js#L66-L76))
   - 질문: "200회 이상 시뮬레이션에서 부동소수점 오차 누적을 방지하는 베스트 프랙티스는?"

### 5.2 아키텍처 설계
1. **효율 계산 모듈 분리**
   - 현재: 각 ViewModel에 `_calculateEfficiencyData` 중복
   - 질문: "효율 계산을 별도 서비스 클래스로 추상화하는 설계 패턴 제안"
   - 예상 구조:
     ```javascript
     class EfficiencyCalculator {
         static compare(normalSimulator, stepupSimulator, range) { ... }
         static findTargetProbability(simulator, targetProb) { ... }
     }
     ```

2. **시나리오 기반 시뮬레이터**
   - 현재: 가챠 타입별로 하드코딩된 로직
   - 질문: "새로운 가챠 타입(예: 위시 가챠) 추가 시 기존 코드 수정 최소화 방법"
   - 요구사항: 설정 파일 기반 시뮬레이터 엔진 설계

3. **반응형 차트 업데이트**
   - 질문: "입력값 변경 시 전체 차트 재생성 대신 증분 업데이트 가능한가?"
   - 조건: Chart.js 4.4.1 + ChartDataLabels 2.2.0

### 5.3 수학적 검증
1. **천장 확률 계산 정확성**
   - 현재: 천장을 확정 획득으로 처리 ([ProbabilityEngine.js:33-43](js/core/ProbabilityEngine.js#L33-L43))
   - 질문: "천장 카운트가 소수(예: 1.8회)일 때 처리 방법 (floor vs 확률적 처리)"

2. **그룹별 독립성 가정 검증**
   - 2성 가챠 컨벌루션이 그룹 간 독립성 전제 ([Star2GachaViewModel.js:167](js/viewmodel/gacha/Star2GachaViewModel.js#L167))
   - 질문: "교집합 보정 필요 여부 (예: A그룹과 B그룹에서 동시 획득)"

### 5.4 UI/UX 개선
1. **대용량 데이터 시각화**
   - 질문: "400회 이상 시뮬레이션 결과를 사용자가 이해하기 쉽게 표현하는 방법"
   - 요구사항: 히트맵, 백분위수 표시, 인터랙티브 필터링

2. **실시간 계산 피드백**
   - 질문: "DP 계산 중 프로그레스 바 표시를 위한 Web Worker + SharedArrayBuffer 활용법"

---

## 6. Gemini 컨텍스트 가이드 (핵심 규칙)

### 6.1 가챠 메커니즘
1. **천장 시스템**
   - 일반 가챠: 200회당 셀렉 티켓 1개
   - 스탭업 가챠: 50회당 셀렉 티켓 1개 (2성)
   - 통합 계산: `Math.floor((normalPulls + stepPulls) / 200)`

2. **확률 뻥튀기 규칙**
   - 3성 일반: 기본 확률 (예: 1%)
   - 3성 Step4: 40배수 회차에 확률 부스트 (예: 40%)
   - 2성 일반: 10배수 회차에 전체 95% 보정 (개별 `95/N`)
   - 2성 스탭업: 5회, 15회, 25회, ... 에 확정 획득 (`100/N`)

3. **타겟팅 모드**
   - `targetCount = 0`: 전체 수집 모드 (M=N)
   - `targetCount > 0`: 저격 모드 (특정 캐릭터만)
   - 2성 그룹 모드: `viewTargetGroup`에 따라 동적 타겟 변경

### 6.2 DP 상태 정의
- **수집 DP (`dp`)**: `dp[k]` = k명을 수집한 확률
  - 갱신: `dp[k+1] += dp[k] × p_new` ([ProbabilityEngine.js:27](js/core/ProbabilityEngine.js#L27))

- **총획득 DP (`dpTotal`)**: `dpTotal[k]` = k개를 획득한 확률 (중복 포함)
  - 갱신: `dpTotal[k+1] += dpTotal[k] × p_any` ([ProbabilityEngine.js:79](js/core/ProbabilityEngine.js#L79))

### 6.3 확률 계산 안전장치
```javascript
// 개별 확률 × 개수 = 전체 확률 (최대 1.0)
p_any = ProbabilityValidator.getTotalProb(p_indiv, M);

// 예시: p_indiv=0.01, M=150
// 단순 곱셈: 0.01 × 150 = 1.5 (불가능)
// 보정 결과: Math.min(1.5, 1.0) = 1.0
```

### 6.4 설정 저장 정책
- **저장되는 값**: 픽업수, 확률, 주회 설정, 보상 선택
- **저장 안 되는 값**: 뽑기 횟수 (`normalPulls`, `stepPulls`)
- **저장소**: LocalStorage (`StorageManager.js`)
- **키 형식**: `shani_gacha_3star`, `shani_gacha_2star`, `shani_gacha_birthday`

### 6.5 확장 시나리오 예시
**새 가챠 타입 "위시 가챠" 추가 시**
1. [GachaConstants.js](js/core/GachaConstants.js)에 `CONFIG.WISH` 추가
2. `WishGachaModel.js` 생성 (Observable 기반)
3. `WishGachaViewModel.js` 생성 (`BaseGachaViewModel` 상속)
4. `GachaResultView.renderWish()` 메서드 추가
5. [index.html](index.html)에 탭 추가
6. [main.js](js/main.js)에 ViewModel 인스턴스 추가

---

## 7. 우선순위 개선 로드맵

### Phase 1: 긴급 (안정성)
- [ ] [Star3GachaViewModel.js:89-97](js/viewmodel/gacha/Star3GachaViewModel.js#L89-L97) DOM 조작 제거
- [ ] [main.js:7](js/main.js#L7) Chart.js import 명시화
- [ ] [GachaConstants.js](js/core/GachaConstants.js)에 마법 숫자 상수화 (40, 200, 50 등)

### Phase 2: 중요 (성능)
- [ ] 효율 계산 결과 캐싱
- [ ] Chart.js 재렌더링 최적화 (`update()` 활용)
- [ ] ProbabilityEngine 단위 테스트 작성

### Phase 3: 선택 (확장성)
- [ ] EfficiencyCalculator 서비스 클래스 분리
- [ ] 설정 기반 시뮬레이터 엔진 설계
- [ ] Web Worker 기반 비동기 계산

---

## 8. Gemini 협업 체크리스트

**Gemini에게 코드를 요청할 때 반드시 전달할 정보:**
- [ ] 대상 가챠 타입 (3성/2성/생일)
- [ ] 수정 대상 파일 경로
- [ ] 기존 Observable 패턴 유지 여부
- [ ] LocalStorage 저장 필요 여부
- [ ] 차트 렌더링 영향 범위

**Gemini 출력물 검증 항목:**
- [ ] ProbabilityValidator를 통한 확률 보정 사용
- [ ] `isInitializing` 플래그 고려
- [ ] Chart.js 참조 객체 destroy 처리
- [ ] DP 배열 인덱스 범위 체크

---

## 9. 참고 자료

- **주요 알고리즘**: Coupon Collector Problem (쿠폰 수집가 문제)
- **DP 전이식**: `P(k+1) = P(k) × (M-k)/N`
- **컨벌루션**: 독립 사건의 확률 분포 합성
- **Chart.js 문서**: https://www.chartjs.org/docs/latest/
- **DP 최적화 논문**: FFT-based convolution for gacha simulation (검색 키워드)

---

**마지막 업데이트**: 이 문서는 코드 변경 시 함께 업데이트되어야 합니다.
**다음 분석 예정일**: 1.8.0 버전 릴리스 후